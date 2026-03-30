// import react hooks for state and side effects
import { useState, useEffect } from "react";
// import navigation hook from react router
import { useNavigate } from "react-router-dom";
// import authentication context for token and username
import { useAuth } from "../context/AuthContext";

// base api url for all requests
const API = "https://86yc8vtkk4.execute-api.us-east-1.amazonaws.com";

// color palette object for consistent theming throughout the component
const T = {
  orange:      "#E8621A", 
  orangeHover: "#F4823C", 
  orangePale:  "#FDE8D6", 
  amber:       "#D4920A", 
  amberLight:  "#F0B429", 
  amberPale:   "#FEF5DC", 
  ink:         "#1C1008", 
  inkMid:      "#3D2B10", 
  inkLight:    "#7A5C30", 
  inkFaint:    "#C4A882", 
  cream:       "#FDF6EC", 
  card:        "#FFFAF3", 
  border:      "#EDE0C8", 
  red:         "#C0392B", 
  redPale:     "#FDECEA", 
  green:       "#1E7A45",
  greenPale:   "#E0F5E9", 
};
// primary ui font stack
const fontUI      = "'DM Sans', 'Segoe UI', sans-serif";
// display/heading font stack
const fontDisplay = "Georgia, serif";

// configuration object for status badge styles and labels
const STATUS_CONFIG = {
  active:   { bg: T.greenPale,  color: T.green,  border: "#A8DFC0", label: "Active" },  
  inactive: { bg: T.orangePale, color: T.orange,  border: "#F0B080", label: "Closed" },
};

// badge sub-component renders a colored status pill
function Badge({ status, endDate }) {
  // check if the end date has already passed to override status
  const ended = endDate && new Date(endDate) <= new Date();
  // use inactive if ended regardless of what status says
  const resolved = ended ? "inactive" : status;
  // look up the style config, fall back to amber if status is unknown
  const s = STATUS_CONFIG[resolved] ?? { bg: T.amberPale, color: T.amber, border: "#E8C97A", label: status };
  return (
    // render a small uppercase pill span with dynamic colors
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",        
      padding: "3px 9px", borderRadius: 999,                         
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, 
      textTransform: "uppercase", fontFamily: fontUI,                
    }}>{s.label}</span>
  );
}

// timeleft sub-component renders how long remains until auction ends
function TimeLeft({ endTime }) {
  // calculate milliseconds until end
  const end  = new Date(endTime);
  const diff = end - new Date();
  // if already ended show faded "ended" text
  if (diff <= 0) return <span style={{ color: T.inkFaint, fontSize: 12, fontFamily: fontUI }}>Ended</span>;
  // calculate hours and minutes from milliseconds
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  // calculate full days from hours
  const d = Math.floor(h / 24);
  // format as "Xd Yh left" or "Xh Ym left" depending on magnitude
  const display = d > 0 ? `${d}d ${h % 24}h left` : `${h}h ${m}m left`;
  // mark as urgent if less than 3 hours remain
  const urgent  = diff < 3600000 * 3;
  return (
    // render time string with red color and bold weight when urgent
    <span style={{
      fontSize: 12, fontWeight: urgent ? 700 : 500,              
      color: urgent ? T.red : T.inkLight, fontFamily: fontUI,  
    }}>
      {urgent ? "⚡ " : "⏱ "}{display}
    </span>
  );
}

// stat sub-component renders a small label/value pair
function Stat({ label, value, accent }) {
  return (
    // vertical stack of label then value
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: T.inkFaint,           
        textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: fontUI,
      }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: accent ? 700 : 500,               
        color: accent ? T.orange : T.inkMid, fontFamily: fontUI,    
      }}>{value}</span>
    </div>
  );
}

