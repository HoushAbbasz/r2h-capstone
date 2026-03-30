// import react hooks for state and refs
import { useState, useRef } from "react";
// import navigation hook for routing after submit
import { useNavigate } from "react-router-dom";
// import auth context to get the token for authenticated requests
import { useAuth } from "../context/AuthContext";
// import site logo image asset for the live preview card
import  logo from "../assets/logo.png";
 
// base api url for item creation requests
const API = "https://86yc8vtkk4.execute-api.us-east-1.amazonaws.com";
 
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

// min end date for the auction end date input 
function minEndDate() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// sub-component adds a label, optional hint, and optional error below an input
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: error ? T.red : T.inkLight,
          fontFamily: fontUI,
        }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: T.inkFaint, fontFamily: fontUI }}>{hint}</span>}
      </div>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: T.red, fontFamily: fontUI }}>⚠ {error}</span>
      )}
    </div>
  );
}

// function returns input style based on focus state and error presence
const inputStyle = (focused, hasError) => ({
  width: "100%", boxSizing: "border-box",
  background: T.cream,
  border: `1.5px solid ${hasError ? T.red : focused ? T.orange : T.border}`,
  borderRadius: 8, padding: "11px 14px",
  color: T.ink, fontSize: 14,
  fontFamily: fontUI, outline: "none",
  transition: "border-color 0.15s",
});

// ghost/outline button style object used for back and cancel buttons
const ghostBtn = {
  background: "transparent",
  border: `1.5px solid ${T.border}`,
  borderRadius: 8, color: T.inkLight,
  fontSize: 12, fontWeight: 700,
  padding: "8px 16px", cursor: "pointer",
  letterSpacing: "0.04em", textTransform: "uppercase",
  fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  transition: "border-color 0.15s, color 0.15s",
};

