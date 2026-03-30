// import react hooks for state, memoized callbacks, and refs
import { useState, useEffect, useCallback, useRef } from "react";
// import navigation hook from react router
import { useNavigate } from "react-router-dom";
// import site logo image asset
import  logo from "../assets/logo.png";
 
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

// available sort options for the sort dropdown
const SORT_OPTIONS = [
  { value: "end_date_asc",  label: "Ending Soon" },
  { value: "end_date_desc", label: "Ending Latest" },
  { value: "bid_asc",       label: "Price: Low → High" },
  { value: "bid_desc",      label: "Price: High → Low" },
  { value: "newest",        label: "Newly Listed" },
];

const STATUS_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Closed" },
  { value: "all",      label: "All" },
];

// available status filter options as pill buttons
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

// itemcard sub-component renders a single clickable item listing card
function ItemCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  const tl = timeLeft(item.end_date);
  tl.ended ? "Ended" : "Live";
  const price = item.current_bid ?? item.starting_bid;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.card,
        border: `1.5px solid ${hovered ? T.orange : T.border}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 32px rgba(232,98,26,0.14)"
          : "0 2px 10px rgba(60,30,5,0.07)",
        fontFamily: fontUI,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image placeholder area */}
      <div style={{
        height: 160,
        background: T.amberPale,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
        position: "relative",
        borderBottom: `1px solid ${T.border}`,
      }}>
        {item.image && item.image.trim() !== "" ? (
          <img
            src={item.image} alt={item.item_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <img src={logo} alt="logo" style={{width: 110, paddingTop: 10}} />
        )}

        {/* Status badge */}
        <span style={{
          position: "absolute", top: 10, left: 10,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "3px 9px", borderRadius: 999,
          background: (!tl.ended && item.status === "active") ? T.greenPale : T.orangePale,
          color: (!tl.ended && item.status === "active") ? T.green : T.orange,
          border: `1px solid ${(!tl.ended && item.status === "active") ? "#A8DFC0" : T.orange}`,
        }}>
          {tl.ended ? "Ended" : "Live"}
        </span>

        {/* Bid count */}
        {item.bid_count > 0 && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 999,
            background: "rgba(28,16,8,0.65)", color: "#fff",
          }}>
            {item.bid_count} bid{item.bid_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700,
          color: T.inkMid, fontFamily: fontDisplay,
          lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{item.item_name}</h3>

        {item.description && (
          <p style={{
            margin: 0, fontSize: 12, color: T.inkLight, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{item.description}</p>
        )}

        {/* Price + time row */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginTop: "auto", paddingTop: 8,
          borderTop: `1px solid ${T.border}`,
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
              {item.current_bid ? "Current Bid" : "Starting Bid"}
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
              {tl.urgent && !tl.ended ? "⚡ " : tl.ended ? "—" : ""}{tl.text}
            </div>
          </div>
        </div>

        {/* Seller */}
        <div style={{ fontSize: 11, color: T.inkFaint }}>
          by <span style={{ color: T.inkLight, fontWeight: 600 }}>{item.seller_username}</span>
        </div>
      </div>
    </div>
  );
}

// main browse page component
export default function BrowsePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [sort, setSort] = useState("end_date_asc");
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);

  const fetchItems = useCallback(async (s, st, so) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ search: s, status: st, sort: so });
      const res    = await fetch(`${API}/api/items?${params}`);
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(search, status, sort); }, [status, sort]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(val, status, sort), 300);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>
      {/* Top accent stripe */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      {/* Header */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "24px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <p style={{
            margin: "0 0 2px", fontSize: 15, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkFaint,
          }}>Shinobi Exchange</p>
          <h1 style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            fontFamily: fontDisplay, color: T.inkMid, letterSpacing: "-0.01em",
          }}>Browse Listings</h1>
        </div>
        {!loading && (
          <span style={{
            fontSize: 13, fontWeight: 700,
            padding: "4px 14px", borderRadius: 999,
            background: T.amberPale, color: T.amber,
            border: `1px solid #E8C97A`,
          }}>
            {items.length} item{items.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        padding: "16px 32px",
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.cream,
          border: `1.5px solid ${focused ? T.orange : T.border}`,
          borderRadius: 8, padding: "8px 14px",
          flex: "1 1 220px", minWidth: 0,
          transition: "border-color 0.18s",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search items…"
            style={{
              border: "none", background: "transparent",
              fontFamily: fontUI, fontSize: 13, color: T.ink,
              outline: "none", width: "100%",
            }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setStatus(opt.value)} style={{
              padding: "7px 14px", borderRadius: 999, border: "none",
              fontFamily: fontUI, fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s",
              background: status === opt.value ? T.orange : T.orangePale,
              color:      status === opt.value ? "#fff"   : T.orange,
              letterSpacing: "0.03em",
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "8px 12px",
            background: T.cream,
            border: `1.5px solid ${T.border}`,
            borderRadius: 8,
            fontFamily: fontUI, fontSize: 13, color: T.inkMid,
            cursor: "pointer", outline: "none",
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
        {error && (
          <div style={{
            padding: "14px 18px", borderRadius: 10,
            background: T.redPale, border: `1px solid #E9A8A3`,
            color: T.red, fontSize: 14, marginBottom: 24,
          }}>⚠ {error}</div>
        )}

        {loading ? (
          // Skeleton grid
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                height: 320, borderRadius: 12,
                background: `linear-gradient(90deg, ${T.border} 25%, ${T.amberPale} 50%, ${T.border} 75%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
              }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}><img src={logo} alt="logo" style={{width: 210, paddingTop: 10}} /></div>
            <p style={{ fontSize: 18, fontWeight: 700, color: T.inkMid, fontFamily: fontDisplay, margin: "0 0 8px" }}>
              No listings found
            </p>
            <p style={{ fontSize: 14, color: T.inkLight, margin: 0 }}>
              {search ? `No results for "${search}" — try a different search.` : "Check back soon for new auctions."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {items.map((item) => (
              <ItemCard
                key={item.item_id}
                item={item}
                onClick={() => navigate(`/items/${item.item_id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}