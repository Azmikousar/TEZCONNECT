import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import ConnectButton from "./ConnectButton";
import RequestsPanel from "./RequestsPanel";
import { useConnections } from "./useConnections";
import UserProfileModal from "./UserProfileModal";

import SentRequestsPanel from "./SentRequestsPanel";
import ConnectedPanel from "./ConnectedPanel";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeHi: "#fb923c", orangeLo: "#f9731612",
  orangeMd: "#f9731625", amber: "#fbbf24", text: "#eef0f8", textMid: "#6b7594",
  textLow: "#343c58", info: "#38bdf8", success: "#22c55e",
};

function Tag({ children, color = T.orange }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: color + "18", border: `1px solid ${color}33`,
      color, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function MemberCard({ member, currentUserId, connectionProps,onViewProfile }) {
  const [hov, setHov] = useState(false);
  const initials = (member.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isMe = member.id === currentUserId;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov ? T.orange + "55" : T.border}`,
        borderRadius: 16, overflow: "hidden",
        transition: "all .22s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 12px 40px #f9731615" : "none",
      }}
    >
      {/* Avatar */}
      <div style={{ padding: "0 16px", transform: "translateY(-28px)", marginBottom: -12,cursor: "pointer"  }}
      onClick={() => onViewProfile(member.id)}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: `3px solid ${T.bgCard}`,
          background: "linear-gradient(135deg,#f97316,#ea6008)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "#fff",
          overflow: "hidden", flexShrink: 0,
          boxShadow: "0 4px 16px #00000055",
        }}>
          {member.photo
            ? <img src={member.photo} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "0 16px 16px" }}>
        <div 
        onClick={() => onViewProfile(member.id)}
        style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-.02em" }}>
          {member.name || "—"}
        </div>
        {member.designation && (
          <div style={{ fontSize: 12, color: T.orange, fontWeight: 600, marginTop: 2 }}>
            {member.designation}
          </div>
        )}
        {member.company && (
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
            {member.company}{member.industry ? " · " + member.industry : ""}
          </div>
        )}
        {member.location && (
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>
            📍 {member.location}
          </div>
        )}
        {member.skills?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {member.skills.slice(0, 3).map(s => <Tag key={s}>{s}</Tag>)}
            {member.skills.length > 3 && (
              <Tag color={T.textMid}>+{member.skills.length - 3}</Tag>
            )}
          </div>
        )}

        {/* Connect button */}
        <ConnectButton
          userId={currentUserId}
          targetId={member.id}
          getStatus={connectionProps.getStatus}
          sendRequest={connectionProps.sendRequest}
          acceptRequest={connectionProps.acceptRequest}
          rejectRequest={connectionProps.rejectRequest}
          removeConnection={connectionProps.removeConnection}
        />
      </div>
    </div>
  );
}

export default function NetworkPage({ session }) {
  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [tab, setTab]                   = useState("discover");
  const mountedRef                      = useRef(true);
  const [viewingUser, setViewingUser] = useState(null);


  const {
    getStatus, sendRequest, acceptRequest,
    rejectRequest, removeConnection, pendingReceived,
    pendingSent,accepted    
  } = useConnections(session.userId);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchMembers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .not("name", "is", null)
          .order("created_at", { ascending: false });

        if (!mountedRef.current) return;
        if (error) { setError(error.message); setLoading(false); return; }
        setMembers(data || []);
        setLoading(false);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.message);
        setLoading(false);
      }
    }

    fetchMembers();
    return () => { mountedRef.current = false; };
  }, []);

  const industries = [...new Set(members.map(m => m.industry).filter(Boolean))];
  const categories = [...new Set(members.map(m => m.category).filter(Boolean))];

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || m.name?.toLowerCase().includes(q)
      || m.designation?.toLowerCase().includes(q)
      || m.company?.toLowerCase().includes(q)
      || m.location?.toLowerCase().includes(q)
      || m.skills?.some(s => s.toLowerCase().includes(q));
    const matchIndustry = !filterIndustry || m.industry === filterIndustry;
    const matchCategory = !filterCategory || m.category === filterCategory;
    return matchSearch && matchIndustry && matchCategory;
  });

  const inputStyle = {
    background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: "10px 14px",
    color: T.text, fontSize: 13, outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Failed to load network</div>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 12, color: T.textMid, maxWidth: 400 }}>
        {error}
      </div>
      <button
        onClick={() => { setError(null); setLoading(true); }}
        style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
          🌐 Member Directory
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em" }}>
          The <span style={{ color: T.orange }}>Network</span>
        </h2>
        <p style={{ color: T.textMid, fontSize: 13, marginTop: 4 }}>
          {loading ? "Loading members…" : `${filtered.length} of ${members.length} members`}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6 }}>
        {[
          ["discover", "🌐 Discover"],
          ["requests", `🤝 Requests${pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ""}`],
           ["sent", `📤 Sent${pendingSent.length > 0 ? ` (${pendingSent.length})` : ""}`],
  ["connected", `✓ Connected (${accepted.length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: tab === id ? T.orangeMd : "transparent",
              border: `1px solid ${tab === id ? T.orange + "55" : T.border}`,
              borderRadius: 9, padding: "8px 16px",
              color: tab === id ? T.orange : T.textMid,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all .2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {tab === "requests" && (
        <RequestsPanel
          pendingReceived={pendingReceived}
          acceptRequest={acceptRequest}
          rejectRequest={rejectRequest}
        />
      )}
      {/* Sent tab */}
{tab === "sent" && (
  <SentRequestsPanel
    pendingSent={pendingSent}
    removeConnection={removeConnection}
  />
)}

{/* Connected tab */}
{tab === "connected" && (
  <ConnectedPanel
    accepted={accepted}
    userId={session.userId}
    removeConnection={removeConnection}
  />
)}

      {/* Discover tab */}
      {tab === "discover" && (
        <>
          {/* Search + Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search by name, skill, company, location…"
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <select
              value={filterIndustry}
              onChange={e => setFilterIndustry(e.target.value)}
              style={{ ...inputStyle, minWidth: 150 }}
            >
              <option value="">All Industries</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ ...inputStyle, minWidth: 150 }}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(search || filterIndustry || filterCategory) && (
              <button
                onClick={() => { setSearch(""); setFilterIndustry(""); setFilterCategory(""); }}
                style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 9, padding: "10px 16px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Clear ×
              </button>
            )}
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, height: 260, opacity: 0.4 }} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No members found</div>
              <div style={{ color: T.textMid, fontSize: 13 }}>Try a different search or clear your filters</div>
            </div>
          )}
          {/* Member list */}
{!loading && filtered.length > 0 && (
  <div style={{ display: "flex", flexDirection: "column" }}>
    {filtered.map(member => (
      <MemberCard
        key={member.id}
        member={member}
        currentUserId={session.userId}
        connectionProps={{
          getStatus, sendRequest, acceptRequest,
          rejectRequest, removeConnection,
        }}
        onViewProfile={setViewingUser}
      />
    ))}
  </div>
)}

                  
              
              {viewingUser && (
  <UserProfileModal
    userId={viewingUser}
    session={session}
    onClose={() => setViewingUser(null)}
    connectionProps={{ getStatus, sendRequest, acceptRequest, rejectRequest, removeConnection }}
  />
)}

            

    </div>
  );
}
    
