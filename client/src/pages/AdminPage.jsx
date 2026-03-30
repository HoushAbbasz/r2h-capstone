// import react hooks for state and side effects
import { useState, useEffect } from "react";
// import authentication context to get the auth token
import { useAuth } from "../context/AuthContext";
 
// base api url for all admin requests
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

// primary filled button style object
const primaryBtn = {
  padding: "9px 18px", background: T.orange, color: "#fff",
  border: "none", borderRadius: 8,
  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
  cursor: "pointer", letterSpacing: "0.04em",
  transition: "background 0.15s",
};

// ghost/outline button style object
const ghostBtn = {
  padding: "6px 14px", background: "transparent",
  border: `1.5px solid ${T.border}`,
  borderRadius: 6, fontFamily: fontUI, fontSize: 12, fontWeight: 700,
  cursor: "pointer", color: T.inkLight,
  transition: "all 0.15s",
};

// function for ban/unban button styles based on current banned state
const banBtn = (isBanned) => ({
  padding: "5px 12px", borderRadius: 6, border: "none",
  fontFamily: fontUI, fontSize: 11, fontWeight: 700, cursor: "pointer",
  background: isBanned ? T.greenPale : T.redPale,
  color:      isBanned ? T.green     : T.red,
  letterSpacing: "0.03em",
});

// function for flag/unflag button styles based on current flagged state
const flagBtn = (isFlagged) => ({
  padding: "5px 12px", borderRadius: 6, border: "none",
  fontFamily: fontUI, fontSize: 11, fontWeight: 700, cursor: "pointer",
  background: isFlagged ? T.orangePale : T.redPale,
  color:      isFlagged ? T.orange     : T.red,
  letterSpacing: "0.03em",
});

// shared style object for table data cells
const tdStyle = {
  padding: "10px 12px", fontSize: 13, color: T.inkMid,
  borderBottom: `1px solid ${T.border}`, fontFamily: fontUI,
};

// shared style object for table header cells

const thStyle = {
  padding: "10px 12px", fontSize: 11, fontWeight: 700, color: T.inkFaint,
  textTransform: "uppercase", letterSpacing: "0.08em",
  background: T.amberPale, textAlign: "left", fontFamily: fontUI,
  borderBottom: `2px solid ${T.border}`,
};


// section header sub-component with load/refresh button and count badge
function SectionHeader({ title, badge, onLoad, loaded, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <h2 style={{
        margin: 0, fontSize: 18, fontWeight: 700,
        fontFamily: fontDisplay, color: T.inkMid,
      }}>{title}</h2>
      {badge != null && (
        <span style={{
          fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 10px",
          background: T.amberPale, color: T.amber, border: `1px solid #E8C97A`,
          fontFamily: fontUI,
        }}>{badge}</span>
      )}
      {onLoad && (
        <button onClick={onLoad} style={{ ...primaryBtn, padding: "6px 14px", fontSize: 12 }}>
          {loaded ? " Refresh" : "Load"}
        </button>
      )}
    </div>
  );
}


