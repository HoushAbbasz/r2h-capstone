import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const app = express();
app.use(cors());
app.use(express.json());


const authenticate = (req, res, next) => {

  // Extract the token from the Authorization header the header looks like: "Bearer eyJhbGci..."
  // .split(" ")[1] grabs everything after "Bearer "
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  // If toke is valid and not expired, give user access to login information 
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user.admin) return res.status(403).json({ error: "Admins only" });
  next();
};

// ─── AUTH ROUTES ──────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO USER (username, password_hash) VALUES (?, ?)",
      [username, hash]
    );
    res.status(201).json({ message: "User registered", user_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ error: "Username already in use" });
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [[user]] = await db.query("SELECT * FROM USER WHERE username = ?", [username]);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    if (user.flagged) {
      return res.status(403).json({ error: "banned", message: "Your account has been banned for misconduct." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, admin: user.admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token: token, username: user.username, user_id: user.user_id, admin: user.admin });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────

// GET /api/admin/users?search=
app.get("/api/admin/users", authenticate, adminOnly, async (req, res) => {
  const { search = "" } = req.query;
  const [users] = await db.query(
    "SELECT user_id, username, admin, flagged,created_at FROM USER WHERE username LIKE ?",
    [`%${search}%`]
  );
  res.json(users);
});

// GET /api/admin/items?search=
app.get("/api/admin/items", authenticate, adminOnly, async (req, res) => {
  const { search = "" } = req.query;
  const [items] = await db.query(
    "SELECT * FROM ITEM WHERE item_name LIKE ? OR description LIKE ?",
    [`%${search}%`, `%${search}%`]
  );
  res.json(items);
});

// PATCH /api/admin/users/:id
app.patch("/api/admin/users/:id/flag", authenticate, adminOnly, async (req, res) => {
  const { flagged } = req.body; 
  await db.query("UPDATE USER SET flagged = ? WHERE user_id = ?", [flagged, req.params.id]);
  res.json({ message: flagged ? "User flagged" : "User unflagged" });
});
// PATCH /api/admin/items/:id
app.patch("/api/admin/items/:id/flag", authenticate, adminOnly, async (req, res) => {
  const { flagged } = req.body; 
  await db.query("UPDATE ITEM SET flagged = ? WHERE item_id = ?", [flagged, req.params.id]);
  res.json({ message: flagged ? "Item flagged" : "Item unflagged" });
});

// POST /api/admin/ai-scan  AI ANOMALY DETECTION 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/admin/ai-scan", authenticate, adminOnly, async (req, res) => {
  try {

    const [items] = await db.query(
      "SELECT item_id, item_name, description, starting_bid, current_bid FROM ITEM ORDER BY item_id DESC LIMIT 50"
    );

    const prompt = `
  You are a fraud detection AI for an anime/manga/cartoon merchandise auction site.

  FLAG ITEMS IF:
  - Not anime/manga/cartoon related (e.g. iPhone, Nike shoes, gift cards)
  - Price is unrealistic (e.g. Naruto pencil for $40, DBZ sticker for $500)
  - Description is vague or scam-like (e.g. "DM me", "trust me", "contact telegram")
  - Starting bid is $0 or absurdly low

  Items: ${JSON.stringify(items)}

  Reply in this JSON only, no extra text:
  {
    "flagged_items": [{ "item_id": 1, "reason": "...", "flag_type": "wrong_category | pricing_anomaly | suspicious_description | scam_pattern" }]
  }

  Return an empty array if nothing is suspicious.
`;

 const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

const rawText =  response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("Empty Gemini response:", JSON.stringify(response, null, 2));
      return res.status(500).json({ error: "AI returned empty response" });
    }

    const clean = rawText.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text was:", clean);
      return res.status(500).json({ error: "AI response was not valid JSON", raw: clean });
    }

    res.json(result);

  } catch (err) {
    console.error("AI scan error:", err);
    res.status(500).json({ error: "AI scan failed", detail: err.message });
  }
});