// itemcard sub-component renders a single auction item card
function ItemCard({ item, variant, onMessage }) {
  // track hover state for visual feedback
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}   
      onMouseLeave={() => setHovered(false)}  
      style={{
        border: `1.5px solid ${hovered ? T.orange : T.border}`,        
        borderRadius: 12, padding: "16px 18px",                          
        background: T.card,                                               
        boxShadow: hovered ? "0 6px 24px rgba(232,98,26,0.12)" : "0 2px 8px rgba(60,30,5,0.06)", 
        display: "flex", flexDirection: "column", gap: 10,              
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s", 
        transform: hovered ? "translateY(-2px)" : "translateY(0)",      
        cursor: "default",                                               
        fontFamily: fontUI,
      }}
    >
      {/* top row: item name and status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: T.inkMid, lineHeight: 1.3, flex: 1, fontFamily: fontDisplay }}>
          {item.item_name} 
        </span>
        <Badge status={item.status} endDate={item.end_date} /> 
      </div>

      {/* description text clamped to 2 lines if present */}
      {item.description && (
        <p style={{
          margin: 0, fontSize: 12, color: T.inkLight, lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2,        
          WebkitBoxOrient: "vertical", overflow: "hidden",   
        }}>{item.description}</p>
      )}

      {/* bottom stats row with border separator */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "8px 18px", marginTop: 4,
        paddingTop: 10, borderTop: `1px solid ${T.border}`,  
      }}>
        {/* won variant: shows paid amount, seller name, end date, and message button */}
        {variant === "won" && (
          <>
            <Stat label="Paid"   value={`$${item.current_bid ?? item.starting_bid}`} accent /> 
            <Stat label="Seller" value={item.seller_username} />                              
            <Stat label="Ended"  value={new Date(item.end_date).toLocaleDateString()} />      
            <button
            onClick={() => onMessage({
              item_id: item.item_id,           
              item_name: item.item_name,       
              recipient_id: item.seller_id,   
              recipient_name: item.seller_username, 
            })}
        style={{
          padding: "4px 12px", borderRadius: 999, border: "none",    
          fontFamily: fontUI, fontSize: 11, fontWeight: 700, cursor: "pointer",
          background: T.amberPale, color: T.amber,                    
        }}
      >✉ Message Seller</button>  {/* envelope icon with label */}
          </>
        )}
        {/* selling variant: shows current bid, starting bid, bid count, flags, time, and message winner */}
        {variant === "selling" && (() => {
          // check if auction has ended
          const ended = new Date(item.end_date) <= new Date();
          return (
            <>
              <Stat label="Current Bid" value={item.current_bid ? `$${item.current_bid}` : "—"} accent /> 
              <Stat label="Starting" value={`$${item.starting_bid}`} />                              
              <Stat label="Bids" value={item.bid_count ?? 0} />                                  
              {item.flagged && <span style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>🚩 Flagged</span>} 
              {!ended && <TimeLeft endTime={item.end_date} />} 
              {/* show message buyer button only if ended and has a winner */}
              {ended && item.winner_id && (
                <button
                  onClick={() => onMessage({
                    item_id: item.item_id,               
                    item_name: item.item_name,          
                    recipient_id: item.winner_id,        
                    recipient_name: item.winner_username, 
                  })}
                  style={{
                    padding: "4px 12px", borderRadius: 999, border: "none", 
                    fontFamily: fontUI, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: T.amberPale, color: T.amber,               
                  }}
                >✉ Message Buyer</button>  
              )}
            </>
          );
        })()}
        {/* bidding variant: shows current bid, user's bid, seller, win/outbid status, and time */}
        {variant === "bidding" && (() => {
        // check if auction has ended
        const ended = new Date(item.end_date) <= new Date();
            return (
                <>
                <Stat label="Current Bid" value={`$${item.current_bid}`} />                                      
                <Stat label="My Bid" value={`$${item.my_highest_bid}`} accent={!!item.is_winning} />              
                <Stat label="Seller" value={item.seller_username} />                                               
                {item.is_winning
                    ? <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>
                        {ended ? "🏆 Won" : "✅ Winning"}  
                    </span>
                    : <span style={{ fontSize: 11, color: T.orange, fontWeight: 700 }}>⚠️ Outbid</span> 
                }
                {!ended && <TimeLeft endTime={item.end_date} />} 
                </>
        );
        })()}
      </div>
    </div>
  );
}