// styled table wrapper sub-component with column headers
function StyledTable({ columns, children }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: `1.5px solid ${T.border}`, marginBottom: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((c) => <th key={c} style={thStyle}>{c}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// main admin page component
export default function AdminPage() {
  const { token } = useAuth();

  // message modal state
  const [msgModal,   setMsgModal]   = useState(null);
  const [msgItemId,  setMsgItemId]  = useState("");
  const [msgBody,    setMsgBody]    = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [msgError,   setMsgError]   = useState("");

  // ban modal state
  const [banModal,   setBanModal]   = useState(null);
  const [banWorking, setBanWorking] = useState(false);

  // data state
  const [userSearch,          setUserSearch]          = useState("");
  const [users,               setUsers]               = useState([]);
  const [usersLoaded,         setUsersLoaded]         = useState(false);

  const [itemSearch,          setItemSearch]          = useState("");
  const [items,               setItems]               = useState([]);
  const [itemsLoaded,         setItemsLoaded]         = useState(false);

  const [scanResult,          setScanResult]          = useState(null);
  const [scanning,            setScanning]            = useState(false);
  const [scanError,           setScanError]           = useState("");

  const [reportedUsers,       setReportedUsers]       = useState([]);
  const [reportedUsersLoaded, setReportedUsersLoaded] = useState(false);
  const [reportedItems,       setReportedItems]       = useState([]);
  const [reportedItemsLoaded, setReportedItemsLoaded] = useState(false);

  const [statusMsg, setStatusMsg] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  // auto load everything on mount
  useEffect(() => {
    fetchUsers("");
    fetchItems("");
    fetchReportedUsers();
    fetchReportedItems();
  }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchReportedUsers = async () => {
    const res  = await fetch(`${API}/api/admin/reported-users`, { headers });
    const data = await res.json();
    if (!res.ok) return console.error("fetchReportedUsers failed:", data);
    setReportedUsers(Array.isArray(data) ? data : []);
    setReportedUsersLoaded(true);
  };

  const fetchReportedItems = async () => {
    const res  = await fetch(`${API}/api/admin/reported-items`, { headers });
    const data = await res.json();
    if (!res.ok) return console.error("fetchReportedItems failed:", data);
    setReportedItems(Array.isArray(data) ? data : []);
    setReportedItemsLoaded(true);
  };

  const fetchUsers = async (search = userSearch) => {
    const res  = await fetch(`${API}/api/admin/users?search=${encodeURIComponent(search)}`, { headers });
    const data = await res.json();
    if (!res.ok) return console.error("fetchUsers failed:", data);
    setUsers(Array.isArray(data) ? data : []);
    setUsersLoaded(true);
  };

  const fetchItems = async (search = itemSearch) => {
    const res  = await fetch(`${API}/api/admin/items?search=${encodeURIComponent(search)}`, { headers });
    const data = await res.json();
    if (!res.ok) return console.error("fetchItems failed:", data);
    setItems(Array.isArray(data) ? data : []);
    setItemsLoaded(true);
  };

  const handleUserSearch = (val) => { setUserSearch(val); fetchUsers(val); };
  const handleItemSearch = (val) => { setItemSearch(val); fetchItems(val); };

  // ── Ban / unban ───────────────────────────────────────────────────────────
  const banUser = async (id, ban) => {
    const res  = await fetch(`${API}/api/admin/users/${id}/flag`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: ban ? 1 : 0 }),
    });
    const data = await res.json();
    setStatusMsg(ban ? "User banned" : "User unbanned");
    setUsers((prev) => prev.map((u) => u.user_id === id ? { ...u, flagged: ban ? 1 : 0 } : u));
    setReportedUsers((prev) => prev.map((x) =>
      x.reported_user_id === id ? { ...x, flagged: ban ? 1 : 0 } : x
    ));
  };

  // ── Flag / unflag items ───────────────────────────────────────────────────
  const flagItem = async (id, flagged) => {
    const res  = await fetch(`${API}/api/admin/items/${id}/flag`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ flagged }),
    });
    const data = await res.json();
    setStatusMsg(data.message);
    setItems((prev) => prev.map((i) => i.item_id === id ? { ...i, flagged } : i));
  };

  // ── AI scan ───────────────────────────────────────────────────────────────
  const runAiScan = async () => {
    setScanning(true); setScanError(""); setScanResult(null);
    try {
      const res  = await fetch(`${API}/api/admin/ai-scan`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setScanResult(data);
    } catch (err) { setScanError(err.message); }
    finally { setScanning(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.cream, fontFamily: fontUI }}>
      {/* Top stripe */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${T.orange} 0%, ${T.amberLight} 50%, ${T.orange} 100%)`,
      }} />

      {/* Header */}
      <div style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: "24px 32px",
      }}>
        <p style={{
          margin: "0 0 2px", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.15em", textTransform: "uppercase", color: T.inkFaint,
        }}>Shinobi Exchange</p>
        <h1 style={{
          margin: 0, fontSize: 28, fontWeight: 700,
          fontFamily: fontDisplay, color: T.inkMid,
        }}>Admin Dashboard</h1>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Status message */}
        {statusMsg && (
          <div style={{
            padding: "10px 16px", borderRadius: 8, marginBottom: 24,
            background: T.greenPale, border: `1px solid #A8DFC0`,
            color: T.green, fontSize: 13, fontWeight: 600,
          }}>✓ {statusMsg}</div>
        )}

        {/* ── USERS ── */}
        <section style={{
          background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: "24px", marginBottom: 28,
        }}>
          <SectionHeader
            title="Users" icon="👤"
            loaded={usersLoaded}
            onLoad={() => fetchUsers("")}
          />

          {usersLoaded && (
            <>
              <input
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                placeholder="Search users…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 14px", marginBottom: 14,
                  background: T.cream, border: `1.5px solid ${T.border}`,
                  borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
                  outline: "none",
                }}
              />
              <StyledTable columns={["ID", "Username", "Admin", "Banned", "Created At", "Actions"]}>
                {users.map((u) => (
                  <tr key={u.user_id} style={{ background: u.flagged ? T.redPale : "transparent" }}>
                    <td style={tdStyle}>{u.user_id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{u.username}</td>
                    <td style={tdStyle}>{u.admin ? <span style={{ color: T.amber, fontWeight: 700 }}>Yes</span> : "No"}</td>
                    <td style={tdStyle}>{u.flagged ? <span style={{ color: T.red, fontWeight: 700 }}>🚫 Yes</span> : "No"}</td>
                    <td style={{ ...tdStyle, color: T.inkFaint }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          style={banBtn(!!u.flagged)}
                          onClick={() => setBanModal({
                            user_id: u.user_id,
                            username: u.username,
                            action: u.flagged ? "unban" : "ban",
                          })}
                        >
                          {u.flagged ? "✓ Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => { setMsgModal({ user_id: u.user_id, username: u.username }); setMsgError(""); }}
                          style={{
                            padding: "5px 12px", borderRadius: 6, border: "none",
                            fontFamily: fontUI, fontSize: 11, fontWeight: 700, cursor: "pointer",
                            background: T.amberPale, color: T.amber,
                          }}
                        >✉ Message</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </StyledTable>
            </>
          )}
        </section>

        {/* ── ITEMS ── */}
        <section style={{
          background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: "24px", marginBottom: 28,
        }}>
          <SectionHeader
            title="Items" icon="🏷️"
            loaded={itemsLoaded}
            onLoad={() => fetchItems("")}
          />

          {itemsLoaded && (
            <>
              <input
                value={itemSearch}
                onChange={(e) => handleItemSearch(e.target.value)}
                placeholder="Search items…"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "9px 14px", marginBottom: 14,
                  background: T.cream, border: `1.5px solid ${T.border}`,
                  borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
                  outline: "none",
                }}
              />
              <StyledTable columns={["ID", "Name", "Status", "Flagged", "Start Bid", "Current Bid", "Seller ID", "Action"]}>
                {items.map((item) => (
                  <tr key={item.item_id} style={{ background: item.flagged ? T.redPale : "transparent" }}>
                    <td style={tdStyle}>{item.item_id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{item.item_name}</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                        background: item.status === "active" ? T.greenPale : T.orangePale,
                        color:      item.status === "active" ? T.green     : T.orange,
                        border: `1px solid ${item.status === "active" ? "#A8DFC0" : "#F0B080"}`,
                        textTransform: "uppercase", letterSpacing: "0.06em",
                      }}>{item.status}</span>
                    </td>
                    <td style={tdStyle}>{item.flagged ? <span style={{ color: T.red, fontWeight: 700 }}>🚩 Yes</span> : "No"}</td>
                    <td style={tdStyle}>${item.starting_bid}</td>
                    <td style={{ ...tdStyle, color: T.orange, fontWeight: 700 }}>{item.current_bid ? `$${item.current_bid}` : "—"}</td>
                    <td style={{ ...tdStyle, color: T.inkFaint }}>{item.seller_id}</td>
                    <td style={tdStyle}>
                      <button style={flagBtn(!!item.flagged)} onClick={() => flagItem(item.item_id, item.flagged ? 0 : 1)}>
                        {item.flagged ? "Unflag" : "Flag"}
                      </button>
                    </td>
                  </tr>
                ))}
              </StyledTable>
            </>
          )}
        </section>

        {/* ── AI SCAN ── */}
        <section style={{
          background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: "24px", marginBottom: 28,
        }}>
          <SectionHeader title="AI Anomaly Detection" />
          <button
            onClick={runAiScan} disabled={scanning}
            style={{
              ...primaryBtn,
              background: scanning ? T.inkFaint : T.orange,
              cursor: scanning ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!scanning) e.currentTarget.style.background = T.orangeHover; }}
            onMouseLeave={(e) => { if (!scanning) e.currentTarget.style.background = T.orange; }}
          >
            {scanning ? "Scanning…" : "Run AI Scan"}
          </button>

          {scanError && (
            <div style={{
              marginTop: 14, padding: "10px 14px", borderRadius: 8,
              background: T.redPale, border: `1px solid #E9A8A3`,
              color: T.red, fontSize: 13, fontWeight: 600,
            }}>Error: {scanError}</div>
          )}

          {scanResult && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: T.inkMid, fontFamily: fontDisplay }}>
                Flagged Items ({scanResult.flagged_items.length})
              </h3>
              {scanResult.flagged_items.length === 0 ? (
                <p style={{ color: T.inkFaint, fontSize: 14, fontStyle: "italic" }}>No suspicious items found.</p>
              ) : (
                <StyledTable columns={["Item ID", "Flag Type", "Reason", "Action"]}>
                  {scanResult.flagged_items.map((item) => {
                    const liveItem  = items.find((li) => li.item_id === item.item_id);
                    const isFlagged = liveItem ? liveItem.flagged : 0;
                    return (
                      <tr key={item.item_id}>
                        <td style={tdStyle}>{item.item_id}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: T.amber }}>{item.flag_type}</td>
                        <td style={{ ...tdStyle, color: T.inkLight }}>{item.reason}</td>
                        <td style={tdStyle}>
                          <button style={flagBtn(!!isFlagged)} onClick={() => flagItem(item.item_id, isFlagged ? 0 : 1)}>
                            {isFlagged ? "Unflag" : "Flag"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </StyledTable>
              )}
            </div>
          )}
        </section>

        {/* ── REPORTED USERS ── */}
        <section style={{
          background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: "24px", marginBottom: 28,
        }}>
          <SectionHeader
            title="Reported Users"
            loaded={reportedUsersLoaded}
            onLoad={fetchReportedUsers}
          />
          {reportedUsersLoaded && (
            reportedUsers.length === 0 ? (
              <p style={{ color: T.inkFaint, fontStyle: "italic", fontSize: 14 }}>No reports.</p>
            ) : (
              <StyledTable columns={["Reported User", "Reported By", "Reason", "Date", "Banned?", "Action"]}>
                {reportedUsers.map((r) => (
                  <tr key={r.report_id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.reported_username} <span style={{ color: T.inkFaint }}>#{r.reported_user_id}</span></td>
                    <td style={tdStyle}>{r.reporter_username}</td>
                    <td style={{ ...tdStyle, color: T.inkLight }}>{r.reason}</td>
                    <td style={{ ...tdStyle, color: T.inkFaint }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>{r.flagged ? <span style={{ color: T.red, fontWeight: 700 }}>🚫 Yes</span> : "No"}</td>
                    <td style={tdStyle}>
                      <button
                        style={banBtn(!!r.flagged)}
                        onClick={() => setBanModal({
                          user_id: r.reported_user_id,
                          username: r.reported_username,
                          action: r.flagged ? "unban" : "ban",
                        })}
                      >
                        {r.flagged ? "✓ Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </StyledTable>
            )
          )}
        </section>

        {/* ── REPORTED ITEMS ── */}
        <section style={{
          background: T.card, border: `1.5px solid ${T.border}`,
          borderRadius: 12, padding: "24px", marginBottom: 28,
        }}>
          <SectionHeader
            title="Reported Items"
            loaded={reportedItemsLoaded}
            onLoad={fetchReportedItems}
          />
          {reportedItemsLoaded && (
            reportedItems.length === 0 ? (
              <p style={{ color: T.inkFaint, fontStyle: "italic", fontSize: 14 }}>No reports.</p>
            ) : (
              <StyledTable columns={["Item", "Seller", "Reported By", "Reason", "Date", "Flagged?", "Action"]}>
                {reportedItems.map((r) => (
                  <tr key={r.report_id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{r.item_name} <span style={{ color: T.inkFaint }}>#{r.item_id}</span></td>
                    <td style={tdStyle}>{r.seller_username}</td>
                    <td style={tdStyle}>{r.reporter_username}</td>
                    <td style={{ ...tdStyle, color: T.inkLight }}>{r.reason}</td>
                    <td style={{ ...tdStyle, color: T.inkFaint }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={tdStyle}>{r.flagged ? <span style={{ color: T.red, fontWeight: 700 }}>🚩 Yes</span> : "No"}</td>
                    <td style={tdStyle}>
                      <button style={flagBtn(!!r.flagged)} onClick={() => {
                        flagItem(r.item_id, r.flagged ? 0 : 1);
                        setReportedItems((prev) => prev.map((x) =>
                          x.item_id === r.item_id ? { ...x, flagged: r.flagged ? 0 : 1 } : x
                        ));
                      }}>
                        {r.flagged ? "Unflag" : "Flag"}
                      </button>
                    </td>
                  </tr>
                ))}
              </StyledTable>
            )
          )}
        </section>

      </div>

      {/* ── ADMIN MESSAGE MODAL ── */}
      {msgModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(28,16,8,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={() => { setMsgModal(null); setMsgBody(""); setMsgItemId(""); setMsgError(""); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.card, borderRadius: 14, padding: "28px 28px 24px",
              width: "100%", maxWidth: 480,
              border: `1.5px solid ${T.border}`,
              boxShadow: "0 12px 48px rgba(28,16,8,0.18)",
              fontFamily: fontUI,
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontFamily: fontDisplay, fontSize: 17, color: T.inkMid }}>
              Message User
            </h3>
            <p style={{ margin: "0 0 18px", fontSize: 12, color: T.inkFaint }}>
              Sending as Admin → <strong style={{ color: T.inkMid }}>{msgModal.username}</strong>
            </p>

            <label style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Item ID (required)
            </label>
            <input
              value={msgItemId}
              onChange={(e) => setMsgItemId(e.target.value)}
              placeholder="e.g. 42"
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                margin: "6px 0 14px", padding: "9px 12px",
                background: T.cream, border: `1.5px solid ${T.border}`,
                borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink, outline: "none",
              }}
            />

            <label style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Message
            </label>
            <textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              placeholder="Type your message…"
              rows={4}
              style={{
                display: "block", width: "100%", boxSizing: "border-box",
                margin: "6px 0 14px", padding: "9px 12px",
                background: T.cream, border: `1.5px solid ${T.border}`,
                borderRadius: 8, fontFamily: fontUI, fontSize: 13, color: T.ink,
                outline: "none", resize: "vertical",
              }}
            />

            {msgError && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: T.redPale, border: `1px solid #E9A8A3`,
                color: T.red, fontSize: 12, fontWeight: 600,
              }}>{msgError}</div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setMsgModal(null); setMsgBody(""); setMsgItemId(""); setMsgError(""); }}
                style={{ ...ghostBtn }}
              >Cancel</button>
              <button
                disabled={msgSending}
                onClick={async () => {
                  if (!msgItemId.trim() || !msgBody.trim()) {
                    setMsgError("Item ID and message body are required."); return;
                  }
                  setMsgSending(true); setMsgError("");
                  try {
                    const res = await fetch(`${API}/api/admin/message-user`, {
                      method: "POST",
                      headers: { ...headers, "Content-Type": "application/json" },
                      body: JSON.stringify({ recipient_id: msgModal.user_id, item_id: Number(msgItemId), body: msgBody }),
                    });
                    const data = await res.json();
                    if (!res.ok) { setMsgError(data.error ?? "Failed to send"); return; }
                    setStatusMsg(`Message sent to ${msgModal.username}`);
                    setMsgModal(null); setMsgBody(""); setMsgItemId(""); setMsgError("");
                  } catch { setMsgError("Network error"); }
                  finally { setMsgSending(false); }
                }}
                style={{
                  ...primaryBtn,
                  background: msgSending ? T.inkFaint : T.orange,
                  cursor: msgSending ? "not-allowed" : "pointer",
                }}
              >{msgSending ? "Sending…" : "Send Message"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── BAN CONFIRMATION MODAL ── */}
      {banModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1001,
            background: "rgba(28,16,8,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={() => setBanModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.card, borderRadius: 14, padding: "32px 28px 24px",
              width: "100%", maxWidth: 420, textAlign: "center",
              border: `1.5px solid ${banModal.action === "ban" ? "#E9A8A3" : "#A8DFC0"}`,
              boxShadow: "0 12px 48px rgba(28,16,8,0.18)",
              fontFamily: fontUI,
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%", margin: "0 auto 18px",
              background: banModal.action === "ban" ? T.redPale : T.greenPale,
              border: `2px solid ${banModal.action === "ban" ? "#E9A8A3" : "#A8DFC0"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              {banModal.action === "ban" ? "🚫" : "✅"}
            </div>

            <h3 style={{
              margin: "0 0 10px", fontFamily: fontDisplay, fontSize: 18, fontWeight: 700,
              color: banModal.action === "ban" ? T.red : T.green,
            }}>
              {banModal.action === "ban" ? "Ban User?" : "Unban User?"}
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.inkLight, lineHeight: 1.7 }}>
              {banModal.action === "ban" ? (
                <>Are you sure you want to ban <strong style={{ color: T.inkMid }}>{banModal.username}</strong>? They will no longer be able to log in and will see a misconduct notice.</>
              ) : (
                <>Restore access for <strong style={{ color: T.inkMid }}>{banModal.username}</strong>? They will be able to log in again.</>
              )}
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setBanModal(null)}
                style={{
                  padding: "9px 20px", background: "transparent",
                  border: `1.5px solid ${T.border}`, borderRadius: 8,
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", color: T.inkLight,
                }}
              >Cancel</button>
              <button
                disabled={banWorking}
                onClick={async () => {
                  setBanWorking(true);
                  await banUser(banModal.user_id, banModal.action === "ban");
                  setBanWorking(false);
                  setBanModal(null);
                }}
                style={{
                  padding: "9px 24px", border: "none", borderRadius: 8,
                  fontFamily: fontUI, fontSize: 13, fontWeight: 700,
                  cursor: banWorking ? "not-allowed" : "pointer",
                  background: banWorking
                    ? T.inkFaint
                    : banModal.action === "ban" ? T.red : T.green,
                  color: "#fff", transition: "opacity 0.15s",
                }}
              >
                {banWorking ? "Working…" : banModal.action === "ban" ? "Yes, Ban User" : "Yes, Unban User"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}