app.get("/api/admin/reported-users", authenticate, adminOnly, async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.report_id, r.reason, r.created_at,
              reporter.username AS reporter_username, r.reporter_id,
              reported.username AS reported_username, r.reported_user_id,
              reported.flagged
       FROM REPORT r
       JOIN USER reporter ON r.reporter_id = reporter.user_id
       JOIN USER reported ON r.reported_user_id = reported.user_id
       WHERE r.type = 'user'
       ORDER BY r.created_at DESC`
    );
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reported users", detail: err.message });
  }
});
 
// GET /api/admin/reported-items
app.get("/api/admin/reported-items", authenticate, adminOnly, async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT r.report_id, r.reason, r.created_at,
              reporter.username AS reporter_username, r.reporter_id,
              i.item_id, i.item_name, i.status, i.flagged, i.seller_id,
              seller.username AS seller_username
       FROM REPORT r
       JOIN USER reporter ON r.reporter_id = reporter.user_id
       JOIN ITEM i ON r.reported_item_id = i.item_id
       JOIN USER seller ON i.seller_id = seller.user_id
       WHERE r.type = 'item'
       ORDER BY r.created_at DESC`
    );
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reported items", detail: err.message });
  }
});


 app.post("/api/admin/message-user", authenticate, adminOnly, async (req, res) => {
  const { recipient_id, item_id, body } = req.body;
  if (!recipient_id || !item_id || !body?.trim())
    return res.status(400).json({ error: "recipient_id, item_id, and body are required" });

  try {
    // Verify item exists
    const [[item]] = await db.query("SELECT item_id FROM ITEM WHERE item_id = ?", [item_id]);
    if (!item) return res.status(404).json({ error: "Item not found" });

    await db.query(
      `INSERT INTO MESSAGE (sender_id, recipient_id, item_id, body, type)
       VALUES (?, ?, ?, ?, 'admin')`,
      [req.user.user_id, recipient_id, item_id, body.trim()]
    );
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    console.error("admin/message-user error:", err);
    res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});

// ─── ACCOUNT ROUTES ─────────────────────────────────────────────────

// GET /api/account/won — items the logged-in user won (highest bid when status = inactive)
app.get("/api/account/won", authenticate, async (req, res) => {
  try {
    const [items] = await db.query(
    `SELECT i.item_id, i.item_name, i.description, i.starting_bid,
            i.current_bid, i.end_date, i.status, i.seller_id,
            u.username AS seller_username
    FROM ITEM i
    JOIN USER u ON i.seller_id = u.user_id
    JOIN BID b ON b.item_id = i.item_id
                AND b.bidder_id = ?
                AND b.amount = i.current_bid
    WHERE (i.status = 'inactive' OR i.end_date <= NOW())
    GROUP BY i.item_id
    ORDER BY i.end_date DESC`,
    [req.user.user_id]
  );
    res.json(items);
  } catch (err) {
    console.error("account/won error:", err);
    res.status(500).json({ error: "Failed to fetch won items", detail: err.message });
  }
});
 
// GET /api/account/selling — all items the logged-in user has listed
app.get("/api/account/selling", authenticate, async (req, res) => {
  try {
    const [items] = await db.query(
    `SELECT i.item_id, i.item_name, i.description, i.starting_bid,
            i.current_bid, i.end_date, i.status, i.flagged,
            COUNT(b.bid_id) AS bid_count,
            (SELECT b2.bidder_id FROM BID b2
            WHERE b2.item_id = i.item_id
              AND b2.amount = i.current_bid
            LIMIT 1) AS winner_id,
            (SELECT u2.username FROM BID b2
            JOIN USER u2 ON b2.bidder_id = u2.user_id
            WHERE b2.item_id = i.item_id
              AND b2.amount = i.current_bid
            LIMIT 1) AS winner_username
    FROM ITEM i
    LEFT JOIN BID b ON i.item_id = b.item_id
    WHERE i.seller_id = ?
    GROUP BY i.item_id
    ORDER BY i.end_date DESC`,
    [req.user.user_id]
  );
    res.json(items);
  } catch (err) {
    console.error("account/selling error:", err);
    res.status(500).json({ error: "Failed to fetch selling items", detail: err.message });
  }
});
 
// GET /api/account/bidding — active items the logged-in user is bidding on
app.get("/api/account/bidding", authenticate, async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT i.item_id, i.item_name, i.description, i.current_bid,
              i.end_date, i.status, u.username AS seller_username,
              MAX(b.amount) AS my_highest_bid,
              (MAX(b.amount) = i.current_bid) AS is_winning
       FROM BID b
       JOIN ITEM i ON b.item_id = i.item_id
       JOIN USER u ON i.seller_id = u.user_id
       WHERE b.bidder_id = ?
         AND i.status = 'active'
         AND i.end_date > NOW() 
       GROUP BY i.item_id
       ORDER BY i.end_date ASC`,
      [req.user.user_id]
    );
    res.json(items);
  } catch (err) {
    console.error("account/bidding error:", err);
    res.status(500).json({ error: "Failed to fetch bidding items", detail: err.message });
  }
});

// ─── BROWSE / BID ROUTES ─────────────────────────────────────────────────
app.get("/api/items", async (req, res) => {
  try {
    const { search = "", status = "active", sort = "end_date_asc" } = req.query;
 
    const validSorts = {
      end_date_asc:   "i.end_date ASC",
      end_date_desc:  "i.end_date DESC",
      bid_asc:        "COALESCE(i.current_bid, i.starting_bid) ASC",
      bid_desc:       "COALESCE(i.current_bid, i.starting_bid) DESC",
      newest:         "i.start_date DESC",
    };
    const orderBy = validSorts[sort] ?? validSorts.end_date_asc;
 
    const validStatuses = ["active", "inactive", "all"];
    const statusFilter = validStatuses.includes(status) ? status : "active";
    const statusClause =
    statusFilter === "all"    ? "" :
    statusFilter === "active" ? "AND i.status = ? AND i.end_date > NOW()" :
                                "AND (i.status = ? OR i.end_date <= NOW())";
    const params = statusFilter === "all"
      ? [`%${search}%`, `%${search}%`]
      : [`%${search}%`, `%${search}%`, statusFilter];
 
    const [items] = await db.query(
      `SELECT i.item_id, i.item_name, i.description, i.starting_bid,
          i.current_bid, i.status, i.start_date, i.end_date,
          i.flagged, i.image, u.username AS seller_username,
          COUNT(b.bid_id) AS bid_count
       FROM ITEM i
       JOIN USER u ON i.seller_id = u.user_id
       LEFT JOIN BID b ON i.item_id = b.item_id
       WHERE (i.item_name LIKE ? OR i.description LIKE ?)
         AND i.flagged = 0
         ${statusClause}
       GROUP BY i.item_id
       ORDER BY ${orderBy}`,
      params
    );
    res.json(items);
  } catch (err) {
    console.error("GET /api/items error:", err);
    res.status(500).json({ error: "Failed to fetch items", detail: err.message });
  }
});
 
// GET /api/items/:id — single item detail for bid page
app.get("/api/items/:id", async (req, res) => {
  try {
    const [[item]] = await db.query(
      `SELECT i.item_id, i.item_name, i.description, i.starting_bid,
              i.current_bid, i.status, i.start_date, i.end_date,
              i.flagged, i.seller_id, i.image,
              u.username AS seller_username,
              COUNT(b.bid_id) AS bid_count
      FROM ITEM i
      JOIN USER u ON i.seller_id = u.user_id
      LEFT JOIN BID b ON i.item_id = b.item_id
      WHERE i.item_id = ?
      GROUP BY i.item_id`,
      [req.params.id]
    );
    
    if (!item) return res.status(404).json({ error: "Item not found" });
 
    // Recent bids
    const [bids] = await db.query(
      `SELECT b.amount, b.bid_time, u.username
       FROM BID b
       JOIN USER u ON b.bidder_id = u.user_id
       WHERE b.item_id = ?
       ORDER BY b.amount DESC
       LIMIT 10`,
      [req.params.id]
    );
 
    res.json({ ...item, recent_bids: bids });
  } catch (err) {
    console.error("GET /api/items/:id error:", err);
    res.status(500).json({ error: "Failed to fetch item", detail: err.message });
  }
});
 
// POST /api/items/:id/bid — place a bid
app.post("/api/items/:id/bid", authenticate, async (req, res) => {
  const { amount } = req.body;
  const itemId = req.params.id;
 
  if (!amount || isNaN(amount) || Number(amount) <= 0)
    return res.status(400).json({ error: "Invalid bid amount" });
 
  try {
    const [[item]] = await db.query(
      "SELECT item_id, seller_id, status, starting_bid, current_bid, end_date FROM ITEM WHERE item_id = ?",
      [itemId]
    );
    if (!item)               return res.status(404).json({ error: "Item not found" });
    if (item.status !== "active") return res.status(400).json({ error: "Auction is not active" });
    if (new Date(item.end_date) < new Date()) return res.status(400).json({ error: "Auction has ended" });
    if (item.seller_id === req.user.user_id)  return res.status(400).json({ error: "You cannot bid on your own item" });
 
    const minBid = item.current_bid
      ? Number(item.current_bid) + 0.01
      : Number(item.starting_bid);
 
    if (Number(amount) < minBid)
      return res.status(400).json({ error: `Bid must be at least $${minBid.toFixed(2)}` });
 
    await db.query(
      "INSERT INTO BID (item_id, bidder_id, amount) VALUES (?, ?, ?)",
      [itemId, req.user.user_id, amount]
    );
    await db.query(
      "UPDATE ITEM SET current_bid = ? WHERE item_id = ?",
      [amount, itemId]
    );
 
    res.status(201).json({ message: "Bid placed successfully", new_bid: amount });
  } catch (err) {
    console.error("POST /api/items/:id/bid error:", err);
    res.status(500).json({ error: "Failed to place bid", detail: err.message });
  }
});

// ─── SELL ROUTE ───────────────────────────────────────────────────
 
// POST /api/items — create a new auction listing
app.post("/api/items", authenticate, async (req, res) => {
  try {
    const { item_name, description, starting_bid, end_date } = req.body;
 
    if (!item_name || !item_name.trim())
      return res.status(400).json({ error: "Item name is required" });
    if (!starting_bid || isNaN(starting_bid) || Number(starting_bid) <= 0)
      return res.status(400).json({ error: "Starting bid must be a positive number" });
    if (!end_date)
      return res.status(400).json({ error: "End date is required" });
 
  const end = new Date(end_date);
  if (isNaN(end.getTime()) || end <= new Date())
    return res.status(400).json({ error: "End date must be in the future" });

  const endUTC = end.toISOString().slice(0, 19).replace("T", " ");

  const [result] = await db.query(
    `INSERT INTO ITEM (item_name, description, starting_bid, start_date, end_date, seller_id, status)
    VALUES (?, ?, ?, NOW(), ?, ?, 'active')`,
    [item_name.trim(), description?.trim() ?? "", Number(starting_bid), endUTC, req.user.user_id]
  );
 
    res.status(201).json({ message: "Listing created", item_id: result.insertId });
  } catch (err) {
    console.error("POST /api/items error:", err);
    res.status(500).json({ error: "Failed to create listing", detail: err.message });
  }
});


// ── MESSAGE ROUTES ────────────────────────────────────────────────
 
// GET /api/messages — all messages where logged-in user is the recipient
app.get("/api/messages", authenticate, async (req, res) => {
  try {
    const [messages] = await db.query(
      `SELECT m.message_id, m.body, m.type, m.is_read, m.created_at,
              m.item_id, i.item_name,
              m.sender_id, u.username AS sender_username
       FROM MESSAGE m
       JOIN ITEM i ON m.item_id = i.item_id
       JOIN USER u ON m.sender_id = u.user_id
       WHERE m.recipient_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.user_id]
    );
    res.json(messages);
  } catch (err) {
    console.error("GET /api/messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages", detail: err.message });
  }
});
 
