import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import RequestsPanel from "./RequestsPanel";
import { useConnections } from "./useConnections";
import UserProfileModal from "./UserProfileModal";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeHi: "#fb923c", orangeLo: "#f9731612",
  orangeMd: "#f9731625", amber: "#fbbf24", text: "#eef0f8", textMid: "#6b7594",
  textLow: "#343c58", info: "#38bdf8", success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
};

/* ── List-row member card (Instagram followers-list style) ── */
function MemberCard({ member, currentUserId, connectionProps, onViewProfile }) {
  const initials = (member.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isMe = member.id === currentUserId;
  const { status, connection, isSender } = connectionProps.getStatus(member.id);
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === "send")   await connectionProps.sendRequest(member.id);
      if (action === "accept") await connectionProps.acceptRequest(connection.id);
      if (action === "reject") await connectionProps.rejectRequest(connection.id);
      if (action === "remove") await connectionProps.removeConnection(connection.id);
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    if (isMe) return null;

    if (status === "none") return (
      <button onClick={() => handle("send")} disabled={loading}
        style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:9, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:700, cursor:loading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap", opacity:loading?0.7:1 }}>
        {loading?"…":"Connect"}
      </button>
    );

    if (status === "pending" && isSender) return (
      <button onClick={() => handle("remove")} disabled={loading}
        style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 16px", color:T.textMid, fontSize:13, fontWeight:700, cursor:loading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
        {loading?"…":"Requested"}
      </button>
    );

    if (status === "pending" && !isSender) return (
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => handle("accept")} disabled={loading}
          style={{ background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:9, padding:"9px 14px", color:T.success, fontSize:13, fontWeight:700, cursor:loading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
          ✓ Accept
        </button>
        <button onClick={() => handle("reject")} disabled={loading}
          style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:9, width:36, color:T.textLow, fontSize:14, fontWeight:700, cursor:loading?"wait":"pointer" }}>
          ✕
        </button>
      </div>
    );

    if (status === "accepted") return (
      <button onClick={() => handle("remove")} disabled={loading}
        style={{ background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:9, padding:"9px 16px", color:T.success, fontSize:13, fontWeight:700, cursor:loading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
        {loading?"…":"✓ Connected"}
      </button>
    );

    if (status === "rejected") return (
      <button onClick={() => handle("send")} disabled={loading}
        style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:9, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:700, cursor:loading?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap" }}>
        {loading?"…":"Connect"}
      </button>
    );

    return null;
  };

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"12px 4px",
      borderBottom:`1px solid ${T.border}`,
    }}>
      {/* Avatar */}
      <div
        onClick={() => onViewProfile(member.id)}
        style={{
          width:52, height:52, borderRadius:"50%", flexShrink:0,
          background:"linear-gradient(135deg,#f97316,#ea6008)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, fontWeight:800, color:"#fff",
          overflow:"hidden", cursor:"pointer",
          border: isMe ? `2px solid ${T.orange}` : "none",
        }}>
        {member.photo
          ? <img src={member.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : initials
        }
      </div>

      {/* Info */}
      <div
        onClick={() => onViewProfile(member.id)}
        style={{ flex:1, minWidth:0, cursor:"pointer" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ fontWeight:700, fontSize:14, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {member.name || "—"}
          </div>
          {isMe && (
            <span style={{ fontSize:9, fontWeight:700, color:T.orange, background:T.orangeLo, border:`1px solid ${T.orange}33`, borderRadius:20, padding:"1px 7px", flexShrink:0 }}>
              You
            </span>
          )}
        </div>
        <div style={{ fontSize:12, color:T.textMid, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {member.designation || member.company || (member.industry ? member.industry : "TezConnect Member")}
        </div>
        {member.location && (
          <div style={{ fontSize:11, color:T.textLow, marginTop:2 }}>
            📍 {member.location}
          </div>
        )}
      </div>

      {/* Action button */}
      <div style={{ flexShrink:0 }}>
        {renderButton()}
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
  const [viewingUser, setViewingUser]   = useState(null);
  const mountedRef                      = useRef(true);

  const {
    getStatus, sendRequest, acceptRequest,
    rejectRequest, removeConnection, pendingReceived,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

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

          {/* Loading skeletons — list style */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 4px", borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ width:52, height:52, borderRadius:"50%", background:T.bgCard, opacity:0.5, flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ width:"50%", height:14, background:T.bgCard, opacity:0.5, borderRadius:4, marginBottom:6 }}/>
                    <div style={{ width:"35%", height:11, background:T.bgCard, opacity:0.4, borderRadius:4 }}/>
                  </div>
                  <div style={{ width:90, height:34, background:T.bgCard, opacity:0.5, borderRadius:9 }}/>
                </div>
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
                    getStatus,
                    sendRequest,
                    acceptRequest,
                    rejectRequest,
                    removeConnection,
                  }}
                  onViewProfile={setViewingUser}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* User profile modal */}
      {viewingUser && (
        <UserProfileModal
          userId={viewingUser}
          session={session}
          onClose={() => setViewingUser(null)}
          connectionProps={{
            getStatus, sendRequest, acceptRequest,
            rejectRequest, removeConnection,
          }}
        />
      )}

    </div>
  );
}
