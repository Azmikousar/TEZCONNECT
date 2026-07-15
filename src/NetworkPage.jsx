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

// The host app (outside this component) renders its own fixed bottom nav bar
// on top of this page's webview. Full-screen modals below leave this much
// room at the bottom so their content/buttons are never hidden behind it.
const HOST_NAV_HEIGHT = 90;

function PrimeBadge() {
  return (
    <span style={{ fontSize: 9, color: T.amber, background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 20, padding: "1px 6px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2 }}>
      👑 PRIME
    </span>
  );
}

/* ── Member Row Card (normal, non-admin members) ── */
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

/* ── Admin Member Row — replaces Connect with moderation actions ── */
function AdminMemberRow({ member, onViewProfile, adminActions, isMe }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const initials = (member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const isVerified   = !!member.is_verified;
  const isSuspended  = !!member.is_suspended;
  const isMuted      = !!member.is_muted;
  const isPending    = member.is_approved === false; // only "pending" if explicitly false

  const run = async (fn) => {
    setMenuOpen(false);
    setBusy(true);
    try { await fn(member); } finally { setBusy(false); }
  };

  const avatarColors = ["linear-gradient(135deg,#f97316,#ea6008)", "linear-gradient(135deg,#7c3aed,#a78bfa)", "linear-gradient(135deg,#0369a1,#38bdf8)", "linear-gradient(135deg,#15803d,#22c55e)", "linear-gradient(135deg,#be123c,#f43f5e)"];
  const avatarBg = avatarColors[(member.name || "").charCodeAt(0) % avatarColors.length];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px",
      background: isSuspended ? "linear-gradient(135deg,#2e050510,#0b0d17)" : T.bgCard,
      border: `1px solid ${isSuspended ? T.error + "44" : isPending ? T.amber + "44" : T.border}`,
      borderRadius: 16,
      opacity: busy ? 0.6 : 1,
      transition: "all .2s",
    }}>
      {/* Avatar */}
      <div onClick={() => onViewProfile(member.id)} style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", overflow: "hidden", border: `2px solid ${isVerified ? T.info + "66" : "transparent"}` }}>
          {member.photo ? <img src={member.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        {isSuspended ? (
          <div style={{ position: "absolute", bottom: -2, right: -2, background: T.error, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, border: `2px solid ${T.bgCard}` }}>🚫</div>
        ) : (
          // Green = is_online true. Gray = offline/unknown (this column only
          // reflects reality once something in your app actually updates it —
          // see the presence note in the SQL migration).
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: member.is_online ? T.success : T.textLow, border: `2px solid ${T.bgCard}`, boxShadow: member.is_online ? `0 0 6px ${T.success}` : "none" }} />
        )}
      </div>

      {/* Info */}
      <div onClick={() => onViewProfile(member.id)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{member.name || "—"}</span>
          {isMe && <span style={{ fontSize: 9, color: "#0b0d17", background: "linear-gradient(135deg,#fbbf24,#f59e0b)", borderRadius: 20, padding: "1px 7px", fontWeight: 800 }}>👑 OWNER</span>}
          {member.is_premium && <PrimeBadge />}
          {isVerified && <span style={{ fontSize: 9, color: T.info, background: T.info + "18", border: `1px solid ${T.info}44`, borderRadius: 20, padding: "1px 6px", fontWeight: 800 }}>🛡️ VERIFIED</span>}
          {isPending && <span style={{ fontSize: 9, color: T.amber, background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 20, padding: "1px 6px", fontWeight: 800 }}>⏳ PENDING</span>}
          {isSuspended && <span style={{ fontSize: 9, color: T.error, background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 20, padding: "1px 6px", fontWeight: 800 }}>🚫 SUSPENDED</span>}
          {isMuted && <span style={{ fontSize: 9, color: T.textMid, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "1px 6px", fontWeight: 700 }}>🔇 MUTED</span>}
        </div>
        <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{member.designation || member.company || "TezConnect Member"}</div>
        <div style={{ fontSize: 10, color: T.textLow, marginTop: 3 }}>
          Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}
          {member.reports_count > 0 && <span style={{ color: T.error, fontWeight: 700 }}> · 🚩 {member.reports_count} report{member.reports_count !== 1 ? "s" : ""}</span>}
          {member.warning_count > 0 && <span style={{ color: T.amber, fontWeight: 700 }}> · ⚠️ {member.warning_count} warning{member.warning_count !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      {/* Admin actions menu — the admin's own row has nothing to manage;
          it just shows the Owner badge above and a plain "You" tag here. */}
      {isMe ? (
        <span style={{ flexShrink: 0, fontSize: 11, color: T.amber, fontWeight: 700, background: "#fbbf2412", border: "1px solid #fbbf2444", borderRadius: 8, padding: "8px 14px" }}>You</span>
      ) : (
        <div style={{ flexShrink: 0, position: "relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} disabled={busy}
            style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", color: T.text, fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🛡️ Manage <span style={{ fontSize: 10 }}>▾</span>
          </button>

          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 10 }} />
              <div style={{ position: "absolute", top: 42, right: 0, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, zIndex: 11, minWidth: 210, boxShadow: "0 12px 32px #000000aa", overflow: "hidden" }}>
                <AdminMenuItem icon="👁️" label="View Profile" onClick={() => { setMenuOpen(false); onViewProfile(member.id); }} />
                <AdminMenuItem icon="🛡️" label={isVerified ? "Unverify Member" : "Verify Member"} onClick={() => run(adminActions.toggleVerify)} />
                <AdminMenuItem icon="✅" label="Approve" onClick={() => run(adminActions.approveMember)} disabled={member.is_approved === true} />
                <AdminMenuItem icon="❌" label="Reject" onClick={() => run(adminActions.rejectMember)} disabled={member.is_approved === false} />
                <AdminMenuItem icon="📝" label="Edit Profile" onClick={() => { setMenuOpen(false); adminActions.editProfile(member); }} />
                <AdminMenuItem icon="📊" label="View Activity" onClick={() => { setMenuOpen(false); adminActions.viewActivity(member); }} />
                <AdminMenuItem icon="💬" label="Send Admin Message" onClick={() => { setMenuOpen(false); adminActions.sendAdminMessage(member); }} />
                <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                <AdminMenuItem icon="⚠️" label="Warn User" onClick={() => run(adminActions.warnUser)} tone={T.amber} />
                <AdminMenuItem icon="🔇" label={isMuted ? "Unmute" : "Mute"} onClick={() => run(adminActions.toggleMute)} tone={T.textMid} />
                <AdminMenuItem icon="🚫" label={isSuspended ? "Unsuspend" : "Suspend"} onClick={() => run(adminActions.toggleSuspend)} tone={T.error} />
                <AdminMenuItem icon="🗑️" label="Delete Account" onClick={() => run(adminActions.deleteAccount)} tone={T.error} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AdminMenuItem({ icon, label, onClick, tone, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{
        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 9,
        padding: "10px 14px", background: "none", border: "none",
        color: disabled ? T.textLow : (tone || T.text),
        fontSize: 12.5, fontWeight: 600, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}>
      <span style={{ fontSize: 13 }}>{icon}</span> {label}
    </button>
  );
}

/* ── Edit Profile Modal (admin) ── */
function AdminEditProfileModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: member.name || "", designation: member.designation || "",
    company: member.company || "", location: member.location || "",
    industry: member.industry || "", category: member.category || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box",
  };

  const save = async () => {
    setSaving(true); setError("");
    try {
      const { error: err } = await supabase.from("profiles").update(form).eq("id", member.id);
      if (err) { setError(err.message); setSaving(false); return; }
      onSaved({ ...member, ...form });
      onClose();
    } catch (e) { setError(e.message); setSaving(false); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: HOST_NAV_HEIGHT, background: "#000d", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "100%", height: "min(80vh,560px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", padding: "16px 20px 0", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>📝 Edit Profile</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 30, height: 30, color: T.textMid, fontSize: 15, cursor: "pointer" }}>×</button>
          </div>
          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["name", "Full Name"], ["designation", "Designation"], ["company", "Company"],
              ["location", "Location"], ["industry", "Industry"], ["category", "Category"],
            ].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>{label}</label>
                <input value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Modal (admin) — shows what we actually have on the profile row.
   Wire this up to a real activity/audit-log table later for richer detail. */
function AdminActivityModal({ member, onClose }) {
  const rows = [
    ["Joined", member.created_at ? new Date(member.created_at).toLocaleString() : "—"],
    ["Last Updated", member.updated_at ? new Date(member.updated_at).toLocaleString() : "—"],
    ["Prime Member", member.is_premium ? "Yes" : "No"],
    ["Verified", member.is_verified ? "Yes" : "No"],
    ["Approved", member.is_approved === false ? "Pending" : "Yes"],
    ["Suspended", member.is_suspended ? "Yes" : "No"],
    ["Muted", member.is_muted ? "Yes" : "No"],
    ["Warnings", member.warning_count || 0],
    ["Reports", member.reports_count || 0],
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: HOST_NAV_HEIGHT, background: "#000d", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "100%", height: "min(70vh,520px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", padding: "16px 20px", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>📊 Activity — {member.name || "Member"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 30, height: 30, color: T.textMid, fontSize: 15, cursor: "pointer" }}>×</button>
          </div>
          <div style={{ fontSize: 11, color: T.textLow, marginBottom: 14 }}>
            Based on the member's profile record. Connect a dedicated activity/audit log for login history, posts, and messages.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: T.border, borderRadius: 12, overflow: "hidden" }}>
            {rows.map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: T.bgInput }}>
                <span style={{ fontSize: 12, color: T.textMid }}>{label}</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
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
   onMessage: REQUIRED for the "message → open that person's chat" flow.
   Pass your AppShell's handleMessageUser (or equivalent) here — it should
   set chatTarget and navigate to the Messages page. Viewing a profile is
   always free; the Message button inside UserProfileModal is what's gated:
   free users tapping it see the upgrade modal instead of opening a chat,
   premium/admin users go straight to that person's conversation.

   For the admin account, this page renders a distinct moderation view:
   AdminMemberRow (with a Manage menu) instead of MemberRow (Connect),
   and an admin stats banner instead of the connections/requests summary.
   Some admin actions (verify, approve, suspend, mute, warn) write to
   columns on `profiles` — is_verified, is_approved, is_suspended, is_muted,
   warning_count — that need to exist in your schema. Missing columns will
   surface as a clear "Action failed" alert rather than failing silently. */
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
  const [editingMember, setEditingMember] = useState(null);
  const [activityMember, setActivityMember] = useState(null);

  const isAdmin = session?.userId === ADMIN_USER_ID;

  const {
    getStatus, sendRequest, acceptRequest,
    rejectRequest, removeConnection, pendingReceived, accepted, isPremium, refresh,
  } = useConnections(session.userId);
  const isUnlimited = isAdmin || isPremium;

  const fetchMembers = () => {
    supabase.from("profiles").select("*").not("name", "is", null).order("created_at", { ascending: false })
      .then(({ data }) => { setMembers(data || []); setLoading(false); });
  };

  useEffect(() => { fetchMembers(); }, []);

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
      // Admin's own profile always sits first — they own the platform, not
      // one more entry to browse or connect with.
      const aMe = a.id === session.userId ? 1 : 0;
      const bMe = b.id === session.userId ? 1 : 0;
      if (isAdmin && aMe !== bMe) return bMe - aMe;
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

  /* Message action fired from inside UserProfileModal.
     - Already connected (accepted) with this person: messaging is FREE,
       regardless of Prime status.
     - Not connected yet, and not Prime/admin: show upgrade modal.
     - Premium/admin: always allowed. */
  const handleMessageFromModal = (profileToMessage) => {
    const status = getStatus(profileToMessage.id)?.status;
    const isConnectedWithThisPerson = status === "accepted";

    if (!isUnlimited && !isConnectedWithThisPerson) {
      setShowUpgrade(true);
      return;
    }
    setViewingUser(null);
    if (onMessage) {
      onMessage(profileToMessage);
    } else {
      console.warn("NetworkPage: no onMessage prop provided — can't open chat. Pass onMessage={handleMessageUser} from AppShell.");
    }
  };

  /* ── Admin action handlers ──
     Each updates local state optimistically after a successful write, and
     surfaces a plain alert if the write didn't actually take effect.

     Important: Supabase Row Level Security does NOT throw an error when a
     policy blocks a write — it just quietly updates/deletes 0 rows. That
     looks identical to success unless we explicitly ask for the affected
     rows back with .select() and check whether anything came back. That's
     what the checks below are for. If you see the "no permission" alert,
     it means your `profiles` RLS policies only allow a user to write their
     own row — you need an admin policy (see the SQL provided separately)
     to let this account update/delete other members' rows. */
  const patchMemberLocal = (id, patch) => setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));

  const updateProfileField = async (member, patch) => {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", member.id).select();
    if (error) { alert("Action failed: " + error.message + "\n\nThis usually means the matching column doesn't exist yet on the profiles table."); return false; }
    if (!data || data.length === 0) {
      alert("Nothing was saved.\n\nSupabase's Row Level Security blocked this update — it likely only allows a user to edit their own profile. The admin account needs an RLS policy that allows updating any row in `profiles`. Ask for the SQL to add that policy.");
      return false;
    }
    patchMemberLocal(member.id, patch);
    return true;
  };

  const adminActions = {
    toggleVerify: (member) => updateProfileField(member, { is_verified: !member.is_verified }),
    approveMember: (member) => updateProfileField(member, { is_approved: true }),
    rejectMember: (member) => updateProfileField(member, { is_approved: false }),
    toggleSuspend: async (member) => {
      if (!member.is_suspended && !window.confirm(`Suspend ${member.name || "this member"}? They won't be able to use the platform until unsuspended.`)) return;
      await updateProfileField(member, { is_suspended: !member.is_suspended });
    },
    toggleMute: (member) => updateProfileField(member, { is_muted: !member.is_muted }),
    warnUser: async (member) => {
      const reason = window.prompt(`Warning reason for ${member.name || "this member"} (optional):`, "");
      if (reason === null) return; // cancelled
      await updateProfileField(member, { warning_count: (member.warning_count || 0) + 1 });
    },
    deleteAccount: async (member) => {
      if (!window.confirm(`Permanently delete ${member.name || "this member"}'s account? This cannot be undone.`)) return;
      const { data, error } = await supabase.from("profiles").delete().eq("id", member.id).select();
      if (error) { alert("Delete failed: " + error.message); return; }
      if (!data || data.length === 0) {
        alert("Nothing was deleted.\n\nSupabase's Row Level Security blocked this delete — the admin account needs an RLS policy allowing it to delete any row in `profiles`.");
        return;
      }
      setMembers(prev => prev.filter(m => m.id !== member.id));
    },
    editProfile: (member) => setEditingMember(member),
    viewActivity: (member) => setActivityMember(member),
    sendAdminMessage: (member) => {
      if (onMessage) onMessage(member);
      else console.warn("NetworkPage: no onMessage prop provided — can't open chat.");
    },
  };

  // Admin stat helpers — these read optional columns that default safely to
  // 0/false if the column doesn't exist on a given row.
  const newTodayCount = members.filter(m => m.created_at && (Date.now() - new Date(m.created_at)) < 24 * 60 * 60 * 1000).length;
  const onlineCount = members.filter(m => m.is_online).length; // needs an is_online column/presence system to be meaningful
  const pendingVerificationCount = members.filter(m => !m.is_verified).length;
  const reportsCount = members.reduce((sum, m) => sum + (m.reports_count || 0), 0);
  const blockedCount = members.filter(m => m.is_suspended).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Hero Banner ── */}
      <div style={{ borderRadius: 24, padding: "24px 22px", position: "relative", overflow: "hidden", background: isAdmin ? "linear-gradient(135deg,#1a0a2e,#0a0f2e,#0a1628)" : "linear-gradient(135deg,#0a0f2e,#0d1545,#0a1628)", border: `1px solid ${isAdmin ? "#7c3aed44" : "#1e2d6b"}`, minHeight: 200 }}>
        <div style={{ position: "absolute", top: -10, right: -20, fontSize: 130, opacity: 0.18, userSelect: "none", filter: "hue-rotate(40deg)" }}>{isAdmin ? "🛡️" : "🌐"}</div>
        {!isAdmin && (
          <>
            <div style={{ position: "absolute", top: 20, right: 40, fontSize: 28, opacity: 0.7, animation: "pulse 2s ease infinite" }}>👤</div>
            <div style={{ position: "absolute", top: 60, right: 100, fontSize: 20, opacity: 0.5, animation: "pulse 2.5s ease infinite" }}>👤</div>
            <div style={{ position: "absolute", bottom: 30, right: 30, fontSize: 22, opacity: 0.5, animation: "pulse 3s ease infinite" }}>👤</div>
            <div style={{ position: "absolute", bottom: 60, right: 110, fontSize: 18, opacity: 0.4, animation: "pulse 1.8s ease infinite" }}>👤</div>
          </>
        )}
        <div style={{ position: "absolute", top: -20, right: 60, width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle,${isAdmin ? "#7c3aed15" : "#f9731615"} 0%,transparent 70%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, color: T.purple, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8 }}>{isAdmin ? "Admin Dashboard" : "Member Directory"}</div>
          <h2 style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 6 }}>
            <span style={{ color: T.text }}>{isAdmin ? "The " : "The "}</span>
            <span style={{ color: T.orange }}>{isAdmin ? "Network" : "Network"}</span>
          </h2>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>{filtered.length} of {members.length} members</div>

          {/* Stat pills — admin sees moderation stats, everyone else sees connection stats */}
          {isAdmin ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
              {[
                { icon: "👥", value: members.length, label: "Total Members", color: "#3b82f6" },
                { icon: "🟢", value: onlineCount, label: "Online Now", color: "#22c55e" },
                { icon: "🆕", value: newTodayCount, label: "New Today", color: "#38bdf8" },
                { icon: "⏳", value: pendingVerificationCount, label: "Pending Verify", color: "#fbbf24" },
                { icon: "🚩", value: reportsCount, label: "Reports", color: "#f87171" },
                { icon: "🚫", value: blockedCount, label: "Blocked", color: "#f87171" },
              ].map(s => (
                <div key={s.label} style={{ background: s.color + "1c", border: `1px solid ${s.color}44`, borderRadius: 12, padding: "9px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginTop: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 8.5, color: "#94a3b8", marginTop: 1, lineHeight: 1.2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          ) : (
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
          )}

          {/* Tabs — Requests tab only makes sense for the connection flow, so it's hidden for admin */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setTab("discover")}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1.5px solid ${tab === "discover" ? T.orange : "#ffffff22"}`, borderRadius: 10, padding: "9px 18px", color: tab === "discover" ? T.orange : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <span>{isAdmin ? "🛡️" : "🔭"}</span> {isAdmin ? "Manage Members" : "Discover"}
            </button>
            {!isAdmin && (
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
            )}
          </div>
        </div>
      </div>

      {/* ── Requests Tab (non-admin only) ── */}
      {!isAdmin && tab === "requests" && (
        <RequestsPanel
          pendingReceived={pendingReceived}
          acceptRequest={acceptRequest}
          rejectRequest={rejectRequest}
          onViewProfile={setViewingUser}
          onLimitReached={() => setShowUpgrade(true)}
        />
      )}

      {/* ── Discover / Manage Tab ── */}
      {tab === "discover" && (
        <>
          {/* Search + filter toggle */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textLow, pointerEvents: "none" }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAdmin ? "Search members to manage…" : "Search by name, skill, company, location…"}
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
              {filtered.map(member =>
                isAdmin ? (
                  <AdminMemberRow
                    key={member.id}
                    member={member}
                    onViewProfile={setViewingUser}
                    adminActions={adminActions}
                    isMe={member.id === session.userId}
                  />
                ) : (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserId={session.userId}
                    connectionProps={connectionProps}
                    onViewProfile={setViewingUser}
                  />
                )
              )}
            </div>
          )}

          {/* Grow your network / upgrade banner — not relevant to the admin's job */}
          {!loading && !isAdmin && (
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

      {/* User profile modal — viewing is always free.
          onMessage inside is gated: free tier sees upgrade modal, premium
          goes straight to that person's chat via the onMessage prop. */}
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

      {/* Admin: edit profile modal */}
      {editingMember && (
        <AdminEditProfileModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={(updated) => setMembers(prev => prev.map(m => m.id === updated.id ? updated : m))}
        />
      )}

      {/* Admin: activity modal */}
      {activityMember && (
        <AdminActivityModal member={activityMember} onClose={() => setActivityMember(null)} />
      )}
    </div>
  );
}
