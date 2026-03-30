import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

function Footer() {
  const navigate  = useNavigate();
  const { isLoggedIn } = useAuth();

  const links = [
    { label: "Browse Auctions", path: "/browse",  show: isLoggedIn },
    { label: "My Account",      path: "/account", show: isLoggedIn },
    { label: "Sell an Item",    path: "/sell",    show: isLoggedIn },
    { label: "Login",           path: "/login",   show: !isLoggedIn },
  ];

  return (
    <footer style={{
      background: T.inkMid,
      borderTop: `3px solid ${T.orange}`,
      fontFamily: fontUI,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "48px 32px 32px",
      }}>
        {/* Top row */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 40,
          justifyContent: "space-between",
          paddingBottom: 36,
          borderBottom: `1px solid rgba(196,168,130,0.2)`,
        }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: fontDisplay, lineHeight: 1.1 }}>
                  Shinobi
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.inkFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Exchange
                </div>

           
              </div>
            </div>
            <p style={{
              margin: 0, fontSize: 15, color: T.inkFaint, lineHeight: 1.7,
            }}>
              The one stop shop for rare anime, manga, and cartoon merchandise. Bid with confidence, sell with ease.
            </p>
          </div>

          {/* Links */}
          <div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: T.orange,
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14,
            }}>Navigate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {links.filter(l => l.show).map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    color: T.inkFaint, fontFamily: fontUI, fontSize: 15,
                    fontWeight: 500, cursor: "pointer", textAlign: "left",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = T.amberLight; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = T.inkFaint; }}
                >{label}</button>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid rgba(196,168,130,0.2)`,
            borderRadius: 12, padding: "20px 24px",
            maxWidth: 220,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
              Safe & Secure
            </div>
            <div style={{ fontSize: 15, color: T.inkFaint, lineHeight: 1.6 }}>
              All listings are reviewed. Suspicious activity is flagged and removed.
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{
          paddingTop: 24,
          display: "flex", flexWrap: "wrap", gap: 12,
          justifyContent: "space-between", alignItems: "center",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: T.inkFaint }}>
            © {new Date().getFullYear()} Shinobi Exchange. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{
              fontSize: 15, fontWeight: 700,
              padding: "3px 10px", borderRadius: 999,
              background: "rgba(232,98,26,0.15)",
              color: T.orange, border: `1px solid rgba(232,98,26,0.3)`,
            }}>Anime Only</span>
            <span style={{
              fontSize: 15, fontWeight: 700,
              padding: "3px 10px", borderRadius: 999,
              background: "rgba(30,122,69,0.15)",
              color: "#4DC882", border: `1px solid rgba(30,122,69,0.3)`,
            }}>✓ Verified Listings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;