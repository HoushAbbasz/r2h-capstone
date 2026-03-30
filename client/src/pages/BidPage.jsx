// import react hooks for state and side effects
import { useState, useEffect } from "react";
// import route parameter and navigation hooks from react router
import { useParams, useNavigate } from "react-router-dom";
// import authentication context for token and user id
import { useAuth } from "../context/AuthContext";
// import the site logo image asset
import logo from "../assets/logo.png";
// base api url for all requests
const API = import.meta.env.VITE_API_URL;
 
// color palette object for consistent theming
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
const fontUI      = "'DM Sans', 'Segoe UI', sans-serif";
const fontDisplay = "Georgia, serif";

// helper function that calculates time remaining until an end date
function timeLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { text: "Auction Ended", urgent: false, ended: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  return {
    text: d > 0 ? `${d}d ${h % 24}h ${m}m remaining` : `${h}h ${m}m remaining`,
    urgent: diff < 3600000 * 3,
    ended: false,
  };
}

// shared style object for the back navigation button
const backBtnStyle = {
  background: "transparent",
  border: `1.5px solid #EDE0C8`,
  borderRadius: 8,
  color: "#7A5C30",
  fontSize: 12, fontWeight: 700,
  padding: "8px 16px",
  cursor: "pointer",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  transition: "border-color 0.15s, color 0.15s",
};


