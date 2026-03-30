import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import  logo from "../assets/logo.png"; 

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

function Navbar() {
  const { username, isLoggedIn, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = () => { logout(); setOpen(false); navigate("/"); };
  const handleNav    = (path) => { setOpen(false); navigate(path); };

  useEffect(() => {
    const onKey    = (e) => { if (e.key === "Escape") setOpen(false); };
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navLinks = [
    { label: "Home",  path: "/",  show: isLoggedIn },
    { label: "Browse",  path: "/browse",  show: isLoggedIn },
    { label: "Account", path: "/account", show: isLoggedIn },
    { label: "Admin",   path: "/admin",   show: isAdmin },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top accent stripe */}
      <div style={{
        height: 3,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1100,
      }} />

      <header style={{
        position: "fixed", top: 3, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? "rgba(253,246,236,0.97)" : T.card,
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
        backdropFilter: "blur(12px)",
        transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
        boxShadow: scrolled ? "0 2px 20px rgba(60,30,5,0.08)" : "none",
        fontFamily: fontUI,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: "0 32px",
          height: 75,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <button
            onClick={() => handleNav("/")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, padding: 0,
            }}
          >
            
            <div style={{ textAlign: "left" }}>
              <div style={{
                fontSize: 25, fontWeight: 700, color: T.inkMid,
                fontFamily: fontDisplay, lineHeight: 1.1, letterSpacing: "-0.01em",
              }}>Shinobi</div>
              <div style={{
                fontSize: 19, fontWeight: 700, color: T.inkFaint,
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}>Exchange</div>
            </div>
            <img src={logo} alt="logo" style={{width: 110, paddingTop: 10}} />
          </button>

          {/* Desktop nav */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }} aria-label="Main navigation">
            {navLinks.filter(l => l.show).map(({ label, path }) => (
              <button
                key={path}
                onClick={() => handleNav(path)}
                style={{
                  background: isActive(path) ? T.orangePale : "none",
                  border: "none",
                  color: isActive(path) ? T.orange : T.inkLight,
                  fontFamily: fontUI, fontSize: 19, fontWeight: 600,
                  padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                  transition: "all 0.15s",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => { if (!isActive(path)) { e.currentTarget.style.background = T.cream; e.currentTarget.style.color = T.inkMid; }}}
                onMouseLeave={(e) => { if (!isActive(path)) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.inkLight; }}}
              >{label}</button>
            ))}

            {isLoggedIn ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
                <div style={{
                  fontSize: 19, color: T.inkFaint, fontWeight: 500,
                  padding: "4px 10px", borderRadius: 999,
                  background: T.amberPale, border: `1px solid #E8C97A`,
                }}>
                   <span style={{ color: T.amber, fontWeight: 700 }}>{username}</span>
                  {isAdmin && <span style={{ color: T.orange, marginLeft: 4 }}>· Admin</span>}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "none", border: `1.5px solid ${T.border}`,
                    color: T.inkLight, fontFamily: fontUI,
                    fontSize: 19, fontWeight: 700, padding: "6px 14px",
                    borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkLight; }}
                >Logout</button>
              </div>
            ) : (
              <button
                onClick={() => handleNav("/login")}
                style={{
                  marginLeft: 8,
                  background: T.orange, color: "#fff", border: "none",
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  padding: "8px 18px", borderRadius: 8, cursor: "pointer",
                  transition: "background 0.15s",
                  letterSpacing: "0.03em",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.orangeHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = T.orange; }}
              >Login</button>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(v => !v)}
            style={{
              display: "none",
              background: "none", border: "none", cursor: "pointer",
              padding: 6, flexDirection: "column", gap: 5, alignItems: "center",
            }}
            className="burger-btn"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                display: "block", width: 22, height: 2, borderRadius: 2,
                background: T.inkMid, transition: "all 0.2s",
                transformOrigin: "center",
                transform: open
                  ? i === 0 ? "translateY(7px) rotate(45deg)"
                  : i === 2 ? "translateY(-7px) rotate(-45deg)"
                  : "scaleX(0)"
                  : "none",
                opacity: open && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        </div>
      </header>

      {/* Spacer */}
      <div style={{ height: 63 }} />

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(28,16,8,0.4)",
            backdropFilter: "blur(2px)",
          }}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <nav style={{
        position: "fixed", top: 63, right: 0, bottom: 0, zIndex: 1000,
        width: 280, background: T.card,
        borderLeft: `1.5px solid ${T.border}`,
        padding: "24px 20px",
        display: "flex", flexDirection: "column", gap: 6,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: open ? "-8px 0 32px rgba(60,30,5,0.12)" : "none",
        fontFamily: fontUI,
      }}>
        {isLoggedIn && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 8,
            background: T.amberPale, border: `1px solid #E8C97A`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>{username}{isAdmin && <span style={{ color: T.orange }}> · Admin</span>}</div>
          </div>
        )}

        {navLinks.filter(l => l.show).map(({ label, path }) => (
          <button
            key={path}
            onClick={() => handleNav(path)}
            style={{
              background: isActive(path) ? T.orangePale : "none",
              border: "none", textAlign: "left",
              color: isActive(path) ? T.orange : T.inkMid,
              fontFamily: fontUI, fontSize: 15, fontWeight: 600,
              padding: "12px 14px", borderRadius: 10, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{label}</button>
        ))}

        <div style={{ marginTop: "auto", borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          {isLoggedIn
            ? <button onClick={handleLogout} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: T.redPale, border: "none", color: T.red,
                fontFamily: fontUI, fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left",
              }}>Logout</button>
            : <button onClick={() => handleNav("/login")} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10,
                background: T.orange, border: "none", color: "#fff",
                fontFamily: fontUI, fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>Login</button>
          }
        </div>
      </nav>

      <style>{`
        @media (max-width: 680px) {
          .burger-btn { display: flex !important; }
          nav[aria-label="Main navigation"] { display: none !important; }
        }
      `}</style>
    </>
  );
}

export default Navbar;