// PATCH /api/messages/:id/read — mark a message as read
app.patch("/api/messages/:id/read", authenticate, async (req, res) => {
  try {
    await db.query(
      "UPDATE MESSAGE SET is_read = 1 WHERE message_id = ? AND recipient_id = ?",
      [req.params.id, req.user.user_id]
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});
 
// DELETE /api/messages/:id — seller deletes a message they received
app.delete("/api/messages/:id", authenticate, async (req, res) => {
  try {
    const [[msg]] = await db.query(
      "SELECT message_id, recipient_id FROM MESSAGE WHERE message_id = ?",
      [req.params.id]
    );
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.recipient_id !== req.user.user_id)
      return res.status(403).json({ error: "Not your message" });
 
    await db.query("DELETE FROM MESSAGE WHERE message_id = ?", [req.params.id]);
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});
 
// POST /api/messages/:id/report-sender — report the user who sent a message
app.post("/api/messages/:id/report-sender", authenticate, async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: "Reason is required" });
 
  try {
    const [[msg]] = await db.query(
      "SELECT message_id, sender_id, recipient_id FROM MESSAGE WHERE message_id = ?",
      [req.params.id]
    );
    if (!msg) return res.status(404).json({ error: "Message not found" });
    if (msg.recipient_id !== req.user.user_id)
      return res.status(403).json({ error: "Not your message" });
 
    await db.query(
      "INSERT INTO REPORT (reporter_id, reported_user_id, reason, type) VALUES (?, ?, ?, 'user')",
      [req.user.user_id, msg.sender_id, reason.trim()]
    );
    res.status(201).json({ message: "User reported" });
  } catch (err) {
    res.status(500).json({ error: "Failed to report user" });
  }
});
 
