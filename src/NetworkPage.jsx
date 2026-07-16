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
function MemberRow({ member, currentUserId, connectionProps, onViewProfile, isOnline }) {
  const isMe = member.id === currentUserId;
  const { status, connection, isSender } = connectionProps.getStatus(member.id);
  const [loading, setLoading] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const initials = (member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const reportMember = async () => {
    const reason = window.prompt(`Why are you reporting ${member.name || "this member"}?`, "");
    if (reason === null) return; // cancelled
    if (!reason.trim()) { alert("Please add a short reason so the admin knows what to look into."); return; }
    setReporting(true);
    try {
      const { error: insErr } = await supabase.from("reports").insert({
        reporter_id: currentUserId, reported_user_id: member.id, reason: reason.trim(),
      });
      if (insErr) { alert("Report failed: " + insErr.message + "\n\nMake sure the `reports` table exists (see the SQL provided)."); setReporting(false); return; }
      await supabase.from("profiles").update({ reports_count: (member.reports_count || 0) + 1 }).eq("id", member.id);
      setReported(true);
    } catch (e) { alert("Report failed: " + e.message); }
    setReporting(false);
  };

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
      } else if (result?.error) {
        // Any other error — this used to fail silently, which is exactly why
        // a connect that's actually blocked (RLS, a stale/duplicate request
        // row, a suspended account, etc.) looked like nothing happened.
        alert("Couldn't connect with " + (member.name || "this member") + ": " + (typeof result.error === "string" ? result.error : JSON.stringify(result.error)));
      }
    } catch (e) {
      alert("Couldn't connect with " + (member.name || "this member") + ": " + e.message);
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
        {/* Online dot — reflects the real is_online value now, not a hardcoded
            "always green" placeholder. Only lights up green when actually online. */}
        {isOnline && (
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: T.success, border: `2px solid ${T.bgCard}`, boxShadow: `0 0 6px ${T.success}` }} />
        )}
      </div>

      {/* Info */}
      <div onClick={() => onViewProfile(member.id)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{member.name || "—"}</span>
          {member.is_premium && <PrimeBadge />}
          {member.is_verified && <span style={{ fontSize: 9, color: T.info, background: T.info + "18", border: `1px solid ${T.info}44`, borderRadius: 20, padding: "1px 6px", fontWeight: 800 }}>🛡️ Verified</span>}
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
          <button
            onClick={reportMember}
            disabled={reporting || reported}
            title={reported ? "Reported" : "Report this member"}
            style={{ width: 34, height: 34, borderRadius: 10, background: reported ? T.errorLo : T.bgInput, border: `1px solid ${reported ? T.error + "55" : T.border}`, color: reported ? T.error : T.textLow, fontSize: 13, cursor: reporting ? "wait" : reported ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            🚩
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Admin Member Row — replaces Connect with moderation actions ── */
function AdminMemberRow({ member, onViewProfile, adminActions, isMe, isOnline, connectionProps }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const initials = (member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const isVerified   = !!member.is_verified;
  const isSuspended  = !!member.is_suspended;
  const isMuted      = !!member.is_muted;
  const isPending    = member.is_approved === false; // only "pending" if explicitly false

  const { status, connection, isSender } = connectionProps.getStatus(member.id);

  const handleConnect = async (action) => {
    setConnecting(true);
    try {
      let result;
      if (action === "send")   result = await connectionProps.sendRequest(member.id);
      if (action === "accept") result = await connectionProps.acceptRequest(connection.id);
      if (action === "remove") result = await connectionProps.removeConnection(connection.id);
      // Deliberately not passing through onLimitReached here — the admin
      // account is never subject to the free-tier connection cap, so there's
      // no upgrade prompt to show regardless of what the hook reports.
      if (result?.error && result.error !== "LIMIT_REACHED") {
        alert("Couldn't connect with " + (member.name || "this member") + ": " + (typeof result.error === "string" ? result.error : JSON.stringify(result.error)));
      }
    } catch (e) {
      alert("Couldn't connect with " + (member.name || "this member") + ": " + e.message);
    } finally { setConnecting(false); }
  };

  const connectButton = () => {
    // Sized and shaped like the small pill badges (👑 OWNER, 🛡️ VERIFIED) elsewhere
    // on this row — tiny, unobtrusive — but these are real <button>s, not
    // decorative spans, so tapping "Connect" actually sends a request the
    // other person then accepts, same as the regular member flow.
    const pillBase = { fontSize: 9.5, fontWeight: 800, borderRadius: 20, padding: "5px 10px", whiteSpace: "nowrap" };

    if (status === "accepted") return (
      <button onClick={() => handleConnect("remove")} disabled={connecting}
        style={{ ...pillBase, background: T.successLo, border: `1px solid ${T.success}55`, color: T.success, cursor: "pointer" }}>
        {connecting ? "…" : "✓ Connected"}
      </button>
    );
    if (status === "pending" && isSender) return (
      <span style={{ ...pillBase, color: T.orange, background: T.orangeLo, border: `1px solid ${T.orange}33`, display: "inline-block" }}>Requested</span>
    );
    if (status === "pending" && !isSender) return (
      <button onClick={() => handleConnect("accept")} disabled={connecting}
        style={{ ...pillBase, background: T.successLo, border: `1px solid ${T.success}55`, color: T.success, cursor: "pointer" }}>
        {connecting ? "…" : "✓ Accept"}
      </button>
    );
    return (
      <button onClick={() => handleConnect("send")} disabled={connecting}
        style={{ ...pillBase, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", color: "#fff", cursor: "pointer" }}>
        {connecting ? "…" : "🤝 Connect"}
      </button>
    );
  };

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
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: isOnline ? T.success : T.textLow, border: `2px solid ${T.bgCard}`, boxShadow: isOnline ? `0 0 6px ${T.success}` : "none" }} />
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
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {connectButton()}
          <button onClick={() => setMenuOpen(true)} disabled={busy}
            style={{ flexShrink: 0, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", color: T.text, fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🛡️ Manage <span style={{ fontSize: 10 }}>▾</span>
          </button>

          {/* Bottom sheet instead of a dropdown — a dropdown anchored to a
              row near the bottom of a long list runs off-screen with no way
              to reach the rest of the items. A sheet is always fully visible
              and scrolls on its own, regardless of where the row sits. */}
          {menuOpen && (
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: HOST_NAV_HEIGHT, background: "#000d", zIndex: 900, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div onClick={e => e.stopPropagation()} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "100%", height: "min(78vh,600px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
                <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px 4px", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>Manage {member.name || "Member"}</div>
                  <button onClick={() => setMenuOpen(false)} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 28, height: 28, color: T.textMid, fontSize: 14, cursor: "pointer" }}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", padding: "8px 8px", minHeight: 0 }}>
                  <AdminMenuItem icon="👁️" label="View Profile" onClick={() => { setMenuOpen(false); onViewProfile(member.id); }} />
                  <AdminMenuItem icon="🛡️" label={isVerified ? "Unverify Member" : "Verify Member"} onClick={() => run(adminActions.toggleVerify)} />
                  <AdminMenuItem icon="✅" label="Approve" onClick={() => run(adminActions.approveMember)} disabled={member.is_approved === true} />
                  <AdminMenuItem icon="❌" label="Reject" onClick={() => run(adminActions.rejectMember)} disabled={member.is_approved === false} />
                  <AdminMenuItem icon="📝" label="Edit Profile" onClick={() => { setMenuOpen(false); adminActions.editProfile(member); }} />
                  <AdminMenuItem icon="📊" label="View Activity" onClick={() => { setMenuOpen(false); adminActions.viewActivity(member); }} />
                  <AdminMenuItem icon="💬" label="Send Admin Message" onClick={() => { setMenuOpen(false); adminActions.sendAdminMessage(member); }} />
                  <div style={{ height: 1, background: T.border, margin: "8px 4px" }} />
                  <AdminMenuItem icon="⚠️" label="Warn User" onClick={() => run(adminActions.warnUser)} tone={T.amber} />
                  <AdminMenuItem icon="🧹" label="Clear Warnings" onClick={() => run(adminActions.clearWarnings)} tone={T.amber} disabled={!member.warning_count} />
                  <AdminMenuItem icon="🔇" label={isMuted ? "Unmute" : "Mute"} onClick={() => run(adminActions.toggleMute)} tone={T.textMid} />
                  <AdminMenuItem icon="🚫" label={isSuspended ? "Unsuspend" : "Suspend"} onClick={() => run(adminActions.toggleSuspend)} tone={T.error} />
                  <div style={{ height: 1, background: T.border, margin: "8px 4px" }} />
                  <AdminMenuItem icon="🗑️" label="Delete Account" onClick={() => run(adminActions.deleteAccount)} tone={T.error} />
                </div>
              </div>
            </div>
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
        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 11,
        padding: "13px 12px", background: "none", border: "none", borderRadius: 10,
        color: disabled ? T.textLow : (tone || T.text),
        fontSize: 14, fontWeight: 600, cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.45 : 1,
      }}>
      <span style={{ fontSize: 16 }}>{icon}</span> {label}
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
    ["Last Warning Reason", member.last_warning_reason || "—"],
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

/* ── Reports Modal (admin) — the real reporting flow. Reports are written by
   MemberRow's 🚩 button into a `reports` table; this reads them back joined
   to both the reporter's and the reported member's profile so the admin has
   real context, not just a number. */
function AdminReportsModal({ onClose, onResolved }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchReports = () => {
    setLoading(true);
    supabase.from("reports")
      .select("*, reporter:reporter_id(name), reported:reported_user_id(id, name, reports_count)")
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError(err.message + "\n\nMake sure the `reports` table exists (see the SQL provided)."); setLoading(false); return; }
        setReports(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchReports(); }, []);

  const resolve = async (report) => {
    setBusyId(report.id);
    try {
      const { error: err } = await supabase.from("reports").update({ resolved: true }).eq("id", report.id);
      if (err) { alert("Failed to resolve: " + err.message); setBusyId(null); return; }
      const newCount = Math.max(0, (report.reported?.reports_count || 1) - 1);
      await supabase.from("profiles").update({ reports_count: newCount }).eq("id", report.reported_user_id);
      setReports(prev => prev.filter(r => r.id !== report.id));
      onResolved?.(report.reported_user_id, newCount);
    } catch (e) { alert("Failed to resolve: " + e.message); }
    setBusyId(null);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: HOST_NAV_HEIGHT, background: "#000d", zIndex: 900, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "100%", height: "min(85vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 4px", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>🚩 Open Reports</div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 30, height: 30, color: T.textMid, fontSize: 15, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y", padding: "10px 20px 20px", minHeight: 0 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.textMid, fontSize: 13 }}>Loading reports…</div>
          )}
          {!loading && error && (
            <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 10, padding: "12px 14px", fontSize: 12, color: T.error, whiteSpace: "pre-line" }}>⚠ {error}</div>
          )}
          {!loading && !error && reports.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>No open reports</div>
              <div style={{ fontSize: 12, color: T.textLow, marginTop: 4 }}>You're all caught up.</div>
            </div>
          )}
          {!loading && !error && reports.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {reports.map(r => (
                <div key={r.id} style={{ background: T.bgInput, border: `1px solid ${T.error}33`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                      🚩 {r.reported?.name || "Unknown member"}
                    </div>
                    <div style={{ fontSize: 10, color: T.textLow, flexShrink: 0 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</div>
                  </div>
                  <div style={{ fontSize: 12, color: T.textMid, marginBottom: 8 }}>{r.reason}</div>
                  <div style={{ fontSize: 10.5, color: T.textLow, marginBottom: 10 }}>Reported by {r.reporter?.name || "a member"}</div>
                  <button onClick={() => resolve(r)} disabled={busyId === r.id}
                    style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 8, padding: "7px 14px", color: T.success, fontSize: 11.5, fontWeight: 700, cursor: busyId === r.id ? "wait" : "pointer" }}>
                    {busyId === r.id ? "…" : "✓ Mark Resolved"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Requests Panel ── */
function RequestsPanel({ pendingReceived, acceptRequest, rejectRequest, onViewProfile, onLimitReached, members }) {
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

  /* Resolve the sender's real profile.
     Whatever `useConnections` joins onto each pending-request row as
     `r.profiles` sometimes comes back missing name/photo (hence the "?" /
     "Member" placeholder you saw). Since this page already has every
     member's full profile loaded in `members`, we look the sender up there
     by id as the source of truth, and only fall back to whatever `r.profiles`
     has if the person somehow isn't in that list. */
  const resolveActor = (r) => {
    const senderId = r.sender_id || r.requester_id || r.user_id || r.from_user_id || r.profiles?.id;
    const fromMembers = members?.find(m => m.id === senderId);
    const joined = r.profiles || {};
    return {
      id: senderId,
      ...joined,
      ...fromMembers, // members list is the reliable source — wins over a partially-empty join
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pendingReceived.map(r => {
        const actor = resolveActor(r);
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
  const [onlineIds, setOnlineIds]     = useState(() => new Set());
  const [showWarningDetail, setShowWarningDetail] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

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

  /* Real-time "who's online" — every user of this page joins the same
     Supabase Realtime Presence channel and tracks themselves on it. Anyone
     viewing the page (including admin) sees the live set of user IDs
     currently present. This replaces the old `is_online` column, which only
     changes if something explicitly writes to it — presence updates itself
     the moment someone opens or closes the app, no extra backend needed. */
  useEffect(() => {
    if (!session?.userId) return;
    const channel = supabase.channel("network-presence", {
      config: { presence: { key: session.userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [session?.userId]);

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

  // The logged-in user's own row, used to show them their own moderation
  // status (warnings/suspension/mute) — set by an admin action elsewhere on
  // this page — since scrolling to find yourself in the list isn't a real
  // notification.
  const myProfile = members.find(m => m.id === session.userId);

  const connectionProps = {
    getStatus, sendRequest, acceptRequest, rejectRequest, removeConnection,
    // The admin account is never subject to the free-tier connection cap.
    // Guarding it here means even if useConnections ever reports
    // LIMIT_REACHED for this account, nothing happens — no upgrade modal,
    // ever, for admin.
    onLimitReached: () => { if (!isAdmin) setShowUpgrade(true); },
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
      const reason = window.prompt(`Warning reason for ${member.name || "this member"}:`, "");
      if (reason === null) return; // cancelled
      if (!reason.trim()) { alert("A reason is required so the member knows what to fix."); return; }
      await updateProfileField(member, { warning_count: (member.warning_count || 0) + 1, last_warning_reason: reason.trim() });
    },
    clearWarnings: async (member) => {
      if (!member.warning_count) return;
      if (!window.confirm(`Clear all warnings for ${member.name || "this member"}?`)) return;
      await updateProfileField(member, { warning_count: 0, last_warning_reason: null });
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
  const onlineCount = members.filter(m => onlineIds.has(m.id)).length; // live count from Realtime Presence, not a stored column
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
                { icon: "🚩", value: reportsCount, label: "Reports", color: "#f87171", onClick: () => setShowReportsModal(true) },
                { icon: "🚫", value: blockedCount, label: "Blocked", color: "#f87171" },
              ].map(s => (
                <div key={s.label} onClick={s.onClick} style={{ background: s.color + "1c", border: `1px solid ${s.color}44`, borderRadius: 12, padding: "9px 8px", textAlign: "center", cursor: s.onClick ? "pointer" : "default" }}>
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

      {/* ── Personal moderation status banner (non-admin) ──
          Surfaces admin actions taken on YOUR account directly, instead of
          you having to scroll and find your own row to notice anything
          changed. Suspended/muted show as urgent; a fresh warning shows
          until dismissed for this session; verified shows as a quiet
          confirmation. */}
      {!isAdmin && myProfile?.is_suspended && (
        <div style={{ background: T.errorLo, border: `1px solid ${T.error}55`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🚫</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.error }}>Your account has been suspended</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>Contact support if you believe this is a mistake.</div>
          </div>
        </div>
      )}
      {!isAdmin && !myProfile?.is_suspended && myProfile?.is_muted && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🔇</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>You've been muted by an admin</div>
            <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>Some actions may be limited until this is lifted.</div>
          </div>
        </div>
      )}
      {!isAdmin && myProfile?.warning_count > 0 && (
        <div
          onClick={() => setShowWarningDetail(s => !s)}
          style={{ background: "#fbbf2412", border: "1px solid #fbbf2444", borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.amber }}>
                You have {myProfile.warning_count} warning{myProfile.warning_count !== 1 ? "s" : ""} from an admin
              </div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
                {showWarningDetail ? "Tap to hide details" : "Tap to see why"}
              </div>
            </div>
            <span style={{ fontSize: 12, color: T.amber, flexShrink: 0, transform: showWarningDetail ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
          </div>
          {showWarningDetail && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #fbbf2433" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Most recent warning</div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                {myProfile.last_warning_reason || "No reason was recorded for this warning."}
              </div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 10 }}>Please review the community guidelines to avoid further action.</div>
            </div>
          )}
        </div>
      )}


      {!isAdmin && tab === "requests" && (
        <RequestsPanel
          pendingReceived={pendingReceived}
          acceptRequest={acceptRequest}
          rejectRequest={rejectRequest}
          onViewProfile={setViewingUser}
          onLimitReached={() => setShowUpgrade(true)}
          members={members}
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
                    isOnline={onlineIds.has(member.id)}
                    connectionProps={connectionProps}
                  />
                ) : (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserId={session.userId}
                    connectionProps={connectionProps}
                    onViewProfile={setViewingUser}
                    isOnline={onlineIds.has(member.id)}
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

      {/* Admin: reports modal */}
      {showReportsModal && (
        <AdminReportsModal
          onClose={() => setShowReportsModal(false)}
          onResolved={(memberId, newCount) => setMembers(prev => prev.map(m => m.id === memberId ? { ...m, reports_count: newCount } : m))}
        />
      )}
    </div>
  );
}
