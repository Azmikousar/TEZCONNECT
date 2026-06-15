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
  borderRadius: 9, padding: "10px 14px", color: T.text,
  fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color .2s",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: T.textMid,
  textTransform: "uppercase", letterSpacing: ".08em",
  display: "block", marginBottom: 6,
};

function Section({ title, desc, children }) {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>
          {title}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ padding: "24px" }}>
        {children}
      </div>
    </div>
  );
}

function Alert({ type = "success", children }) {
  const c = {
    success: { bg: T.successLo, border: T.success, color: T.success },
    error:   { bg: T.errorLo,   border: T.error,   color: T.error },
  }[type];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}44`,
      borderRadius: 9, padding: "10px 14px",
      fontSize: 12, color: c.color, fontWeight: 600,
      animation: "scaleIn .2s ease",
    }}>
      {type === "success" ? "✓ " : "⚠ "}{children}
    </div>
  );
}

function ChangePasswordSection({ session }) {
  const [form, setForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const checks = [
    { ok: form.newPwd.length >= 8,        label: "8+ characters" },
    { ok: /[A-Z]/.test(form.newPwd),      label: "Uppercase letter" },
    { ok: /\d/.test(form.newPwd),         label: "Number" },
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
    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Password updated successfully." });
      setForm({ current: "", newPwd: "", confirm: "" });
    }
    setLoading(false);
  };

  return (
    <Section
      title="🔒 Change Password"
      desc="Update your account password. You'll stay logged in."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {status && <Alert type={status.type}>{status.msg}</Alert>}

        <div>
          <label style={labelStyle}>New Password</label>
          <input
            type="password" value={form.newPwd}
            onChange={e => { set("newPwd", e.target.value); setStatus(null); }}
            placeholder="Min. 8 characters"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = T.border}
          />
          {form.newPwd && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= score ? strengthColor : T.border, transition: "background .3s" }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {checks.map(c => (
                  <span key={c.label} style={{ fontSize: 10, color: c.ok ? T.success : T.textLow, display: "flex", alignItems: "center", gap: 3 }}>
                    {c.ok ? "✓" : "○"} {c.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password" value={form.confirm}
            onChange={e => { set("confirm", e.target.value); setStatus(null); }}
            placeholder="Repeat new password"
            style={{
              ...inputStyle,
              borderColor: form.confirm && form.confirm !== form.newPwd ? T.error : T.border,
            }}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = form.confirm && form.confirm !== form.newPwd ? T.error : T.border}
          />
          {form.confirm && form.confirm !== form.newPwd && (
            <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ Passwords do not match</div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            background: loading ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", borderRadius: 9, padding: "11px 20px",
            color: loading ? T.textMid : "#fff", fontSize: 13, fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            alignSelf: "flex-start",
            boxShadow: loading ? "none" : "0 4px 16px #f9731430",
          }}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </div>
    </Section>
  );
}

function AccountInfoSection({ session }) {
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(session.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="👤 Account Information" desc="Your account details and unique identifiers.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { label: "Full Name",  value: session.name },
          { label: "Email",      value: session.email },
          { label: "Member Since", value: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
        ].map(row => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 12,
            padding: "12px 0", borderBottom: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 12, color: T.textLow, fontWeight: 600, minWidth: 120 }}>
              {row.label}
            </div>
            <div style={{ fontSize: 13, color: T.text, fontWeight: 600, textAlign: "right" }}>
              {row.value}
            </div>
          </div>
        ))}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 12,
          padding: "12px 0",
        }}>
          <div style={{ fontSize: 12, color: T.textLow, fontWeight: 600 }}>
            User ID
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: T.textMid, fontFamily: "monospace", background: T.bgInput, padding: "4px 8px", borderRadius: 6, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.userId}
            </div>
            <button
              onClick={copyId}
              style={{ background: copied ? T.successLo : T.bgInput, border: `1px solid ${copied ? T.success + "44" : T.border}`, borderRadius: 7, padding: "4px 10px", color: copied ? T.success : T.textMid, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}
/*
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    connections: true,
    messages: true,
    events: true,
    leads: false,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items = [
    { key: "connections", label: "Connection Requests", desc: "When someone sends you a connection request" },
    { key: "messages",    label: "New Messages",        desc: "When you receive a direct message" },
    { key: "events",      label: "Event Reminders",     desc: "24 hours before an event you RSVPd to" },
    { key: "leads",       label: "Lead Updates",        desc: "Weekly summary of your leads activity" },
  ];

  return (
    <Section title="🔔 Notification Preferences" desc="Choose what you want to be notified about.">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item, i) => (
          <div key={item.key} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0",
            borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: T.textLow }}>
                {item.desc}
              </div>
            </div>
            {/* Toggle
            <div
              onClick={() => toggle(item.key)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: prefs[item.key] ? T.orange : T.bgInput,
                border: `1px solid ${prefs[item.key] ? T.orange : T.border}`,
                cursor: "pointer", position: "relative",
                transition: "all .25s", flexShrink: 0, marginLeft: 16,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "#fff",
                position: "absolute", top: 2,
                left: prefs[item.key] ? 22 : 2,
                transition: "left .25s",
                boxShadow: "0 1px 4px #00000044",
              }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          {saved && <Alert type="success">Preferences saved!</Alert>}
          {!saved && (
            <button
              onClick={save}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </Section>
  );
}*/

function PrivacySection({ profile, onSave }) {
  const [visibility, setVisibility] = useState(profile.visibility || "public");
  const [saved, setSaved] = useState(false);

  const options = [
    { value: "public",       label: "🌐 Public",       desc: "Anyone on TezConnect can see your profile" },
    { value: "connections",  label: "🤝 Connections",  desc: "Only your connections can see your full profile" },
    { value: "private",      label: "🔒 Private",      desc: "Only you can see your profile" },
  ];

  const save = async () => {
    await onSave({ visibility });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="🔐 Privacy Settings" desc="Control who can see your profile and contact you.">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {options.map(opt => (
          <div
            key={opt.value}
            onClick={() => setVisibility(opt.value)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 10, cursor: "pointer",
              background: visibility === opt.value ? T.orangeMd : T.bgInput,
              border: `1.5px solid ${visibility === opt.value ? T.orange + "55" : T.border}`,
              transition: "all .2s",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: `2px solid ${visibility === opt.value ? T.orange : T.textLow}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "border-color .2s",
            }}>
              {visibility === opt.value && (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange }} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: visibility === opt.value ? T.orange : T.text }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>
                {opt.desc}
              </div>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          {saved
            ? <Alert type="success">Privacy settings saved!</Alert>
            : (
              <button
                onClick={save}
                style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Save Privacy Settings
              </button>
            )
          }
        </div>
      </div>
    </Section>
  );
}
function UsernameSection({ session, profile }) {
  const [username, setUsername] = useState(profile.username || "");
  const [status, setStatus]     = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading]   = useState(false);

  const profileUrl = `${window.location.origin}/u/${username}`;

  const checkUsername = async (val) => {
    if (!val || val.length < 3) return;
    setChecking(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", val.toLowerCase())
      .neq("id", session.userId)
      .single();
    setChecking(false);
    if (data) setStatus({ type: "error", msg: "Username already taken." });
    else setStatus({ type: "success", msg: "Username is available!" });
  };

  const save = async () => {
    if (!username || username.length < 3) { setStatus({ type: "error", msg: "Min. 3 characters." }); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setStatus({ type: "error", msg: "Only lowercase letters, numbers, and underscores." }); return; }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.toLowerCase() })
      .eq("id", session.userId);
    if (error) setStatus({ type: "error", msg: error.message });
    else setStatus({ type: "success", msg: "Username saved! Your profile is live." });
    setLoading(false);
  };

  return (
    <Section title="🔗 Public Profile URL" desc="Set a unique username to get your shareable profile link.">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {status && <Alert type={status.type}>{status.msg}</Alert>}

        <div>
          <label style={labelStyle}>Username</label>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 9, overflow: "hidden", flex: 1 }}>
              <span style={{ padding: "10px 12px", color: T.textLow, fontSize: 13, borderRight: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
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
                <div style={{ width: 16, height: 16, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite", marginRight: 12, flexShrink: 0 }} />
              )}
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 6 }}>
            Only lowercase letters, numbers, and underscores. Min. 3 characters.
          </div>
        </div>

        {username.length >= 3 && (
          <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: T.orange, fontFamily: "monospace", wordBreak: "break-all" }}>
              {profileUrl}
            </span>
            <button
              onClick={() => { navigator.clipboard.writeText(profileUrl); }}
              style={{ background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 7, padding: "5px 12px", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}
            >
              Copy Link
            </button>
          </div>
        )}

        <button
          onClick={save}
          disabled={loading || username.length < 3}
          style={{ background: loading || username.length < 3 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "11px 20px", color: loading || username.length < 3 ? T.textMid : "#fff", fontSize: 13, fontWeight: 700, cursor: loading || username.length < 3 ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", alignSelf: "flex-start", boxShadow: loading || username.length < 3 ? "none" : "0 4px 16px #f9731430" }}
        >
          {loading ? "Saving…" : "Save Username"}
        </button>
      </div>
    </Section>
  );
}


