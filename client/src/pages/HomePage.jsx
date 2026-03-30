// import react hooks for state and side effects
import { useNavigate } from "react-router-dom";
// import authentication context for login state
import { useAuth } from "../context/AuthContext";
// import react hooks
import { useState, useEffect } from "react";
// import site logo image asset
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

// helper function that calculates and formats time remaining until an end date
function timeLeft(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return { text: "Ended", urgent: false, ended: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  return {
    text: d > 0 ? `${d}d ${h % 24}h` : `${h}h ${m}m`,
    urgent: diff < 3600000 * 3,
    ended: false,
  };
}

// featured item card sub-component for the homepage live listings preview
function FeaturedCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  const tl    = timeLeft(item.end_date);
  const price = item.current_bid ?? item.starting_bid;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.card,
        border: `1.5px solid ${hovered ? T.orange : T.border}`,
        borderRadius: 14, overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.22s, box-shadow 0.22s, border-color 0.22s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(232,98,26,0.18)"
          : "0 2px 12px rgba(60,30,5,0.07)",
        fontFamily: fontUI,
      }}
    >
      {/* Image */}
      <div style={{
        height: 170, background: T.amberPale,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 52, position: "relative",
        borderBottom: `1px solid ${T.border}`,
      }}>
        {item.image && item.image.trim() !== "" ? (
          <img src={item.image} alt={item.item_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }} />
        ) : <span><img src={logo} alt="logo" style={{width: 110, paddingTop: 10}} /></span>}

        {/* Live badge */}
        {!tl.ended && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", padding: "3px 9px", borderRadius: 999,
            background: T.greenPale, color: T.green, border: `1px solid #A8DFC0`,
          }}>● Live</span>
        )}

        {/* Bid count */}
        {item.bid_count > 0 && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
            background: "rgba(28,16,8,0.65)", color: "#fff",
          }}>{item.bid_count} bid{item.bid_count !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: T.inkMid,
          fontFamily: fontDisplay, lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{item.item_name}</h3>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          paddingTop: 8, borderTop: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              {item.current_bid ? "Current Bid" : "Starting"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.orange, fontFamily: fontDisplay }}>
              ${Number(price).toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              {tl.ended ? "" : "Ends in"}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: tl.ended ? T.inkFaint : tl.urgent ? T.red : T.inkLight,
            }}>
              {tl.urgent && !tl.ended ? "⚡ " : ""}{tl.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// stat pill sub-component displays an icon, large value, and small label
function StatPill({ icon, value, label }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "24px 32px",
      background: T.card, borderRadius: 14,
      border: `1.5px solid ${T.border}`,
      boxShadow: "0 2px 12px rgba(60,30,5,0.06)",
      minWidth: 130,
    }}>
      <span style={{ fontSize: 28, marginBottom: 8 }}>{icon}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: T.orange, fontFamily: fontDisplay, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: T.inkFaint, marginTop: 4, fontWeight: 600, letterSpacing: "0.04em" }}>
        {label}
      </span>
    </div>
  );
}

