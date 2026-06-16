import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  amber: "#fbbf24",
};

const inputStyle = {
  width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
  borderRadius: 10, padding: "12px 14px", color: T.text,
  fontSize: 14, outline: "none", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color .2s",
};

/* ── Reusable card wrapper ── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Section header inside card ── */
function CardHeader({ icon, title, desc }) {
  return (
    <div style={{
      padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
      background: T.bgInput,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</div>
          {desc && <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{desc}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Row item (like iOS settings rows) ── */
function SettingRow({ icon, label, value, onPress, danger = false, showArrow = true }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onClick={onPress}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px",
        background: pressed ? T.bgHover : "transparent",
        cursor: onPress ? "pointer" : "default",
        transition: "background .1s",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: danger ? T.errorLo : T.orangeLo,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? T.error : T.text }}>
          {label}
        </div>
        {value && (
          <div style={{ fontSize: 12, color: T.textLow, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value}
          </div>
        )}
      </div>
      {showArrow && onPress && (
        <span style={{ color: T.textLow, fontSize: 16 }}>›</span>
      )}
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 48, height: 28, borderRadius: 14, flexShrink: 0,
        background: value ? T.orange : T.bgInput,
        border: `1px solid ${value ? T.orange : T.border}`,
        cursor: "pointer", position: "relative",
        transition: "all .25s",
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: "#fff",
        position: "absolute", top: 2,
        left: value ? 22 : 2,
        transition: "left .25s",
        boxShadow: "0 1px 4px #00000044",
      }} />
    </div>
  );
}

/* ── Alert ── */
function Alert({ type = "success", children }) {
  const c = {
    success: { bg: T.successLo, border: T.success, color: T.success },
    error:   { bg: T.errorLo,   border: T.error,   color: T.error },
  }[type];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}44`,
      borderRadius: 10, padding: "10px 14px",
      fontSize: 12, color: c.color, fontWeight: 600,
      animation: "scaleIn .2s ease",
    }}>
      {type === "success" ? "✓ " : "⚠ "}{children}
    </div>
  );
}

/* ══════════════════════════════════════
   SCREENS
══════════════════════════════════════ */

function AccountScreen({ session }) {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile card */}
      <Card>
        <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {(session.name || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>{session.name}</div>
            <div style={{ fontSize: 12, color: T.textLow, marginTop: 2 }}>{session.email}</div>
            <div style={{ fontSize: 11, color: T.orange, marginTop: 4, fontWeight: 600 }}>
              ● Active Member
            </div>
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card>
        <CardHeader icon="👤" title="Account Details" />
        <SettingRow icon="✉️" label="Email" value={session.email} showArrow={false} />
        <SettingRow
          icon="🪪"
          label="User ID"
          value={session.userId?.slice(0, 18) + "…"}
          onPress={() => copy(session.userId)}
          showArrow={false}
        />
        {copied && (
          <div style={{ padding: "8px 20px" }}>
            <Alert type="success">User ID copied to clipboard</Alert>
          </div>
        )}
      </Card>
    </div>
  );
}

function PublicURLScreen({ session, profile }) {
  const [username, setUsername] = useState(profile.username || "");
  const [status, setStatus]     = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);

  const profileUrl = username.length >= 3
    ? `${window.location.origin}/u/${username}`
    : "";

  const checkUsername = async (val) => {
    if (!val || val.length < 3) return;
    setChecking(true);
    const { data } = await supabase
      .from("profiles").select("id")
      .eq("username", val.toLowerCase())
      .neq("id", session.userId).single();
    setChecking(false);
    setStatus(data
      ? { type: "error", msg: "Username already taken." }
      : { type: "success", msg: "Username is available!" }
    );
  };

  const save = async () => {
    if (!username || username.length < 3) { setStatus({ type: "error", msg: "Min. 3 characters." }); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setStatus({ type: "error", msg: "Only lowercase letters, numbers, underscores." }); return; }
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ username: username.toLowerCase() }).eq("id", session.userId);
    setLoading(false);
    setStatus(error
      ? { type: "error", msg: error.message }
      : { type: "success", msg: "Username saved! Your profile is live." }
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader icon="🔗" title="Your Public Profile URL" desc="Share your profile with anyone" />
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {status && <Alert type={status.type}>{status.msg}</Alert>}

          {/* Username input */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
              Username
            </div>
            <div style={{ display: "flex", alignItems: "center", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              <span style={{ padding: "12px 12px 12px 14px", color: T.textLow, fontSize: 14, borderRight: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                /u/
              </span>
              <input
                value={username}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                  setUsername(val);
                  setStatus(null);
                }}
                onBlur={() => checkUsername(username)}
                placeholder="yourname"
                style={{ ...inputStyle, border: "none", borderRadius: 0, flex: 1 }}
              />
              {checking && (
                <div style={{ width: 18, height: 18, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 14, flexShrink: 0 }} />
              )}
            </div>
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 6 }}>
              Only lowercase letters, numbers, and underscores. Min. 3 characters.
            </div>
          </div>

          {/* Preview URL */}
          {profileUrl && (
            <div style={{
              background: T.bgInput, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "12px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <span style={{ fontSize: 12, color: T.orange, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profileUrl}
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 8, padding: "5px 12px", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}
              >
                {copied ? "✓" : "Copy"}
              </button>
            </div>
          )}

          <button
            onClick={save}
            disabled={loading || username.length < 3}
            style={{
              background: loading || username.length < 3 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
              border: "none", borderRadius: 10, padding: "14px",
              color: loading || username.length < 3 ? T.textLow : "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: loading || username.length < 3 ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              width: "100%",
            }}
          >
            {loading ? "Saving…" : "Save Username"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function PasswordScreen({ session }) {
  const [form, setForm]     = useState({ newPwd: "", confirm: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const checks = [
    { ok: form.newPwd.length >= 8,           label: "8+ characters" },
    { ok: /[A-Z]/.test(form.newPwd),         label: "Uppercase" },
    { ok: /\d/.test(form.newPwd),            label: "Number" },
    { ok: /[^a-zA-Z0-9]/.test(form.newPwd), label: "Symbol" },
  ];
  const score = checks.filter(c => c.ok).length;
  const strengthColor = ["", T.error, T.amber, T.orange, T.success][score];

  const submit = async () => {
    if (!form.newPwd) { setStatus({ type: "error", msg: "Enter a new password." }); return; }
    if (form.newPwd !== form.confirm) { setStatus({ type: "error", msg: "Passwords do not match." }); return; }
    if (score < 3) { setStatus({ type: "error", msg: "Password is too weak." }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.newPwd });
    setLoading(false);
    if (error) { setStatus({ type: "error", msg: error.message }); return; }
    setStatus({ type: "success", msg: "Password updated successfully." });
    setForm({ newPwd: "", confirm: "" });
  };

  return (
    <Card>
      <CardHeader icon="🔒" title="Change Password" desc="Update your account password" />
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {status && <Alert type={status.type}>{status.msg}</Alert>}

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>New Password</div>
          <input
            type="password" value={form.newPwd}
            onChange={e => { set("newPwd", e.target.value); setStatus(null); }}
            placeholder="Min. 8 characters"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          {form.newPwd && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= score ? strengthColor : T.border, transition: "background .3s" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {checks.map(c => (
                  <span key={c.label} style={{ fontSize: 11, color: c.ok ? T.success : T.textLow, display: "flex", alignItems: "center", gap: 3 }}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Confirm Password</div>
          <input
            type="password" value={form.confirm}
            onChange={e => { set("confirm", e.target.value); setStatus(null); }}
            placeholder="Repeat new password"
            style={{ ...inputStyle, borderColor: form.confirm && form.confirm !== form.newPwd ? T.error : T.border }}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = form.confirm && form.confirm !== form.newPwd ? T.error : T.border}
          />
          {form.confirm && form.confirm !== form.newPwd && (
            <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ Passwords do not match</div>
          )}
        </div>

        <button
          onClick={submit} disabled={loading}
          style={{ background: loading ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "14px", color: loading ? T.textLow : "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%" }}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </div>
    </Card>
  );
}

function NotificationsScreen({ session }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const TYPE_CONFIG = {
    new_post:            { icon: "📸", text: "shared a new post" },
    connection_request:  { icon: "🤝", text: "sent you a connection request" },
    connection_accepted: { icon: "✅", text: "accepted your connection" },
    new_message:         { icon: "💬", text: "sent you a message" },
    new_comment:         { icon: "💭", text: "commented on your post" },
    new_like:            { icon: "❤️", text: "liked your post" },
  };

  useEffect(() => {
    async function load() {
      const { data: notifData } = await supabase
        .from("notifications").select("*")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false }).limit(50);

      if (!notifData?.length) { setLoading(false); return; }

      const ids = [...new Set(notifData.map(n => n.actor_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles").select("id, name, photo").in("id", ids);

      const map = {};
      (profiles || []).forEach(p => { map[p.id] = p; });
      setNotifs(notifData.map(n => ({ ...n, actor: map[n.actor_id] || null })));
      setLoading(false);
    }
    load();
  }, [session.userId]);

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", session.userId);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await supabase.from("notifications").delete().eq("user_id", session.userId);
    setNotifs([]);
  };

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats row */}
      {notifs.length > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: T.orange }}>{notifs.length}</div>
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>Total</div>
          </div>
          <div style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: unread > 0 ? T.orange : T.success }}>{unread}</div>
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>Unread</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {notifs.length > 0 && (
        <div style={{ display: "flex", gap: 10 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ flex: 1, background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "12px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              ✓ Mark all read
            </button>
          )}
          <button onClick={clearAll} style={{ flex: 1, background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 10, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            🗑 Clear all
          </button>
        </div>
      )}

      {/* List */}
      <Card>
        <CardHeader icon="🔔" title="Notification History" />
        {loading && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: 12, color: T.textLow }}>Loading…</div>
          </div>
        )}
        {!loading && notifs.length === 0 && (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>All caught up!</div>
            <div style={{ fontSize: 13, color: T.textLow }}>No notifications yet</div>
          </div>
        )}
        {!loading && notifs.map((n, idx) => {
          const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
          const actor = n.actor || {};
          const initials = (actor.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              background: n.read ? "transparent" : T.orangeMd,
              borderBottom: idx < notifs.length - 1 ? `1px solid ${T.border}` : "none",
              borderLeft: n.read ? "3px solid transparent" : `3px solid ${T.orange}`,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
                  {actor.photo ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: T.bgCard, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                  {cfg.icon}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>
                  <strong style={{ color: n.read ? T.text : T.orange }}>{actor.name || "Someone"}</strong>
                  {" "}{cfg.text}
                </div>
                <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{timeAgo(n.created_at)}</div>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange, flexShrink: 0 }} />}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function PrivacyScreen({ profile, onSave }) {
  const [visibility, setVisibility] = useState(profile.visibility || "public");
  const [saved, setSaved] = useState(false);

  const options = [
    { value: "public",      label: "🌐 Public",      desc: "Anyone on TezConnect can see your profile" },
    { value: "connections", label: "🤝 Connections",  desc: "Only your connections can see your full profile" },
    { value: "private",     label: "🔒 Private",      desc: "Only you can see your profile" },
  ];

  const save = async () => {
    await onSave({ visibility });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader icon="🔐" title="Profile Visibility" desc="Control who can see your profile" />
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {options.map(opt => (
              <div
                key={opt.value}
                onClick={() => setVisibility(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                  background: visibility === opt.value ? T.orangeMd : T.bgInput,
                  border: `1.5px solid ${visibility === opt.value ? T.orange + "55" : T.border}`,
                  transition: "all .2s",
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${visibility === opt.value ? T.orange : T.textLow}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border-color .2s" }}>
                  {visibility === opt.value && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.orange }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: visibility === opt.value ? T.orange : T.text }}>{opt.label}</div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={save}
            style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 16 }}
          >
            {saved ? "✓ Saved!" : "Save Privacy Settings"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function PreferencesScreen() {
  const [prefs, setPrefs] = useState({
    connections: true, messages: true, events: true, posts: true, likes: false, comments: true,
  });
  const [saved, setSaved] = useState(false);
  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const items = [
    { key: "connections", icon: "🤝", label: "Connection Requests", desc: "When someone sends you a request" },
    { key: "messages",    icon: "💬", label: "New Messages",        desc: "When you receive a direct message" },
    { key: "posts",       icon: "📸", label: "New Posts",           desc: "When someone in your network posts" },
    { key: "comments",    icon: "💭", label: "Comments",            desc: "When someone comments on your post" },
    { key: "likes",       icon: "❤️", label: "Likes",               desc: "When someone likes your post" },
    { key: "events",      icon: "📅", label: "Event Reminders",     desc: "24h before an event you RSVPd to" },
  ];

  return (
    <Card>
      <CardHeader icon="🔕" title="Notification Preferences" desc="Choose what you want to be notified about" />
      {items.map((item, i) => (
        <div key={item.key} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
          borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none",
        }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: T.orangeLo, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
            {item.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.label}</div>
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{item.desc}</div>
          </div>
          <Toggle value={prefs[item.key]} onChange={() => toggle(item.key)} />
        </div>
      ))}
      <div style={{ padding: "14px 20px" }}>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {saved ? "✓ Saved!" : "Save Preferences"}
        </button>
      </div>
    </Card>
  );
}

function DangerScreen({ session, onLogout }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped]   = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError]   = useState("");
  const CONFIRM_WORD = "DELETE";

  const handleDelete = async () => {
    if (typed !== CONFIRM_WORD) { setError(`Type ${CONFIRM_WORD} exactly to confirm.`); return; }
    setDeleting(true);
    await supabase.from("profiles").delete().eq("id", session.userId);
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <CardHeader icon="⚠️" title="Danger Zone" desc="Irreversible actions — be careful" />
        <div style={{ padding: "16px" }}>
          <div style={{ background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 12, padding: "16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.error, marginBottom: 6 }}>Delete Account</div>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6, marginBottom: 14 }}>
              Permanently delete your account, profile, connections, leads, and all data. This cannot be undone.
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: T.errorLo, border: `1px solid ${T.error}55`, borderRadius: 10, padding: "12px 20px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%" }}
              >
                Delete My Account
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {error && <Alert type="error">{error}</Alert>}
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>
                  Type <strong style={{ color: T.error, fontFamily: "monospace" }}>{CONFIRM_WORD}</strong> to confirm permanent deletion:
                </div>
                <input
                  value={typed}
                  onChange={e => { setTyped(e.target.value); setError(""); }}
                  placeholder={`Type ${CONFIRM_WORD}`}
                  style={{ ...inputStyle, borderColor: typed === CONFIRM_WORD ? T.error : T.border, color: typed === CONFIRM_WORD ? T.error : T.text }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setConfirmDelete(false); setTyped(""); setError(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || typed !== CONFIRM_WORD}
                    style={{ flex: 1, background: typed === CONFIRM_WORD ? T.error : T.bgInput, border: "none", borderRadius: 10, padding: "12px", color: typed === CONFIRM_WORD ? "#fff" : T.textLow, fontSize: 13, fontWeight: 700, cursor: typed === CONFIRM_WORD ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}
                  >
                    {deleting ? "Deleting…" : "Delete Everything"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN SETTINGS PAGE
══════════════════════════════════════ */
export default function SettingsPage({ session, profile, onSaveProfile, onLogout }) {
  const [screen, setScreen] = useState(null);

  const menuItems = [
    { id: "account",       icon: "👤", label: "Account",                value: session.email },
    { id: "username",      icon: "🔗", label: "Public Profile URL",     value: profile.username ? `/u/${profile.username}` : "Not set" },
    { id: "notifications", icon: "🔔", label: "Notifications",          value: "View your notification history" },
    { id: "preferences",   icon: "🔕", label: "Notification Preferences", value: "Manage what you receive" },
    { id: "password",      icon: "🔒", label: "Change Password",        value: "Update your password" },
    { id: "privacy",       icon: "🔐", label: "Privacy Settings",       value: "Control who sees your profile" },
    { id: "danger",        icon: "⚠️", label: "Danger Zone",            value: "Delete account", danger: true },
  ];

  // If a screen is selected show it with back nav
  if (screen) {
    const item = menuItems.find(m => m.id === screen);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeUp .25s ease" }}>
        {/* Back header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setScreen(null)}
            style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", color: T.text, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ← Back
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>
            {item?.icon} {item?.label}
          </div>
        </div>

        {/* Screen content */}
        {screen === "account"       && <AccountScreen session={session} />}
        {screen === "username"      && <PublicURLScreen session={session} profile={profile} />}
        {screen === "notifications" && <NotificationsScreen session={session} />}
        {screen === "preferences"   && <PreferencesScreen />}
        {screen === "password"      && <PasswordScreen session={session} />}
        {screen === "privacy"       && <PrivacyScreen profile={profile} onSave={onSaveProfile} />}
        {screen === "danger"        && <DangerScreen session={session} onLogout={onLogout} />}
      </div>
    );
  }

  // Main menu
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp .25s ease" }}>
      {/* Profile header */}
      <div style={{
        background: "linear-gradient(135deg,#0d1020,#0c0e1a)",
        border: `1px solid ${T.orange}33`,
        borderRadius: 20, padding: "24px 20px",
        display: "flex", alignItems: "center", gap: 16,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "linear-gradient(135deg,#f97316,#ea6008)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff",
          overflow: "hidden", flexShrink: 0,
          boxShadow: "0 4px 20px #f9731444",
        }}>
          {profile.photo
            ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (session.name || "?")[0].toUpperCase()
          }
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, letterSpacing: "-.02em" }}>{session.name}</div>
          <div style={{ fontSize: 12, color: T.textLow, marginTop: 2 }}>{session.email}</div>
          {profile.username && (
            <div style={{ fontSize: 12, color: T.orange, marginTop: 4, fontWeight: 600 }}>
              @{profile.username}
            </div>
          )}
        </div>
      </div>

      {/* Settings menu */}
      <Card>
        {menuItems.map((item, i) => (
          <SettingRow
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            onPress={() => setScreen(item.id)}
            danger={item.danger}
            showArrow={true}
          />
        ))}
      </Card>

      {/* Sign out button */}
      <button
        onClick={onLogout}
        style={{
          width: "100%", background: T.errorLo,
          border: `1px solid ${T.error}33`,
          borderRadius: 14, padding: "16px",
          color: T.error, fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>⏏</span>
        Sign Out
      </button>

      <div style={{ textAlign: "center", fontSize: 11, color: T.textLow, paddingBottom: 8 }}>
        TezConnect v1.0 · Made with ⚡ in India
      </div>
    </div>
  );
}
