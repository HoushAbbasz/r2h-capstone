// import react useState hook for form and ui state
import { useState } from "react";
// import authentication context for the login function
import { useAuth } from "../context/AuthContext";
// import navigation hook for redirecting after login
import { useNavigate } from "react-router-dom";
 
// base api url for auth requests
const API = "https://86yc8vtkk4.execute-api.us-east-1.amazonaws.com";
 
// color palette object — exported so other files can import it if needed
export const T = {
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

// function returns input style object based on focus state
const inputStyle = (focused) => ({
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px",
  background: T.cream,
  border: `1.5px solid ${focused ? T.orange : T.border}`,
  borderRadius: 8,
  fontFamily: fontUI, fontSize: 14, color: T.ink,
  outline: "none", transition: "border-color 0.18s",
});

// login/register page component
export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [banned, setBanned] = useState(false);
  const [mode,     setMode]     = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState("");
  const [isAdult, setIsAdult] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMsg("");
  setLoading(true);

  if (mode === "register") {
    if (!isAdult) {
      setError("You must confirm you are at least 18 years old");
      setLoading(false);
      return;
    }
    // validation for username and password
    if (username.length < 5) {
      setError("Username must be at least 5 characters");
      setLoading(false);
      return;
    }
    if (/\s/.test(username)) {
      setError("Username cannot contain spaces or tabs");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    if (/\s/.test(password)) {
      setError("Password cannot contain spaces or tabs");
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      setLoading(false);
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter");
      setLoading(false);
      return;
    }
  }

  const endpoint = mode === "login" ? `${API}/api/auth/login` : `${API}/api/auth/register`;
  try {
    const res  = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === "banned") { setBanned(true); return; }
      setError(data.error || "Something went wrong");
      return;
    }
    if (mode === "register") {
      setMode("login");
      setPassword("");
      setIsAdult(false);
      setError("");
      setSuccessMsg("Account created! You can now sign in.");
      return;
    }
    login(data.token, data.username, data.admin);
    navigate(data.admin ? "/admin" : "/");
  } catch { setError("Could not connect to server"); }
  finally { setLoading(false); }
};

  return (
    <div style={{
      minHeight: "100vh", background: T.cream,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fontUI, padding: "24px", position: "relative",
    }}>
      {/* Top accent stripe */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 4, zIndex: 100,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      <div style={{
        width: "100%", maxWidth: 400,
        background: T.card,
        border: `1.5px solid ${T.border}`,
        borderRadius: 16,
        padding: "40px 36px",
        boxShadow: "0 4px 32px rgba(60,30,5,0.10)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{
            margin: "0 0 4px", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: T.inkFaint, fontFamily: fontUI,
          }}>Shinobi Exchange</p>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 700,
            fontFamily: fontDisplay, color: T.inkMid, letterSpacing: "-0.01em",
          }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "flex", background: T.orangePale,
          borderRadius: 8, padding: 3, marginBottom: 28, gap: 2,
        }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setSuccessMsg(""); setIsAdult(false); }} style={{
              flex: 1, padding: "7px 0", border: "none", borderRadius: 6,
              fontFamily: fontUI, fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.18s",
              background: mode === m ? T.orange : "transparent",
              color:      mode === m ? "#fff"   : T.inkLight,
              letterSpacing: "0.03em",
            }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: T.redPale, border: `1px solid #E9A8A3`,
            borderRadius: 8, fontSize: 13, color: T.red, fontWeight: 600,
          }}>⚠ {error}</div>
        )}
        {successMsg && (
          <div style={{
            marginBottom: 20, padding: "10px 14px",
            background: T.greenPale, border: `1px solid #A8DFC0`,
            borderRadius: 8, fontSize: 13, color: T.green, fontWeight: 600,
          }}>✓ {successMsg}</div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkLight,
            }}>Username</label>
            <input
              type="text" value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocused("u")} onBlur={() => setFocused("")}
              required placeholder="e.g. naruto_uzumaki"
              style={inputStyle(focused === "u")}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: T.inkLight,
            }}>Password</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("p")} onBlur={() => setFocused("")}
              required placeholder="••••••••"
              style={inputStyle(focused === "p")}
            />
            {mode === "register" && (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <input
      type="checkbox"
      checked={isAdult}
      onChange={(e) => setIsAdult(e.target.checked)}
      style={{
        width: 16,
        height: 16,
        cursor: "pointer",
        accentColor: T.orange,
      }}
    />
    <label style={{
      fontSize: 13,
      color: T.inkMid,
      fontFamily: fontUI,
      cursor: "pointer",
    }}>
      Are you at least 18 years old?
    </label>
  </div>
)}
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: "12px 0",
            background: loading ? T.inkFaint : T.orange,
            color: "#fff", border: "none", borderRadius: 8,
            fontFamily: fontUI, fontSize: 14, fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.18s",
          }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = T.orangeHover; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = T.orange; }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

      </div>
      {banned && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(28,16,8,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
        }}>
          <div style={{
            background: T.card, borderRadius: 16, padding: "40px 36px",
            width: "100%", maxWidth: 400, textAlign: "center",
            border: `1.5px solid #E9A8A3`,
            boxShadow: "0 12px 48px rgba(192,57,43,0.18)",
            fontFamily: fontUI,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: T.redPale, border: `2px solid #E9A8A3`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, margin: "0 auto 20px",
            }}>🚫</div>
            <h2 style={{
              margin: "0 0 10px", fontFamily: fontDisplay,
              fontSize: 22, fontWeight: 700, color: T.red,
            }}>Account Banned</h2>
            <p style={{
              margin: "0 0 28px", fontSize: 14,
              color: T.inkLight, lineHeight: 1.7,
            }}>
              This account has been <strong>banned for misconduct</strong> and is no longer able to access Shinobi Exchange.
              If you believe this is an error, please contact support.
            </p>
            <button
              onClick={() => { setBanned(false); setUsername(""); setPassword(""); }}
              style={{
                padding: "11px 32px", background: T.red, color: "#fff",
                border: "none", borderRadius: 8, fontFamily: fontUI,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                letterSpacing: "0.04em", transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}