// section sub-component renders a titled group of item cards
function Section({ title, icon, items, variant, loading, error, onMessage }) {
  return (
    // section wrapper with bottom margin
    <section style={{ marginBottom: 48 }}>
      {/* section header row with icon, title, and item count badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>  {/* section icon emoji */}
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 700,
          color: T.inkMid, fontFamily: fontDisplay, letterSpacing: "-0.01em",
        }}>{title}</h2>  {/* section heading text */}
        {/* only show count badge when not loading and no error */}
        {!loading && !error && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: T.amberPale, color: T.amber,
            border: `1px solid #E8C97A`,
            borderRadius: 999, padding: "2px 10px", fontFamily: fontUI,
          }}>{items.length}</span> 
        )}
      </div>

      {/* loading state */}
      {loading && <div style={{ color: T.inkFaint, fontSize: 14, fontFamily: fontUI, padding: "20px 0" }}>Loading…</div>}
      {/* error state */}
      {error && (
        <div style={{
          color: T.red, fontSize: 13, padding: "12px 16px",
          background: T.redPale, borderRadius: 8, border: `1px solid #E9A8A3`,
          fontFamily: fontUI,
        }}>{error}</div>
      )}
      {/* empty state when loaded but no items */}
      {!loading && !error && items.length === 0 && (
        <div style={{ color: T.inkFaint, fontSize: 14, fontStyle: "italic", fontFamily: fontUI, padding: "20px 0" }}>
          Nothing here yet.
        </div>
      )}
      {/* grid of item cards when items exist */}
      {!loading && !error && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {/* map each item to an itemcard component */}
          {items.map((item) => <ItemCard key={item.item_id} item={item} variant={variant} onMessage={onMessage} />)}
        </div>
      )}
    </section>
  );
}

// reusable pill button style factory function returns a style object
const pillBtn = (color, bg, borderColor) => ({
  fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, 
  border: `1px solid ${borderColor}`, cursor: "pointer",                   
  color, background: bg, letterSpacing: "0.04em", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
});