// main bid page component
export default function BidPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user_id } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidMsg, setBidMsg] = useState(null);
  const [bidFocused, setBidFocused] = useState(false);

  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  const fetchItem = async () => {
    try {
      const res  = await fetch(`${API}/api/items/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Item not found");

      // if end_date has passed but status is still "active", treat as ended ──
      if (data.status === "active" && new Date(data.end_date) <= new Date()) {
        data.status = "inactive";
      }

      setItem(data);
      const min = data.current_bid
        ? (Number(data.current_bid) + 0.01).toFixed(2)
        : Number(data.starting_bid).toFixed(2);
      setBidAmount(min);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItem(); }, [id]);

  const minBid = item
    ? (item.current_bid ? Number(item.current_bid) + 0.01 : Number(item.starting_bid))
    : 0;

  const handleBid = async () => {
    if (!token) { setBidMsg({ type: "error", text: "You must be logged in to bid." }); return; }
    const amt = Number(bidAmount);
    if (!amt || amt < minBid) {
      setBidMsg({ type: "error", text: `Bid must be at least $${minBid.toFixed(2)}.` }); return;
    }
    setBidding(true); setBidMsg(null);
    try {
      const res  = await fetch(`${API}/api/items/${id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bid failed");
      setBidMsg({ type: "success", text: `Bid of $${Number(data.new_bid).toFixed(2)} placed successfully!` });
      await fetchItem();
    } catch (err) { setBidMsg({ type: "error", text: err.message }); }
    finally { setBidding(false); }
  };

  const tl      = item ? timeLeft(item.end_date) : null;
  const isOwner = item && token && item.seller_id === user_id;
  const canBid  = token && item && item.status === "active" && !tl?.ended && !isOwner;

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: fontUI, color: T.inkFaint, fontSize: 14 }}>
      Loading…
    </div>
  );

  // ── Error ──
  if (error) return (
    <div style={{ minHeight: "100vh", background: T.cream, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <p style={{ color: T.red, fontSize: 16, fontFamily: fontUI }}>⚠ {error}</p>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>← Go Back</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>
      {/* Top stripe */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      {/* Top bar */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "14px 32px",
      }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkLight; }}
        >← Back to Browse</button>
      </div>

      {/* Main layout */}
      <div style={{
        maxWidth: 1000, margin: "0 auto", padding: "40px 32px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start",
      }}>

        {/* ── Left: Bid History ── */}
        <div>
          {/* Item image area */}
          <div style={{
            height: 300, borderRadius: 12,
            background: T.amberPale,
            border: `1.5px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 64, marginBottom: 24,
            overflow: "hidden",
          }}>
            {item.image && item.image.trim() !== "" ? (
              <img
                src={item.image}
                alt={item.item_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",  
                  padding: 12,            
                  boxSizing: "border-box",
                }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span><img src={logo} alt="logo" style={{width: 210, paddingTop: 10}} /></span>
            )}
          </div>

          {/* Bid history */}
          {item.recent_bids?.length > 0 && (
            <div>
              <h3 style={{
                margin: "0 0 12px", fontSize: 11, fontWeight: 700,
                color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.12em",
              }}>Bid History</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {item.recent_bids.map((b, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px",
                    background: i === 0 ? T.orangePale : T.card,
                    border: `1.5px solid ${i === 0 ? T.orange : T.border}`,
                    borderRadius: 8,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                      color: i === 0 ? T.orange : T.inkLight,
                    }}>
                      {i === 0 ? "👑 " : ""}{b.username}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: i === 0 ? T.orange : T.inkFaint,
                      fontFamily: fontDisplay,
                    }}>
                      ${Number(b.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Details + Bid ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Status + time */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "4px 12px", borderRadius: 999,
              background: item.status === "active" ? T.greenPale : T.orangePale,
              color:      item.status === "active" ? T.green     : T.orange,
              border: `1px solid ${item.status === "active" ? "#A8DFC0" : "#F0B080"}`,
            }}>
              {item.status === "active" ? "Live" : "Ended"}
            </span>
            {tl && (
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: tl.ended ? T.inkFaint : tl.urgent ? T.red : T.inkLight,
              }}>
                {tl.urgent && !tl.ended ? "⚡ " : "⏱ "}{tl.text}
              </span>
            )}
          </div>

          {/* Item name */}
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            fontFamily: fontDisplay, color: T.inkMid,
            lineHeight: 1.2, letterSpacing: "-0.02em",
          }}>{item.item_name}</h1>

          {/* Seller + bid count */}
          <p style={{ margin: 0, fontSize: 12, color: T.inkFaint }}>
            Listed by{" "}
            <span style={{ color: T.inkLight, fontWeight: 600 }}>{item.seller_username}</span>
            &nbsp;·&nbsp;{item.bid_count} bid{item.bid_count !== 1 ? "s" : ""}
          </p>

          {/* Description */}
          {item.description && (
            <p style={{
              margin: 0, fontSize: 14, color: T.inkLight, lineHeight: 1.7,
              borderLeft: `3px solid ${T.orangePale}`,
              paddingLeft: 14,
            }}>{item.description}</p>
          )}

          {/* Price block */}
          <div style={{
            background: T.amberPale,
            border: `1.5px solid #E8C97A`,
            borderRadius: 10, padding: "18px 20px",
          }}>
            <div style={{
              fontSize: 10, color: T.amber, textTransform: "uppercase",
              letterSpacing: "0.1em", marginBottom: 4, fontWeight: 700,
            }}>
              {item.current_bid ? "Current Bid" : "Starting Bid"}
            </div>
            <div style={{
              fontSize: 38, fontWeight: 700, color: T.orange,
              fontFamily: fontDisplay, lineHeight: 1,
            }}>
              ${Number(item.current_bid ?? item.starting_bid).toFixed(2)}
            </div>
            {item.current_bid && (
              <div style={{ fontSize: 11, color: T.amber, marginTop: 4 }}>
                Starting bid was ${Number(item.starting_bid).toFixed(2)}
              </div>
            )}
          </div>

          {/* Bid form */}
          {canBid && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{
                fontSize: 11, color: T.inkLight, textTransform: "uppercase",
                letterSpacing: "0.08em", fontWeight: 700,
              }}>
                Your Bid (min ${minBid.toFixed(2)})
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <span style={{
                    position: "absolute", left: 13, top: "50%",
                    transform: "translateY(-50%)", color: T.amber,
                    fontSize: 15, fontWeight: 700, fontFamily: fontDisplay,
                  }}>$</span>
                  <input
                    type="number" min={minBid} step="0.01"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    onFocus={() => setBidFocused(true)}
                    onBlur={() => setBidFocused(false)}
                    onKeyDown={(e) => e.key === "Enter" && handleBid()}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: T.cream,
                      border: `1.5px solid ${bidFocused ? T.orange : T.border}`,
                      borderRadius: 8,
                      padding: "12px 14px 12px 28px",
                      color: T.ink, fontSize: 16, fontWeight: 700,
                      outline: "none", fontFamily: fontDisplay,
                      transition: "border-color 0.15s",
                    }}
                  />
                </div>
                <button
                  onClick={handleBid} disabled={bidding}
                  style={{
                    padding: "12px 24px", borderRadius: 8, border: "none",
                    background: bidding ? T.inkFaint : T.orange, color: "#fff",
                    fontSize: 13, fontWeight: 700,
                    cursor: bidding ? "not-allowed" : "pointer",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    transition: "background 0.15s", whiteSpace: "nowrap",
                    fontFamily: fontUI,
                  }}
                  onMouseEnter={(e) => { if (!bidding) e.currentTarget.style.background = T.orangeHover; }}
                  onMouseLeave={(e) => { if (!bidding) e.currentTarget.style.background = T.orange; }}
                >
                  {bidding ? "Placing…" : "Place Bid"}
                </button>
              </div>

              {bidMsg && (
                <div style={{
                  fontSize: 13, padding: "10px 14px", borderRadius: 8,
                  background: bidMsg.type === "success" ? T.greenPale : T.redPale,
                  border: `1px solid ${bidMsg.type === "success" ? "#A8DFC0" : "#E9A8A3"}`,
                  color:   bidMsg.type === "success" ? T.green      : T.red,
                  fontWeight: 600,
                }}>{bidMsg.text}</div>
              )}
            </div>
          )}

          {/* Not logged in */}
          {!token && item.status === "active" && !tl?.ended && (
            <p style={{ fontSize: 13, color: T.inkFaint, fontStyle: "italic" }}>
              <button onClick={() => navigate("/login")} style={{
                background: "none", border: "none", color: T.orange,
                cursor: "pointer", fontSize: 13, padding: 0, fontWeight: 700,
                fontFamily: fontUI,
              }}>Log in</button>{" "}to place a bid.
            </p>
          )}

          {/* Own item */}
          {isOwner && (
            <p style={{ fontSize: 13, color: T.inkFaint, fontStyle: "italic" }}>
              This is your listing.
            </p>
          )}

          {/* Ended */}
          {(tl?.ended || item.status === "inactive") && (
            <div style={{
              padding: "12px 16px", borderRadius: 8,
              background: T.amberPale, border: `1px solid #E8C97A`,
              fontSize: 13, color: T.amber, fontWeight: 600,
            }}>
              🏆 This auction has ended.{" "}
              {item.recent_bids?.[0]?.username && (
                <span style={{ color: T.inkLight }}>
                  Won by <strong>{item.recent_bids[0].username}</strong> for ${Number(item.current_bid).toFixed(2)}
                </span>
              )}
            </div>
          )}

          {/* Dates + Report */}
          <div style={{
            display: "flex", gap: 24, paddingTop: 16,
            borderTop: `1px solid ${T.border}`,
            alignItems: "flex-end", justifyContent: "space-between",
            flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", gap: 24 }}>
              <div>
                <div style={{ fontSize: 10, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Listed</div>
                <div style={{ fontSize: 12, color: T.inkLight }}>{new Date(item.start_date).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Ends</div>
                <div style={{ fontSize: 12, color: T.inkLight }}>{new Date(item.end_date).toLocaleString()}</div>
              </div>
            </div>
            {token && !isOwner && (
              <button
                onClick={() => { setReportModal(true); setReportReason(""); setReportError(""); setReportSuccess(""); }}
                style={{
                  background: "transparent",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 8, color: T.inkFaint,
                  fontSize: 11, fontWeight: 700, padding: "7px 14px",
                  cursor: "pointer", letterSpacing: "0.06em",
                  fontFamily: fontUI,
                }}
              >🚩 Report Item
              </button>
            )}
          </div>
        </div>
      </div>
      {reportModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(28,16,8,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={() => { setReportModal(false); setReportReason(""); setReportError(""); setReportSuccess(""); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.card, borderRadius: 14, padding: "32px 28px 24px",
              width: "100%", maxWidth: 440, textAlign: "center",
              border: `1.5px solid #E9A8A3`,
              boxShadow: "0 12px 48px rgba(28,16,8,0.18)",
              fontFamily: fontUI,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%", margin: "0 auto 18px",
              background: T.redPale, border: `2px solid #E9A8A3`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>🚩</div>

            <h3 style={{
              margin: "0 0 6px", fontFamily: fontDisplay,
              fontSize: 18, fontWeight: 700, color: T.inkMid,
            }}>Report Item</h3>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: T.inkFaint, lineHeight: 1.6 }}>
              Describe why you're reporting <strong style={{ color: T.inkMid }}>{item.item_name}</strong>. Admins will review your report.
            </p>

            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the reason for reporting…"
              rows={4}
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                margin: "0 0 14px", padding: "9px 12px", textAlign: "left",
                background: T.cream, border: `1.5px solid ${T.border}`,
                borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
                outline: "none", resize: "vertical",
              }}
            />

            {reportError && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: T.redPale, border: `1px solid #E9A8A3`,
                color: T.red, fontSize: 12, fontWeight: 600, textAlign: "left",
              }}>{reportError}</div>
            )}
            {reportSuccess && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: T.greenPale, border: `1px solid #A8DFC0`,
                color: T.green, fontSize: 12, fontWeight: 600, textAlign: "left",
              }}>{reportSuccess}</div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => { setReportModal(false); setReportReason(""); setReportError(""); setReportSuccess(""); }}
                style={{
                  padding: "9px 20px", background: "transparent",
                  border: `1.5px solid ${T.border}`, borderRadius: 8,
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", color: T.inkLight,
                }}
              >Cancel</button>
              <button
                disabled={reportSending || !!reportSuccess}
                onClick={async () => {
                  if (!reportReason.trim()) { setReportError("Please provide a reason."); return; }
                  setReportSending(true); setReportError("");
                  try {
                    const res = await fetch(`${API}/api/items/${id}/report`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ reason: reportReason.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setReportError(data.error ?? "Failed to report"); return; }
                    setReportSuccess("Report submitted. Admins will review this listing.");
                  } catch { setReportError("Network error"); }
                  finally { setReportSending(false); }
                }}
                style={{
                  padding: "9px 24px", border: "none", borderRadius: 8,
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  background: reportSending || reportSuccess ? T.inkFaint : T.red,
                  color: "#fff",
                  cursor: reportSending || reportSuccess ? "not-allowed" : "pointer",
                }}
              >
                {reportSending ? "Submitting…" : reportSuccess ? "Reported" : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}