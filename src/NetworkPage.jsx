import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { useConnections } from "./useConnections";
import UserProfileModal from "./UserProfileModal";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  purple: "#a78bfa", purpleLo: "#a78bfa12", purpleMd: "#a78bfa25",
  info: "#38bdf8", amber: "#fbbf24",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

function PrimeBadge() {
  return (
    <span style={{ fontSize: 9, color: T.amber, background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 20, padding: "1px 6px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
      👑 PRIME
    </span>
  );
}

/* ── Member Row Card ── */
function MemberRow({ member, currentUserId, connectionProps, onViewProfile }) {
  const isMe = member.id === currentUserId;
  const { status, connection, isSender } = connectionProps.getStatus(member.id);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handle = async (action) => {
    setLoading(true);
    try {
      let result;
      if (action === "send")   result = await connectionProps.sendRequest(member.id);
      if (action === "accept") result = await connectionProps.acceptRequest(connection.id);
      if (action === "reject") result = await connectionProps.rejectRequest(connection.id);
      if (action === "remove") result = await connectionProps.removeConnection(connection.id);

      if (result?.error === "LIMIT_REACHED" && connectionProps.onLimitReached) {
        connectionProps.onLimitReached();
      }
    } finally { setLoading(false); }
  };

  const renderButton = () => {
    if (isMe) return <span style={{ fontSize: 11, color: T.textLow, fontWeight: 600, background: T.bgInput, borderRadius: 8, padding: "7px 14px" }}>You</span>;

    if (status === "none") return (
      <button onClick={() => handle("send")} disabled={loading}
        style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px #f9731444" }}>
        {loading ? "…" : "Connect"}
      </button>
    );

    if (status === "pending" && isSender) return (
      <button onClick={() => handle("remove")} disabled={loading}
        style={{ background: "transparent", border: `1.5px solid ${T.orange}`, borderRadius: 10, padding: "8px 16px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer", whiteSpace: "nowrap" }}>
        {loading ? "…" : "Requested"}
      </button>
    );

    if (status === "pending" && !isSender) return (
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => handle("accept")} disabled={loading}
          style={{ background: T.successLo, border: `1.5px solid ${T.success}66`, borderRadius: 10, padding: "8px 14px", color: T.success, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          ✓ Accept
        </button>
        <button onClick={() => handle("reject")} disabled={loading}
          style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 10, width: 34, color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          ✕
        </button>
      </div>
    );

    if (status === "accepted") return (
      <button onClick={() => handle("remove")} disabled={loading}
        style={{ background: T.successLo, border: `1.5px solid ${T.success}66`, borderRadius: 10, padding: "8px 16px", color: T.success, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
        {loading ? "…" : <><span>✓</span> Connected</>}
      </button>
    );

    return (
      <button onClick={() => handle("send")} disabled={loading}
        style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "9px 18px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
        Connect
      </button>
    );
  };

  const avatarColors = ["linear-gradient(135deg,#f97316,#ea6008)", "linear-gradient(135deg,#7c3aed,#a78bfa)", "linear-gradient(135deg,#0369a1,#38bdf8)", "linear-gradient(135deg,#15803d,#22c55e)", "linear-gradient(135deg,#be123c,#f43f5e)"];
  const avatarBg = avatarColors[(member.name || "").charCodeAt(0) % avatarColors.length];

  const isNew = (() => {
    if (!member.created_at) return false;
    const diff = (Date.now() - new Date(member.created_at)) / (1000 * 60 * 60 * 24);
    return diff < 7;
  })();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      background: status === "accepted" ? "linear-gradient(135deg,#052e1610,#0b0d17)" : T.bgCard,
      border: `1px solid ${status === "accepted" ? T.success + "33" : status === "pending" && isSender ? T.orange + "44" : member.is_premium ? T.amber + "33" : T.border}`,
      borderRadius: 16,
      transition: "all .2s",
    }}>
      {/* Avatar */}
      <div
        onClick={() => onViewProfile(member.id)}
        style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", overflow: "hidden", border: `2px solid ${status === "accepted" ? T.success + "66" : member.is_premium ? T.amber + "66" : "transparent"}` }}>
          {member.photo ? <img src={member.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        {/* Online dot */}
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: T.success, border: `2px solid ${T.bgCard}`, boxShadow: `0 0 6px ${T.success}` }} />
      </div>

      {/* Info */}
      <div onClick={() => onViewProfile(member.id)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{member.name || "—"}</span>
          {member.is_premium && <PrimeBadge />}
          {isMe && <span style={{ fontSize: 9, color: T.orange, background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>You</span>}
          {isNew && !isMe && <span style={{ fontSize: 9, color: T.purple, background: T.purpleLo, border: `1px solid ${T.purple}33`, borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>New</span>}
        </div>
        <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{member.designation || member.company || "TezConnect Member"}</div>
        {member.location && (
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <span>📍</span>{member.location}
          </div>
        )}
        {(member.industry || member.category || isNew) && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {member.industry && <span style={{ fontSize: 10, color: T.purple, background: T.purpleLo, border: `1px solid ${T.purple}22`, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{member.industry}</span>}
            {member.category && <span style={{ fontSize: 10, color: T.info, background: T.info + "12", border: `1px solid ${T.info}22`, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{member.category}</span>}
            {isNew && <span style={{ fontSize: 10, color: T.textLow, borderRadius: 6, padding: "2px 8px" }}>Joined recently</span>}
          </div>
        )}
      </div>

      {/* Action button */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {renderButton()}
        {!isMe && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", color: T.textLow, fontSize: 18, cursor: "pointer", padding: "4px 6px", lineHeight: 1 }}>⋯</button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
                <div style={{ position: "absolute", top: 28, right: 0, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, zIndex: 11, minWidth: 160, boxShadow: "0 8px 24px #00000066", overflow: "hidden" }}>
                  <button onClick={() => { setMenuOpen(false); onViewProfile(member.id); }}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer", borderBottom: `1px solid ${T.border}` }}>
                    👤 View Profile
                  </button>
                  {member.whatsapp && (
                    <a href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}
                      style={{ display: "block", padding: "10px 14px", color: "#25d366", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Requests Panel ── */
function RequestsPanel({ pendingReceived, acceptRequest, rejectRequest, onViewProfile, onLimitReached }) {
  if (pendingReceived.length === 0) return (
    <div style={{ textAlign: "center", padding: "50px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>🤝</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No pending requests</div>
      <div style={{ fontSize: 13, color: T.textLow }}>Connection requests will appear here</div>
    </div>
  );

  const handleAccept = async (id) => {
    const result = await acceptRequest(id);
    if (result?.error === "LIMIT_REACHED" && onLimitReached) onLimitReached();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pendingReceived.map(r => {
        const actor = r.profiles || {};
        const initials = (actor.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgCard, border: `1px solid ${T.orange}33`, borderRadius: 16, padding: "14px 16px" }}>
            <div onClick={() => onViewProfile(actor.id)} style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
              {actor.photo ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
            <div onClick={() => onViewProfile(actor.id)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                {actor.name || "Member"}
                {actor.is_premium && <PrimeBadge />}
              </div>
              <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{actor.designation || actor.company || "TezConnect Member"}</div>
              {actor.location && <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>📍 {actor.location}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => handleAccept(r.id)}
                style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Accept
              </button>
              <button onClick={() => rejectRequest(r.id)}
                style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 12px", color: T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main NetworkPage ──
   session: { userId }
   onMessage: optional (profile) => void — called when the person taps
   "Message" inside UserProfileModal. Should open that specific person's
   chat (e.g. AppShell's handleMessageUser, which sets chatTarget and
   navigates to the Messages page). If not provided, UserProfileModal
   falls back to whatever it already does internally. */
export default function NetworkPage({ session, onMessage }) {
  const [members, setMembers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy]           = useState("newest");
  const [tab, setTab]                 = useState("discover");
  const [viewingUser, setViewingUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isAdmin = session?.userId === ADMIN_USER_ID;

  const {
    getStatus, sendRequest, acceptRequest,
    rejectRequest, removeConnection, pendingReceived, accepted, isPremium, refresh,
  } = useConnections(session.userId);
  const isUnlimited = isAdmin || isPremium;

  useEffect(() => {
    supabase.from("profiles").select("*").not("name", "is", null).order("created_at", { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false); });
  }, []);

  const industries = [...new Set(members.map(m => m.industry).filter(Boolean))];
  const categories = [...new Set(members.map(m => m.category).filter(Boolean))];

  const filtered = members
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.designation?.toLowerCase().includes(q) || m.company?.toLowerCase().includes(q) || m.location?.toLowerCase().includes(q);
      const matchIndustry = !filterIndustry || m.industry === filterIndustry;
      const matchCategory = !filterCategory || m.category === filterCategory;
      return matchSearch && matchIndustry && matchCategory;
    })
    .sort((a, b) => {
      // Priority search: Prime members surface first, always
      const aPrime = a.is_premium ? 1 : 0;
      const bPrime = b.is_premium ? 1 : 0;
      if (aPrime !== bPrime) return bPrime - aPrime;
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  const totalConnected = accepted.length;

  const connectionProps = {
    getStatus, sendRequest, acceptRequest, rejectRequest, removeConnection,
    onLimitReached: () => setShowUpgrade(true),
  };

  /* Message action from inside UserProfileModal.
     Gated the same as MessagesPage: free tier sees the upgrade modal
     instead of opening a chat. */
  const handleMessageFromModal = (profileToMessage) => {
    if (!isUnlimited) { setShowUpgrade(true); return; }
    setViewingUser(null);
    if (onMessage) onMessage(profileToMessage);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Hero Banner ── */}
      <div style={{ borderRadius: 24, padding: "24px 22px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#0a0f2e,#0d1545,#0a1628)", border: "1px solid #1e2d6b", minHeight: 200 }}>
        <div style={{ position: "absolute", top: -10, right: -20, fontSize: 130, opacity: 0.18, userSelect: "none", filter: "hue-rotate(40deg)" }}>🌐</div>
        <div style={{ position: "absolute", top: 20, right: 40, fontSize: 28, opacity: 0.7, animation: "pulse 2s ease infinite" }}>👤</div>
        <div style={{ position: "absolute", top: 60, right: 100, fontSize: 20, opacity: 0.5, animation: "pulse 2.5s ease infinite" }}>👤</div>
        <div style={{ position: "absolute", bottom: 30, right: 30, fontSize: 22, opacity: 0.5, animation: "pulse 3s ease infinite" }}>👤</div>
        <div style={{ position: "absolute", bottom: 60, right: 110, fontSize: 18, opacity: 0.4, animation: "pulse 1.8s ease infinite" }}>👤</div>
        <div style={{ position: "absolute", top: -20, right: 60, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,#f9731615 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, color: T.purple, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8 }}>Member Directory</div>
          <h2 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 6 }}>
            <span style={{ color: T.text }}>The </span>
            <span style={{ color: T.orange }}>Network</span>
          </h2>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>{filtered.length} of {members.length} members</div>

          {/* Stat pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ background: "#3b82f622", border: "1px solid #3b82f644", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>👥</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1 }}>{members.length}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Total Members</div>
              </div>
            </div>
            <div style={{ background: "#22c55e22", border: "1px solid #22c55e44", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1 }}>{totalConnected}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Connected{!isUnlimited ? " (3 free)" : ""}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setTab("discover")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1.5px solid ${tab === "discover" ? T.orange : "#ffffff22"}`, borderRadius: 10, padding: "9px 18px", color: tab === "discover" ? T.orange : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <span>🔭</span> Discover
            </button>
            <button
              onClick={() => setTab("requests")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1.5px solid ${tab === "requests" ? T.orange : "#ffffff22"}`, borderRadius: 10, padding: "9px 18px", color: tab === "requests" ? T.orange : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", position: "relative" }}>
              <span>🤝</span> Requests
              {pendingReceived.length > 0 && (
                <span style={{ background: T.error, color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, position: "absolute", top: -6, right: -6 }}>
                  {pendingReceived.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Requests Tab ── */}
      {tab === "requests" && (
        <RequestsPanel
          pendingReceived={pendingReceived}
          acceptRequest={acceptRequest}
          rejectRequest={rejectRequest}
          onViewProfile={setViewingUser}
          onLimitReached={() => setShowUpgrade(true)}
        />
      )}

      {/* ── Discover Tab ── */}
      {tab === "discover" && (
        <>
          {/* Search + filter toggle */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textLow, pointerEvents: "none" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, skill, company, location…"
                style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              style={{ width: 46, height: 46, borderRadius: 12, background: showFilters ? T.orangeMd : T.bgInput, border: `1px solid ${showFilters ? T.orange + "55" : T.border}`, color: showFilters ? T.orange : T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ⚙
            </button>
          </div>

          {/* Filter dropdowns */}
          {showFilters && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", animation: "fadeUp .2s ease" }}>
              <select value={filterIndustry} onChange={e => setFilterIndustry(e.target.value)}
                style={{ flex: 1, minWidth: 140, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.textMid, fontSize: 12, outline: "none", cursor: "pointer" }}>
                <option value="">All Industries</option>
                {industries.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                style={{ flex: 1, minWidth: 140, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.textMid, fontSize: 12, outline: "none", cursor: "pointer" }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ flex: 1, minWidth: 160, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", color: T.textMid, fontSize: 12, outline: "none", cursor: "pointer" }}>
                <option value="newest">Sort: Recently Added</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
              {(search || filterIndustry || filterCategory) && (
                <button onClick={() => { setSearch(""); setFilterIndustry(""); setFilterCategory(""); }}
                  style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "10px 14px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Clear ×
                </button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.bgInput, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "45%", height: 14, background: T.bgInput, borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: "30%", height: 11, background: T.bgInput, borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 90, height: 34, background: T.bgInput, borderRadius: 10 }} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No members found</div>
              <div style={{ fontSize: 13, color: T.textLow }}>Try a different search or clear your filters</div>
            </div>
          )}

          {/* Member list */}
          {!loading && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  currentUserId={session.userId}
                  connectionProps={connectionProps}
                  onViewProfile={setViewingUser}
                />
              ))}
            </div>
          )}

          {/* Grow your network / upgrade banner */}
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, background: "linear-gradient(135deg,#1a0a2e,#2d1854)", border: "1px solid #7c3aed44", borderRadius: 16, padding: "16px 18px", marginTop: 4 }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>👑</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                  {isUnlimited ? "Grow your network" : "Unlock unlimited connections"}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {isUnlimited ? "Invite more professionals and expand opportunities." : "Upgrade to Prime to connect, chat, and post freely."}
                </div>
              </div>
              <button
                onClick={() => {
                  if (isUnlimited) {
                    const url = "https://tezconnect.in";
                    if (navigator.share) { navigator.share({ title: "Join TezConnect", url }); }
                    else { navigator.clipboard.writeText(url); }
                  } else {
                    setShowUpgrade(true);
                  }
                }}
                style={{ flexShrink: 0, background: "linear-gradient(135deg,#7c3aed,#a78bfa)", border: "none", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
                {isUnlimited ? "👥 Invite Members" : "👑 Upgrade Now"}
              </button>
            </div>
          )}
        </>
      )}

      {/* User profile modal — onMessage routes straight to that person's chat */}
      {viewingUser && (
        <UserProfileModal
          userId={viewingUser}
          session={session}
          onClose={() => setViewingUser(null)}
          connectionProps={connectionProps}
          onMessage={handleMessageFromModal}
        />
      )}

      {/* Upgrade modal */}
      {showUpgrade && (
        <PremiumUpgradeModal
          session={session}
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => { setShowUpgrade(false); refresh(); }}
        />
      )}
    </div>
  );
}