// main account page component
export default function AccountPage() {
  // get auth token and username from context
  const { token, username } = useAuth();
  // navigation hook for programmatic routing
  const navigate = useNavigate();
  // auth header object used in all fetch calls
  const headers             = { Authorization: `Bearer ${token}` };

  // state arrays for each section's items
  const [won, setWon] = useState([]);          
  const [selling, setSelling] = useState([]);  
  const [bidding, setBidding] = useState([]);  
  const [messages,setMessages]= useState([]);  

  // loading states for each data section
  const [loadingWon,      setLoadingWon]      = useState(true);
  const [loadingSelling,  setLoadingSelling]  = useState(true);
  const [loadingBidding,  setLoadingBidding]  = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // error states for each data section
  const [errorWon,      setErrorWon]      = useState("");
  const [errorSelling,  setErrorSelling]  = useState("");
  const [errorBidding,  setErrorBidding]  = useState("");
  const [errorMessages, setErrorMessages] = useState("");

  // chat/message modal state
  const [chatModal, setChatModal] = useState(null);       
  const [chatBody, setChatBody] = useState("");           
  const [chatSending, setChatSending] = useState(false);  
  const [chatError, setChatError] = useState("");         
  const [chatSuccess, setChatSuccess] = useState("");    

  // report modal state
  const [reportModal, setReportModal] = useState(null);     
  const [reportReason, setReportReason] = useState("");     
  const [reportSending, setReportSending] = useState(false); 
  const [reportError, setReportError] = useState("");       
  const [reportSuccess, setReportSuccess] = useState("");   

  // helper function to fetch messages and update state
  const fetchMessages = () =>
    fetch(`${API}/api/messages`, { headers })
      .then((r) => r.json()).then(setMessages).catch(() => setErrorMessages("Failed to load"))
      .finally(() => setLoadingMessages(false));

  // fetch all data on component mount
  useEffect(() => {
    // fetch won items
    fetch(`${API}/api/account/won`,     { headers }).then((r) => r.json()).then(setWon).catch(() => setErrorWon("Failed to load")).finally(() => setLoadingWon(false));
    // fetch selling items
    fetch(`${API}/api/account/selling`, { headers }).then((r) => r.json()).then(setSelling).catch(() => setErrorSelling("Failed to load")).finally(() => setLoadingSelling(false));
    // fetch bidding items
    fetch(`${API}/api/account/bidding`, { headers }).then((r) => r.json()).then(setBidding).catch(() => setErrorBidding("Failed to load")).finally(() => setLoadingBidding(false));
    // fetch inbox messages
    fetchMessages();
  }, []); // empty deps array means run once on mount

  // delete a message by id and remove it from state
  const deleteMessage = async (id) => {
    // send delete request to api
    await fetch(`${API}/api/messages/${id}`, { method: "DELETE", headers });
    // filter out the deleted message from local state
    setMessages((prev) => prev.filter((m) => m.message_id !== id));
  };

  // open the report modal for a specific message id
  const reportSender = (id) => {
    setReportModal(id);      
    setReportReason("");    
    setReportError("");      
    setReportSuccess("");   
  };

  return (
    // full page container with cream background
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>
      {/* decorative gradient top stripe */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      {/* page header bar with username and list item button */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          {/* small uppercase label above the username */}
          <p style={{
            margin: "0 0 2px", fontSize: 11, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkFaint,
          }}>My Account</p>
          {/* large heading showing the username */}
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            fontFamily: fontDisplay, color: T.inkMid, letterSpacing: "-0.01em",
          }}>
            {username ?? "Your Collection"}  
          </h1>
        </div>
        {/* button to navigate to the sell/list item page */}
        <button
          onClick={() => navigate("/sell")}
          style={{
            background: T.orange, color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 8,
            fontFamily: fontUI, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.orangeHover; }}  
          onMouseLeave={(e) => { e.currentTarget.style.background = T.orange; }}      
        >+ List an Item</button>
      </div>

      {/* main content area with max width and auto margins */}
      <div style={{ padding: "40px 32px", maxWidth: 1060, margin: "0 auto" }}>

        {/* messages section */}
        <section style={{ marginBottom: 48 }}>
          {/* messages section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📬</span>  
            <h2 style={{
              margin: 0, fontSize: 18, fontWeight: 700,
              color: T.inkMid, fontFamily: fontDisplay,
            }}>Messages</h2>
            {/* show count badge once messages have loaded */}
            {!loadingMessages && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: T.amberPale, color: T.amber,
                border: `1px solid #E8C97A`,
                borderRadius: 999, padding: "2px 10px", fontFamily: fontUI,
              }}>{messages.length}</span> 
            )}
          </div>

          {/* loading state for messages */}
          {loadingMessages && <div style={{ color: T.inkFaint, fontSize: 14 }}>Loading…</div>}
          {/* error state for messages */}
          {errorMessages  && <div style={{ color: T.red,     fontSize: 13 }}>{errorMessages}</div>}
          {/* empty inbox state */}
          {!loadingMessages && !errorMessages && messages.length === 0 && (
            <div style={{ color: T.inkFaint, fontSize: 14, fontStyle: "italic" }}>No messages yet.</div>
          )}

          {/* render each message as a card */}
          {!loadingMessages && messages.map((m) => (
            <div key={m.message_id} style={{
              border: `1.5px solid ${m.is_read ? T.border : T.orange}`,  
              borderRadius: 10, padding: "14px 16px", marginBottom: 10,
              background: T.card,
              boxShadow: m.is_read ? "none" : `0 2px 12px rgba(232,98,26,0.10)`,  
            }}>
              {/* message header row with sender info and date */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {/* type badge: admin or buyer */}
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 999,
                    background: m.type === "admin" ? T.redPale  : T.greenPale, 
                    color:      m.type === "admin" ? T.red      : T.green,
                    border:     `1px solid ${m.type === "admin" ? "#E9A8A3" : "#A8DFC0"}`,
                  }}>{m.type === "admin" ? "Admin" : "Buyer"}</span> 
                  {/* sender username */}
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.inkMid }}>{m.sender_username}</span>
                  {/* item the message relates to */}
                  <span style={{ fontSize: 12, color: T.inkFaint }}>re: {m.item_name}</span>
                </div>
                {/* formatted date message was received */}
                <span style={{ fontSize: 11, color: T.inkFaint }}>
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* message body text */}
              <p style={{ margin: "0 0 12px", fontSize: 13, color: T.inkLight, lineHeight: 1.6 }}>
                {m.body}
              </p>

              {/* action buttons row */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {/* mark read button only shown if message is unread */}
                {!m.is_read && (
                  <button
                    onClick={async () => {
                      // send patch request to mark message as read
                      await fetch(`${API}/api/messages/${m.message_id}/read`, { method: "PATCH", headers });
                      // update local state to reflect read status
                      setMessages((prev) => prev.map((msg) =>
                        msg.message_id === m.message_id ? { ...msg, is_read: 1 } : msg
                      ));
                    }}
                    style={pillBtn(T.orange, T.orangePale, "#F0B080")}  
                  >Mark Read</button>
                )}
                {/* report sender button only shown for buyer-type messages */}
                {m.type === "buyer" && (
                  <button onClick={() => reportSender(m.message_id)}
                    style={pillBtn(T.amber, T.amberPale, "#E8C97A")}>🚩 Report Sender</button> 
                )}
                {/* delete message button always shown */}
                <button onClick={() => deleteMessage(m.message_id)}
                  style={pillBtn(T.red, T.redPale, "#E9A8A3")}>🗑 Delete</button>  // red delete button
              </div>
            </div>
          ))}
        </section>

        {/* auctions won section */}
        <Section title="Auctions Won" icon="🏆" items={won} variant="won" loading={loadingWon} error={errorWon} onMessage={(m) => {
          setChatModal(m);    
          setChatError("");   
          setChatSuccess(""); 
          }
          } />
        {/* your listings section */}
        <Section title="Your Listings" icon="🏷️" items={selling} variant="selling" loading={loadingSelling} error={errorSelling} onMessage={(m) => {
          setChatModal(m);   
          setChatError("");   
          setChatSuccess(""); 
          }
          } />
        {/* active bids section — no message handler needed for bidding */}
        <Section title="Active Bids"     icon="⚡" items={bidding} variant="bidding" loading={loadingBidding} error={errorBidding} />
      </div>

      {/* message compose modal overlay */}
      {chatModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,          
          background: "rgba(28,16,8,0.45)",                    
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}
          // clicking backdrop closes the modal
          onClick={() => { setChatModal(null); setChatBody(""); setChatError(""); setChatSuccess(""); }}
        >
          {/* modal card — stop propagation so clicks inside don't close it */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.card, borderRadius: 14, padding: "28px 28px 24px",
              width: "100%", maxWidth: 460,
              border: `1.5px solid ${T.border}`,
              boxShadow: "0 12px 48px rgba(28,16,8,0.18)",
              fontFamily: fontUI,
            }}
          >
            {/* modal heading showing recipient name */}
            <h3 style={{ margin: "0 0 4px", fontFamily: fontDisplay, fontSize: 17, color: T.inkMid }}>
              Message {chatModal.recipient_name}
            </h3>
            {/* subheading showing which item the message is about */}
            <p style={{ margin: "0 0 18px", fontSize: 12, color: T.inkFaint }}>
              Re: <strong style={{ color: T.inkMid }}>{chatModal.item_name}</strong>
            </p>

            {/* message textarea */}
            <textarea
              value={chatBody}
              onChange={(e) => setChatBody(e.target.value)}  
              placeholder="Type your message…"
              rows={4}
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                margin: "0 0 14px", padding: "9px 12px",
                background: T.cream, border: `1.5px solid ${T.border}`,
                borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
                outline: "none", resize: "vertical", 
              }}
            />

            {/* error message display */}
            {chatError && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: T.redPale, border: `1px solid #E9A8A3`,
                color: T.red, fontSize: 12, fontWeight: 600,
              }}>{chatError}</div>
            )}
            {/* success message display */}
            {chatSuccess && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: T.greenPale, border: `1px solid #A8DFC0`,
                color: T.green, fontSize: 12, fontWeight: 600,
              }}>{chatSuccess}</div>
            )}

            {/* modal action buttons row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {/* cancel button closes modal and resets state */}
              <button
                onClick={() => { setChatModal(null); setChatBody(""); setChatError(""); setChatSuccess(""); }}
                style={{
                  padding: "8px 16px", background: "transparent",
                  border: `1.5px solid ${T.border}`, borderRadius: 6,
                  fontFamily: fontUI, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", color: T.inkLight,
                }}
              >Cancel</button>
              {/* send button — disabled while sending */}
              <button
                disabled={chatSending}
                onClick={async () => {
                  // validate that message is not empty
                  if (!chatBody.trim()) { setChatError("Message cannot be empty."); return; }
                  setChatSending(true); setChatError(""); setChatSuccess("");  
                  try {
                    // post message to api
                    const res = await fetch(`${API}/api/messages/send`, {
                      method: "POST",
                      headers: { ...headers, "Content-Type": "application/json" },
                      body: JSON.stringify({ recipient_id: chatModal.recipient_id, item_id: chatModal.item_id, body: chatBody }),
                    });
                    const data = await res.json();
                    // show error if response is not ok
                    if (!res.ok) { setChatError(data.error ?? "Failed to send"); return; }
                    setChatSuccess("Message sent!");  
                    setChatBody("");                  
                  } catch { setChatError("Network error"); }  
                  finally { setChatSending(false); }          
                }}
                style={{
                  padding: "9px 20px", background: chatSending ? T.inkFaint : T.orange,  
                  color: "#fff", border: "none", borderRadius: 8,
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  cursor: chatSending ? "not-allowed" : "pointer",  
                }}
              >{chatSending ? "Sending…" : "Send"}</button>
            </div>
          </div>
        </div>
      )}
      {/* report user modal overlay */}
      {reportModal && (
  <div
    style={{
      position: "fixed", inset: 0, zIndex: 1001,           
      background: "rgba(28,16,8,0.45)",                    
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}
    // clicking backdrop closes the modal
    onClick={() => { setReportModal(null); setReportReason(""); setReportError(""); setReportSuccess(""); }}
  >
    {/* modal card — stop propagation so clicks inside don't close it */}
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: T.card, borderRadius: 14, padding: "28px 28px 24px",
        width: "100%", maxWidth: 440,
        border: `1.5px solid ${T.border}`,
        boxShadow: "0 12px 48px rgba(28,16,8,0.18)",
        fontFamily: fontUI,
      }}
    >
      {/* modal heading */}
      <h3 style={{ margin: "0 0 4px", fontFamily: fontDisplay, fontSize: 17, color: T.inkMid }}>
        🚩 Report Sender
      </h3>
      {/* instructions paragraph */}
      <p style={{ margin: "0 0 18px", fontSize: 12, color: T.inkFaint }}>
        Let us know why you're reporting this user. Admins will review your report.
      </p>

      {/* reason textarea */}
      <textarea
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}  
        placeholder="Describe the reason for reporting…"
        rows={4}
        style={{
          display: "block", width: "100%", boxSizing: "border-box",
          margin: "0 0 14px", padding: "9px 12px",
          background: T.cream, border: `1.5px solid ${T.border}`,
          borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
          outline: "none", resize: "vertical",  
        }}
      />

      {/* error message display */}
      {reportError && (
        <div style={{
          marginBottom: 12, padding: "8px 12px", borderRadius: 7,
          background: T.redPale, border: `1px solid #E9A8A3`,
          color: T.red, fontSize: 12, fontWeight: 600,
        }}>{reportError}</div>
      )}
      {/* success message display */}
      {reportSuccess && (
        <div style={{
          marginBottom: 12, padding: "8px 12px", borderRadius: 7,
          background: T.greenPale, border: `1px solid #A8DFC0`,
          color: T.green, fontSize: 12, fontWeight: 600,
        }}>{reportSuccess}</div>
      )}

      {/* modal action buttons row */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {/* cancel button closes modal and resets state */}
        <button
          onClick={() => { setReportModal(null); setReportReason(""); setReportError(""); setReportSuccess(""); }}
          style={{
            padding: "8px 16px", background: "transparent",
            border: `1.5px solid ${T.border}`, borderRadius: 6,
            fontFamily: fontUI, fontSize: 12, fontWeight: 700,
            cursor: "pointer", color: T.inkLight,
          }}
        >Cancel</button>
        {/* submit button — disabled while sending or after success */}
        <button
          disabled={reportSending || !!reportSuccess}
          onClick={async () => {
            // validate that a reason has been entered
            if (!reportReason.trim()) { setReportError("Please provide a reason."); return; }
            setReportSending(true); setReportError("");  // begin submit process
            try {
              // post report to api using the stored message id
              const res = await fetch(`${API}/api/messages/${reportModal}/report-sender`, {
                method: "POST",
                headers: { ...headers, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: reportReason.trim() }),
              });
              const data = await res.json();
              // show error if response is not ok
              if (!res.ok) { setReportError(data.error ?? "Failed to report"); return; }
              // show confirmation message
              setReportSuccess("User reported. Thank you — admins will review this.");
              } catch { setReportError("Network error"); }  
              finally { setReportSending(false); }           
            }}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                // faded when sending or already submitted, red otherwise
                background: reportSending || reportSuccess ? T.inkFaint : T.red,
                color: "#fff",
                cursor: reportSending || reportSuccess ? "not-allowed" : "pointer",
              }}
            >{reportSending ? "Reporting…" : reportSuccess ? "Reported" : "Submit Report"}</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}