// POST /api/items/:id/report — report an item to admins
app.post("/api/items/:id/report", authenticate, async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: "Reason is required" });
 
  try {
    const [[item]] = await db.query("SELECT item_id FROM ITEM WHERE item_id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ error: "Item not found" });
 
    await db.query(
      "INSERT INTO REPORT (reporter_id, reported_item_id, reason, type) VALUES (?, ?, ?, 'item')",
      [req.user.user_id, req.params.id, reason.trim()]
    );
    res.status(201).json({ message: "Item reported" });
  } catch (err) {
    res.status(500).json({ error: "Failed to report item" });
  }
});

app.post("/api/messages/send", authenticate, async (req, res) => {
  const { recipient_id, item_id, body } = req.body;
  if (!recipient_id || !item_id || !body?.trim())
    return res.status(400).json({ error: "recipient_id, item_id, and body are required" });

  if (recipient_id === req.user.user_id)
    return res.status(400).json({ error: "Cannot message yourself" });

  try {
    // Verify a closed auction relationship exists between sender and recipient on this item
    const [[item]] = await db.query(
      `SELECT i.item_id, i.seller_id, i.current_bid
       FROM ITEM i
       WHERE i.item_id = ?
         AND (i.status = 'inactive' OR i.end_date <= NOW())`,
      [item_id]
    );
    if (!item) return res.status(403).json({ error: "No completed auction found for this item" });

    // Check sender is either the seller or the winning bidder
    const [[winningBid]] = await db.query(
      `SELECT bidder_id FROM BID
       WHERE item_id = ? AND amount = ?
       LIMIT 1`,
      [item_id, item.current_bid]
    );
    const winnerId = winningBid?.bidder_id;
    const sellerId = item.seller_id;
    const senderId = req.user.user_id;

    const senderIsParty  = senderId === sellerId || senderId === winnerId;
    const recipientIsParty = Number(recipient_id) === sellerId || Number(recipient_id) === winnerId;

    if (!senderIsParty || !recipientIsParty)
      return res.status(403).json({ error: "You are not a party to this auction" });

    await db.query(
      `INSERT INTO MESSAGE (sender_id, recipient_id, item_id, body, type)
       VALUES (?, ?, ?, ?, 'buyer')`,
      [senderId, recipient_id, item_id, body.trim()]
    );
    res.status(201).json({ message: "Message sent" });
  } catch (err) {
    console.error("messages/send error:", err);
    res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