// feature card sub-component used in the "how it works" section
function FeatureCard({ icon, title, body }) {
  return ( 
    <div style={{
      background: T.card, border: `1.5px solid ${T.border}`,
      borderRadius: 14, padding: "28px 24px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{
        width: '100%', height: 44, borderRadius: 10,
        background: T.orangePale, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 22, border: `1px solid #F0B080`,
        fontWeight: 700, fontFamily: fontDisplay, color: T.inkMid,
      }}>{icon}</div>
      <h3 style={{
        margin: 0, fontSize: 16, fontWeight: 700,
        fontFamily: fontDisplay, color: T.inkMid,
      }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: T.inkLight, lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}

// main homepage component
export default function HomePage() {
  const navigate          = useNavigate();
  const { isLoggedIn }    = useAuth();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ active: "—", total: "—", users: "—" });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade-in on mount
    const t = setTimeout(() => setVisible(true), 50);

    // Fetch a 4 of live listings to showcase
    fetch(`${API}/api/items?status=active&sort=end_date_asc`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data.slice(0, 4));
      })
      .catch(() => {});

    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(160deg, ${T.inkMid} 0%, ${T.ink} 60%)`,
        padding: "80px 32px 72px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(232,98,26,0.18) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: "30%",
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(240,180,41,0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{
          maxWidth: 720, margin: "0 auto", textAlign: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          {/* Eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(232,98,26,0.18)", border: "1px solid rgba(232,98,26,0.35)",
            borderRadius: 999, padding: "5px 16px", marginBottom: 28,
          }}>
            
            <span style={{ fontSize: 15, fontWeight: 700, color: T.amberLight, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Posters · Collectibles · And More!
            </span>
          </div>

          <h1 style={{
            margin: "0 0 20px",
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 700,
            fontFamily: fontDisplay,
            color: "#fff",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            The best auction site around. {" "}
            <span style={{ color: T.amberLight }}>Believe it!</span>{" "}
            
          </h1>

          <p style={{
            margin: "0 0 36px",
            fontSize: 17, color: T.inkFaint, lineHeight: 1.7,
            maxWidth: 520, marginLeft: "auto", marginRight: "auto",
          }}>
            Shinobi Exchange is built for anime fans of all callibers. Discover rare figurines, posters,
            vintage manga, and more. All in one place.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate("/browse")}
                  style={{
                    background: T.orange, color: "#fff", border: "none",
                    fontFamily: fontUI, fontSize: 15, fontWeight: 700,
                    padding: "14px 32px", borderRadius: 10, cursor: "pointer",
                    transition: "background 0.15s, transform 0.15s",
                    boxShadow: "0 4px 20px rgba(232,98,26,0.4)",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = "translateY(0)"; }}
                >Browse Auctions →</button>
                <button
                  onClick={() => navigate("/sell")}
                  style={{
                    background: "transparent", color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    fontFamily: fontUI, fontSize: 15, fontWeight: 700,
                    padding: "14px 32px", borderRadius: 10, cursor: "pointer",
                    transition: "border-color 0.15s, transform 0.15s",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >List an Item</button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: T.orange, color: "#fff", border: "none",
                    fontFamily: fontUI, fontSize: 15, fontWeight: 700,
                    padding: "14px 32px", borderRadius: 10, cursor: "pointer",
                    transition: "background 0.15s, transform 0.15s",
                    boxShadow: "0 4px 20px rgba(232,98,26,0.4)",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = "translateY(0)"; }}
                >Start Bidding →</button>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "transparent", color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.25)",
                    fontFamily: fontUI, fontSize: 15, fontWeight: 700,
                    padding: "14px 32px", borderRadius: 10, cursor: "pointer",
                    transition: "border-color 0.15s, transform 0.15s",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}
                >Create Account</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        borderTop: `1px solid ${T.border}`,
        padding: "32px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center",
        }}>
        </div>
      </section>

      {/* ── LIVE LISTINGS PREVIEW ── */}
      {items.length > 0 && (
        <section style={{ padding: "60px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            marginBottom: 28, flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <p style={{
                margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: T.inkFaint,
              }}>Right Now</p>
              <h2 style={{
                margin: 0, fontSize: 26, fontWeight: 700,
                fontFamily: fontDisplay, color: T.inkMid, letterSpacing: "-0.01em",
              }}>Live Auctions</h2>
            </div>
            {isLoggedIn && (
              <button
                onClick={() => navigate("/browse")}
                style={{
                  background: "none", border: `1.5px solid ${T.border}`,
                  color: T.inkLight, fontFamily: fontUI, fontSize: 16, fontWeight: 700,
                  padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkLight; }}
              >View All →</button>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 18,
          }}>
            {items.map(item => (
              <FeaturedCard
                key={item.item_id}
                item={item}
                onClick={() => isLoggedIn ? navigate(`/items/${item.item_id}`) : navigate("/login")}
              />
            ))}
          </div>

          {!isLoggedIn && (
            <div style={{
              textAlign: "center", marginTop: 28,
              padding: "20px", borderRadius: 12,
              background: T.orangePale, border: `1px solid #F0B080`,
            }}>
              <span style={{ fontSize: 19, color: T.orange, fontWeight: 600 }}>
                🔒 <button
                  onClick={() => navigate("/login")}
                  style={{
                    background: "none", border: "none", color: T.orange,
                    fontFamily: fontUI, fontSize: 19, fontWeight: 700,
                    cursor: "pointer", textDecoration: "underline", padding: 0,
                  }}
                >Login or register</button> to place bids
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section style={{
        padding: "60px 32px",
        background: T.card, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{
              margin: "0 0 6px", fontSize: 14, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase", color: T.inkFaint,
            }}>Simple & Safe</p>
            <h2 style={{
              margin: 0, fontSize: 26, fontWeight: 700,
              fontFamily: fontDisplay, color: T.inkMid,
            }}>How It Works</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 18,
          }}>
            <FeatureCard
              icon="Step 1"
              title="Browse Listings"
              body="Search and filter through verified anime collectibles, sorted by ending time or price."
            />
            <FeatureCard
              icon="Step 2"
              title="Place a Bid"
              body="Register for free and start bidding instantly. Each bid must beat the current highest by at least $0.01."
            />
            <FeatureCard
              icon="Step 3"
              title="Win the Auction"
              body="The highest bidder when the timer hits zero wins. You'll see it reflected in your Account page immediately."
            />
            <FeatureCard
              icon="Step 4"
              title="Connect with Sellers"
              body="Winners and sellers can message each other directly after an auction closes to arrange everything."
            />
          </div>
        </div>
      </section>

      {/* ── TRUST & SAFETY ── */}
      <section style={{ padding: "60px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${T.inkMid} 0%, ${T.ink} 100%)`,
          borderRadius: 18, padding: "48px 40px",
          display: "flex", flexWrap: "wrap", gap: 32,
          alignItems: "center", justifyContent: "space-between",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,98,26,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>🛡️</div>
            <h2 style={{
              margin: "0 0 12px", fontSize: 24, fontWeight: 700,
              fontFamily: fontDisplay, color: "#fff",
            }}>AI-Powered Security</h2>
            <p style={{ margin: 0, fontSize: 18, color: T.inkFaint, lineHeight: 1.7 }}>
              Every listing is screened by our Gemini-powered fraud detection system. Off topic items,
              suspicious pricing, and scam patterns are flagged before they reach you.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🚩", label: "Listings flagged for review by admins." },
              { icon: "👤", label: "Reported users reviewed by admins." },
              { icon: "✅", label: "Anime, manga, & cartoons only. No off topic items." },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 8,
                  background: "rgba(232,98,26,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>{icon}</span>
                <span style={{ fontSize: 18, color: T.inkFaint, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!isLoggedIn && (
        <section style={{
          padding: "0 32px 72px",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 540, margin: "0 auto" }}>
            <h2 style={{
              margin: "0 0 12px", fontSize: 28, fontWeight: 700,
              fontFamily: fontDisplay, color: T.inkMid, letterSpacing: "-0.01em",
            }}>Ready to Start Collecting?</h2>
            <p style={{ margin: "0 0 28px", fontSize: 15, color: T.inkLight, lineHeight: 1.7 }}>
              Join the community of anime collectors. Registration is free and takes under a minute.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: T.orange, color: "#fff", border: "none",
                fontFamily: fontUI, fontSize: 15, fontWeight: 700,
                padding: "14px 40px", borderRadius: 10, cursor: "pointer",
                transition: "background 0.15s, transform 0.15s",
                boxShadow: "0 4px 20px rgba(232,98,26,0.35)",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.orangeHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = "translateY(0)"; }}
            >Create Free Account →</button>
          </div>
        </section>
      )}
    </div>
  );
}