function DangerZoneSection({ session, onLogout }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typed, setTyped]               = useState("");
  const [deleting, setDeleting]         = useState(false);
  const [error, setError]               = useState("");
  const confirmWord = "DELETE";

  const handleDelete = async () => {
    if (typed !== confirmWord) {
      setError(`Type ${confirmWord} exactly to confirm.`);
      return;
    }
    setDeleting(true);
    // Delete all user data first
    await supabase.from("profiles").delete().eq("id", session.userId);
    // Sign out — account deletion requires Supabase admin API or edge function
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <Section title="⚠️ Danger Zone" desc="Irreversible actions. Please be careful.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{
          background: T.errorLo, border: `1px solid ${T.error}33`,
          borderRadius: 12, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.error, marginBottom: 4 }}>
              Delete Account
            </div>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
              Permanently delete your account, profile, connections, and all data. This cannot be undone.
            </div>
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ background: T.errorLo, border: `1px solid ${T.error}55`, borderRadius: 9, padding: "9px 18px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 }}
          >
            Delete Account
          </button>
        </div>

        {confirmDelete && (
          <div style={{
            background: T.bgInput, border: `1px solid ${T.error}44`,
            borderRadius: 12, padding: "20px",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>
              This will permanently delete <strong style={{ color: T.error }}>everything</strong> — your profile, connections, leads, messages, and events. Type <strong style={{ color: T.error, fontFamily: "monospace" }}>{confirmWord}</strong> to confirm.
            </div>
            {error && <Alert type="error">{error}</Alert>}
            <input
              value={typed}
              onChange={e => { setTyped(e.target.value); setError(""); }}
              placeholder={`Type ${confirmWord} to confirm`}
              style={{
                ...inputStyle,
                borderColor: typed === confirmWord ? T.error : T.border,
                color: typed === confirmWord ? T.error : T.text,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setConfirmDelete(false); setTyped(""); setError(""); }}
                style={{ flex: 1, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || typed !== confirmWord}
                style={{ flex: 1, background: typed === confirmWord ? T.error : T.bgInput, border: "none", borderRadius: 9, padding: "10px", color: typed === confirmWord ? "#fff" : T.textLow, fontSize: 13, fontWeight: 700, cursor: typed === confirmWord ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}
              >
                {deleting ? "Deleting…" : "Yes, Delete Everything"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
function NotificationsHistorySection({ session }) {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  const TYPE_CONFIG = {
    new_post:            { icon: "📸", text: "shared a new post",          color: "#f97316" },
    connection_request:  { icon: "🤝", text: "sent you a connection request", color: "#3b82f6" },
    connection_accepted: { icon: "✅", text: "accepted your connection",    color: "#22c55e" },
    new_message:         { icon: "💬", text: "sent you a message",          color: "#38bdf8" },
    new_comment:         { icon: "💭", text: "commented on your post",      color: "#a78bfa" },
    new_like:            { icon: "❤️", text: "liked your post",             color: "#f87171" },
  };

  useEffect(() => {
    async function load() {
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!notifData?.length) { setLoading(false); return; }

      const ids = [...new Set(notifData.map(n => n.actor_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, photo")
        .in("id", ids);

      const map = {};
      (profiles || []).forEach(p => { map[p.id] = p; });

      setNotifs(notifData.map(n => ({ ...n, actor: map[n.actor_id] || null })));
      setLoading(false);
    }
    load();
  }, [session.userId]);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.userId);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", session.userId);
    setNotifs([]);
  };

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const unread = notifs.filter(n => !n.read).length;

  return (
    <Section
      title="🔔 Notification History"
      desc="All your recent notifications in one place."
    >
      {/* Stats + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#f9731612", border: "1px solid #f9731633", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#f97316", fontWeight: 700 }}>
            {notifs.length} total
          </div>
          {unread > 0 && (
            <div style={{ background: "#22c55e12", border: "1px solid #22c55e33", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
              {unread} unread
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              style={{ background: "#f9731612", border: "1px solid #f9731633", borderRadius: 8, padding: "6px 14px", color: "#f97316", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              style={{ background: "#f8717112", border: "1px solid #f8717133", borderRadius: 8, padding: "6px 14px", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10 }}>
          <div style={{ width: 18, height: 18, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: "#6b7594", fontSize: 13 }}>Loading…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && notifs.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#eef0f8", marginBottom: 4 }}>No notifications yet</div>
          <div style={{ fontSize: 12, color: "#343c58" }}>They'll appear here when someone interacts with you</div>
        </div>
      )}

      {/* Notification list */}
      {!loading && notifs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {notifs.map((n, idx) => {
            const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update", color: "#f97316" };
            const actor = n.actor || {};
            const initials = (actor.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div
                key={n.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  background: n.read ? "transparent" : "#f9731610",
                  borderRadius: 10,
                  borderLeft: n.read ? "2px solid transparent" : `2px solid #f97316`,
                  transition: "all .15s",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f97316,#ea6008)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    overflow: "hidden",
                  }}>
                    {actor.photo
                      ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials
                    }
                  </div>
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "#0b0d17", border: "1px solid #1a1f35",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10,
                  }}>
                    {cfg.icon}
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#eef0f8", lineHeight: 1.4 }}>
                    <strong style={{ color: n.read ? "#eef0f8" : "#f97316" }}>
                      {actor.name || "Someone"}
                    </strong>
                    {" "}{cfg.text}
                  </div>
                  <div style={{ fontSize: 11, color: "#343c58", marginTop: 2 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}


export default function SettingsPage({ session, profile, onSaveProfile, onLogout }) {
  const sections = [
    { id: "account",       icon: "👤", label: "Account" },
    { id: "username",      icon: "🔗", label: "Public URL" },
    { id: "notifications_history", icon: "🔔", label: "Notification"}, 
    { id: "password",      icon: "🔒", label: "Password" },
    
    { id: "privacy",       icon: "🔐", label: "Privacy" },
    { id: "danger",        icon: "⚠️", label: "Danger Zone" },
  ];
  const [active, setActive] = useState("account");
  {active === "username" && <UsernameSection session={session} profile={profile} />}
  



  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

      {/* Left nav */}
      <div style={{
        width: 200, flexShrink: 0, position: "sticky", top: 90,
        background: T.bgCard, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>⚙ Settings</div>
        </div>
        <nav style={{ padding: "8px" }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, textAlign: "left",
                background: active === s.id ? T.orangeMd : "transparent",
                border: `1px solid ${active === s.id ? T.orange + "44" : "transparent"}`,
                color: active === s.id ? T.orange : s.id === "danger" ? T.error : T.textMid,
                fontWeight: active === s.id ? 700 : 500, fontSize: 13,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all .18s",
              }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        {active === "account"       && <AccountInfoSection session={session} />}
        {active === "password"      && <ChangePasswordSection session={session} />}
      
        {active === "privacy"       && <PrivacySection profile={profile} onSave={onSaveProfile} />}
        {active === "danger"        && <DangerZoneSection session={session} onLogout={onLogout} />}
        {active === "notifications_history" && <NotificationsHistorySection session={session} />}

      </div>
    </div>
  );
}