// sell/list item page component
export default function SellPage() {
  const navigate  = useNavigate();
  const { token } = useAuth();
  const fileRef   = useRef(null);

  const [fields, setFields] = useState({
    item_name:    "",
    description:  "",
    starting_bid: "",
    end_date:     "",
  });

  const [errors,     setErrors]     = useState({});
  const [focused,    setFocused]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");

  const set = (key, val) => {
    setFields((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!fields.item_name.trim())    e.item_name    = "Name is required";
    if (!fields.starting_bid || isNaN(fields.starting_bid) || Number(fields.starting_bid) <= 0)
      e.starting_bid = "Enter a valid amount";
    if (!fields.end_date)            e.end_date     = "Pick an end date";
    else if (new Date(fields.end_date) <= new Date()) e.end_date = "Must be in the future";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true); setSubmitErr("");
    try {
      const res  = await fetch(`${API}/api/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          item_name:    fields.item_name.trim(),
          description:  fields.description.trim(),
          starting_bid: Number(fields.starting_bid),
          end_date:     fields.end_date,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create listing");
      navigate(`/items/${data.item_id}`);
    } catch (err) { setSubmitErr(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>
      <style>{`
        ::placeholder { color: ${T.inkFaint}; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
      <style>{`
        ::placeholder { color: ${T.inkFaint}; }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @media (max-width: 640px) {
          .sell-preview { display: none !important; }
          .sell-grid { grid-template-columns: 1fr !important; }
        }`}
      </style>

      {/* Top stripe */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      {/* Top bar */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "14px 32px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <button
          onClick={() => navigate("/account")} style={ghostBtn}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkLight; }}
        >← My Account</button>
        <span style={{ width: 1, height: 16, background: T.border, display: "inline-block" }} />
        <span style={{ fontSize: 11, color: T.inkFaint, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
          New Listing
        </span>
      </div>

      {/* Main grid */}
     <div className="sell-grid" style={{
        maxWidth: 860, margin: "0 auto", padding: "44px 32px",
        display: "grid", gridTemplateColumns: "1fr 300px", gap: 48, alignItems: "start",
      }}>

        {/* ── Left: Form ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <p style={{
              margin: "0 0 4px", fontSize: 11, color: T.orange, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.15em",
            }}>Auction House</p>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 700,
              color: T.inkMid, fontFamily: fontDisplay, letterSpacing: "-0.02em",
            }}>List an Item</h1>
          </div>

          <div style={{ height: 2, background: `linear-gradient(to right, ${T.border}, transparent)` }} />

          {/* Item Name */}
          <Field label="Item Name" hint="Required" error={errors.item_name}>
            <input
              value={fields.item_name}
              onChange={(e) => set("item_name", e.target.value)}
              onFocus={() => setFocused("item_name")}
              onBlur={() => setFocused("")}
              placeholder="e.g. Naruto Shippuden Season 1 Blu-ray Box Set"
              style={inputStyle(focused === "item_name", !!errors.item_name)}
              maxLength={100}
            />
            <span style={{ fontSize: 10, color: T.inkFaint, textAlign: "right" }}>
              {fields.item_name.length}/100
            </span>
          </Field>

          {/* Description */}
          <Field label="Description" hint="Optional">
            <textarea
              value={fields.description}
              onChange={(e) => set("description", e.target.value)}
              onFocus={() => setFocused("description")}
              onBlur={() => setFocused("")}
              placeholder="Condition, edition, what's included…"
              rows={4}
              style={{
                ...inputStyle(focused === "description", false),
                resize: "vertical", minHeight: 100, lineHeight: 1.6,
              }}
            />
          </Field>

          {/* Bid + Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Starting Bid" hint="USD" error={errors.starting_bid}>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 13, top: "50%",
                  transform: "translateY(-50%)", color: T.amber,
                  fontWeight: 700, fontSize: 15, fontFamily: fontDisplay,
                }}>$</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={fields.starting_bid}
                  onChange={(e) => set("starting_bid", e.target.value)}
                  onFocus={() => setFocused("starting_bid")}
                  onBlur={() => setFocused("")}
                  placeholder="0.00"
                  style={{ ...inputStyle(focused === "starting_bid", !!errors.starting_bid), paddingLeft: 28 }}
                />
              </div>
            </Field>

            <Field label="Auction End Date" error={errors.end_date}>
              <input
                type="datetime-local" min={minEndDate()}
                value={fields.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                onFocus={() => setFocused("end_date")}
                onBlur={() => setFocused("")}
                style={inputStyle(focused === "end_date", !!errors.end_date)}
              />
            </Field>
          </div>

          {submitErr && (
            <div style={{
              fontSize: 13, padding: "12px 16px", borderRadius: 8,
              background: T.redPale, border: `1px solid #E9A8A3`, color: T.red,
            }}>⚠ {submitErr}</div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
            <button
              onClick={handleSubmit} disabled={submitting}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 8, border: "none",
                background: submitting ? T.inkFaint : T.orange,
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                textTransform: "uppercase", letterSpacing: "0.08em",
                fontFamily: fontUI, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = T.orangeHover; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = T.orange; }}
            >
              {submitting ? "Creating listing…" : "Publish Auction"}
            </button>
            <button
              onClick={() => navigate("/account")}
              style={{ ...ghostBtn, padding: "13px 20px" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.inkLight; }}
            >Cancel</button>
          </div>
        </div>

        {/* ── Right: Preview ── */}
        <div className="sell-preview" style={{ position: "sticky", top: 32 }}>
          <p style={{
            margin: "0 0 12px", fontSize: 10, color: T.inkFaint,
            textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700,
          }}>Live Preview</p>

          <div style={{
            background: T.card, border: `1.5px solid ${T.border}`,
            borderRadius: 12, overflow: "hidden",
            opacity: fields.item_name ? 1 : 0.45,
            transition: "opacity 0.2s",
            boxShadow: "0 2px 12px rgba(60,30,5,0.07)",
          }}>
            {/* Image area */}
            <div style={{
              height: 160, background: T.amberPale,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, position: "relative",
              borderBottom: `1px solid ${T.border}`,
            }}>
              <span><img src={logo} alt="logo" style={{width: 110, paddingTop: 10}} /></span>
              <span style={{
                position: "absolute", top: 10, right: 10,
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", padding: "3px 9px", borderRadius: 999,
                background: T.greenPale, color: T.green,
                border: `1px solid #A8DFC0`,
              }}>Live</span>
            </div>

            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 style={{
                margin: 0, fontSize: 14, fontWeight: 700, color: T.inkMid,
                fontFamily: fontDisplay, lineHeight: 1.3, minHeight: 20,
              }}>
                {fields.item_name || <span style={{ color: T.inkFaint }}>Item name…</span>}
              </h3>
              {fields.description && (
                <p style={{
                  margin: 0, fontSize: 12, color: T.inkLight, lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{fields.description}</p>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-end", marginTop: 4,
                paddingTop: 8, borderTop: `1px solid ${T.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 10, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Starting Bid</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.orange, fontFamily: fontDisplay }}>
                    {fields.starting_bid ? `$${Number(fields.starting_bid).toFixed(2)}` : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Ends</div>
                  <div style={{ fontSize: 12, color: T.inkLight }}>
                    {fields.end_date ? new Date(fields.end_date).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Anime, manga & cartoon merch only",
              "Clear photos attract more bids",
              "Longer auctions get more visibility",
            ].map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: T.orange, fontSize: 10, marginTop: 3, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}