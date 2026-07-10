import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";
import { usePresence } from "./PresenceProvider";
import { useCall } from "./CallProvider";
import PremiumUpgradeModal from "./PremiumUpgradeModal";

/*
  PREMIUM GATING ADDED IN THIS VERSION
  -------------------------------------
  Free tier: can view the contacts list and profiles, but cannot OPEN a chat
  (send/receive messages) or start a call. Attempting either shows the
  PremiumUpgradeModal instead. Admin (ADMIN_USER_ID) bypasses all gating.

  This only gates the ACT of opening a chat / starting a call from this file.
  Server-side enforcement (RLS on `messages` insert, and `webrtc_signals`
  insert) is a separate step — see the SQL notes at the bottom of this file's
  companion migration.
*/

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

const AVATAR_COLORS = [
  "linear-gradient(135deg,#f97316,#ea6008)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#15803d,#22c55e)",
  "linear-gradient(135deg,#be123c,#f43f5e)",
];
const getColor = (name) => AVATAR_COLORS[(name || "A").charCodeAt(0) % AVATAR_COLORS.length];

function PrimeBadge() {
  return (
    <span style={{ fontSize: 8, color: "#fbbf24", background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 20, padding: "1px 5px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 5, whiteSpace: "nowrap" }}>
      👑 PRIME
    </span>
  );
}

function Avatar({ name, photo, size = 44 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: getColor(name), overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 800, color: "#fff" }}>
      {photo ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })}`;
}

function fmtSep(ts) {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function needsSep(msgs, i) {
  if (i === 0) return true;
  return new Date(msgs[i].created_at).toDateString() !== new Date(msgs[i - 1].created_at).toDateString();
}

function lastSeenText(lastSeenTs) {
  if (!lastSeenTs) return "last seen a long time ago";
  const diff = (Date.now() - new Date(lastSeenTs)) / 1000;
  if (diff < 60) return "last seen just now";
  if (diff < 3600) return `last seen ${Math.floor(diff / 60)}m ago`;
  const timeStr = new Date(lastSeenTs).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const d = new Date(lastSeenTs), now = new Date();
  if (d.toDateString() === now.toDateString()) return `last seen today at ${timeStr}`;
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `last seen yesterday at ${timeStr}`;
  return `last seen ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

/* ─── TICK COMPONENT ─── */
function Tick({ msg, mine }) {
  if (!mine || msg.deleted) return null;
  if (msg.read) return <span style={{ fontSize: 12, color: "#60a5fa", letterSpacing: "-2px" }}>✓✓</span>;
  if (msg.delivered) return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "-2px" }}>✓✓</span>;
  return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>✓</span>;
}

/* ─── BOTTOM MENU ─── */
function BottomMenu({ options, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 999999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, overflow: "hidden", animation: "slideUp .2s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 6px" }} />
        {options.map((opt, i) => (
          <button key={i} onClick={() => { opt.action(); onClose(); }}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "none", border: "none", borderTop: i === 0 ? "none" : `1px solid ${T.border}`, color: opt.danger ? "#f87171" : T.text, fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <span>{opt.label}</span>
            <span style={{ fontSize: 20 }}>{opt.icon}</span>
          </button>
        ))}
        <div style={{ height: "max(16px, env(safe-area-inset-bottom))" }} />
      </div>
    </div>
  );
}

/* ─── CHAT VIEW ─── */
function ChatView({ contact, session, onBack, isOnline, onStartCall, onViewProfile }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [liveLastSeen, setLiveLastSeen] = useState(contact.last_seen || null);
  const bottomRef = useRef();
  const inputRef = useRef();
  const chanRef = useRef();
  const hiddenIdsRef = useRef(new Set());
  const forceDeletedRef = useRef(new Set());

  const online = isOnline(contact.id);

  useEffect(() => {
    let cancelled = false;
    supabase.from("profiles").select("last_seen").eq("id", contact.id).single()
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setLiveLastSeen(data.last_seen);
      });

    const ch = supabase.channel(`profile_watch_${contact.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${contact.id}` }, ({ new: p }) => {
        setLiveLastSeen(p.last_seen);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [contact.id]);

  const loadMsgs = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages").select("*")
      .or(`and(sender_id.eq.${session.userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${session.userId})`)
      .order("created_at", { ascending: true });

    if (error) { console.error("loadMsgs failed:", error); return; }

    const visible = (data || [])
      .filter(m => {
        if (hiddenIdsRef.current.has(m.id)) return false;
        if (m.deleted) return true;
        return !(m.deleted_for || []).includes(session.userId);
      })
      .map(m => forceDeletedRef.current.has(m.id) ? { ...m, deleted: true, content: null } : m);
    setMsgs(visible);

    const unread = (data || []).filter(m => m.sender_id === contact.id && m.receiver_id === session.userId && !m.read);
    if (unread.length > 0) {
      await supabase.from("messages").update({ read: true, delivered: true }).in("id", unread.map(m => m.id));
    }
  }, [session.userId, contact.id]);

  useEffect(() => {
    loadMsgs();

    supabase.from("blocked_users").select("id")
      .eq("blocker_id", session.userId).eq("blocked_id", contact.id)
      .then(({ data }) => setIsBlocked((data || []).length > 0));

    const ch = `msgs_${[session.userId, contact.id].sort().join("_")}_${Math.random().toString(36).slice(2, 6)}`;
    chanRef.current = supabase.channel(ch)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadMsgs())
      .subscribe();

    return () => { if (chanRef.current) supabase.removeChannel(chanRef.current); };
  }, [contact.id, session.userId, loadMsgs]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [msgs]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending || isBlocked) return;
    setText("");
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: session.userId, receiver_id: contact.id,
      content, read: false, delivered: false, created_at: new Date().toISOString(),
    });
    if (error) console.error("send failed:", error);
    setSending(false);
    inputRef.current?.focus();
  };

  const deleteForMe = async (msgId) => {
    hiddenIdsRef.current.add(msgId);
    setMsgs(prev => prev.filter(m => m.id !== msgId));

    const { data: current, error: readErr } = await supabase
      .from("messages").select("deleted_for").eq("id", msgId).single();
    if (readErr) {
      console.error("deleteForMe read failed:", readErr);
      hiddenIdsRef.current.delete(msgId);
      loadMsgs();
      return;
    }

    const arr = Array.isArray(current?.deleted_for) ? [...current.deleted_for] : [];
    if (!arr.includes(session.userId)) arr.push(session.userId);

    const { error: updateErr } = await supabase.from("messages").update({ deleted_for: arr }).eq("id", msgId);
    if (updateErr) {
      console.error("deleteForMe update failed:", updateErr);
      alert("Couldn't delete this message. Please try again.");
      hiddenIdsRef.current.delete(msgId);
      loadMsgs();
    }
  };

  const deleteForEveryone = async (msgId) => {
    forceDeletedRef.current.add(msgId);
    setMsgs(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true, content: null } : m));

    const { error } = await supabase.from("messages").update({
      content: null, deleted: true, delivered: false, read: false,
      deleted_at: new Date().toISOString(),
    }).eq("id", msgId).eq("sender_id", session.userId);

    if (error) {
      console.error("deleteForEveryone failed:", error);
      alert("Couldn't delete for everyone: " + error.message);
      forceDeletedRef.current.delete(msgId);
      loadMsgs();
      return;
    }
    loadMsgs();
  };

  const blockUser = async () => {
    const { error } = await supabase.from("blocked_users").insert({ blocker_id: session.userId, blocked_id: contact.id });
    if (!error) setIsBlocked(true);
  };
  const unblockUser = async () => {
    const { error } = await supabase.from("blocked_users").delete()
      .eq("blocker_id", session.userId).eq("blocked_id", contact.id);
    if (!error) setIsBlocked(false);
  };

  const clearChat = async () => {
    const ids = msgs.map(m => m.id);
    if (!ids.length) return;
    const prevMsgs = msgs;
    ids.forEach(id => hiddenIdsRef.current.add(id));
    setMsgs([]);

    const { data: rows, error: readErr } = await supabase.from("messages").select("id,deleted_for").in("id", ids);
    if (readErr) {
      console.error("clearChat read failed:", readErr);
      alert("Couldn't clear chat: " + readErr.message);
      ids.forEach(id => hiddenIdsRef.current.delete(id));
      setMsgs(prevMsgs);
      return;
    }

    let anyFailed = false;
    for (const row of rows || []) {
      const arr = Array.isArray(row.deleted_for) ? [...row.deleted_for] : [];
      if (!arr.includes(session.userId)) arr.push(session.userId);
      const { error } = await supabase.from("messages").update({ deleted_for: arr }).eq("id", row.id);
      if (error) {
        console.error("clearChat row failed:", row.id, error);
        hiddenIdsRef.current.delete(row.id);
        anyFailed = true;
      }
    }

    if (anyFailed) {
      alert("Some messages couldn't be cleared. Check the console for the exact Supabase error.");
    }
    loadMsgs();
  };

  const uploadAndSend = async (file, prefix) => {
    const path = `msg/${session.userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (!error) {
      const { data: d } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("messages").insert({
        sender_id: session.userId, receiver_id: contact.id,
        content: `${prefix} ${d.publicUrl}`,
        read: false, delivered: false, created_at: new Date().toISOString(),
      });
    } else {
      console.error("upload failed:", error);
    }
  };

  const viewProfile = () => {
    if (typeof onViewProfile === "function") {
      onViewProfile(contact);
    } else {
      window.dispatchEvent(new CustomEvent("tez-view-profile", { detail: { userId: contact.id, profile: contact } }));
      onBack();
    }
  };

  const chatMenuOptions = [
    { label: "View Profile", icon: "👤", action: viewProfile },
    { label: "Clear Chat", icon: "🗑️", action: clearChat },
    { label: isBlocked ? "Unblock User" : "Block User", icon: isBlocked ? "✅" : "🚫", action: isBlocked ? unblockUser : blockUser, danger: !isBlocked },
  ];

  const callMenuOptions = [
    { label: "Voice call", icon: "📞", action: () => onStartCall(contact, "audio") },
    { label: "Video call", icon: "📹", action: () => onStartCall(contact, "video") },
    { label: "Send call link", icon: "🔗", action: () => { const url = `https://tezconnect.in/?call=${contact.id}`; navigator.clipboard?.writeText(url); alert("Call link copied!"); } },
  ];

  const getMsgOptions = (msg) => {
    const mine = msg.sender_id === session.userId;
    const opts = [
      { label: "Delete for Me", icon: "🗑️", action: () => deleteForMe(msg.id) },
    ];
    if (mine && !msg.deleted) {
      opts.push({ label: "Delete for Everyone", icon: "🗑️", action: () => deleteForEveryone(msg.id), danger: true });
    }
    return opts;
  };

  const attachOpts = [
    { icon: "🖼️", label: "Gallery",  color: "#7c3aed", action: () => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], "📷"); }; i.click(); setShowAttach(false); } },
    { icon: "📷", label: "Camera",   color: "#ea580c", action: () => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.capture = "environment"; i.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], "📷"); }; i.click(); setShowAttach(false); } },
    { icon: "📄", label: "Document", color: "#0369a1", action: () => { const i = document.createElement("input"); i.type = "file"; i.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt"; i.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], `📄 ${e.target.files[0].name}`); }; i.click(); setShowAttach(false); } },
    { icon: "📍", label: "Location", color: "#15803d", action: () => { setShowAttach(false); if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(async p => { const url = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`; await supabase.from("messages").insert({ sender_id: session.userId, receiver_id: contact.id, content: `📍 My Location: ${url}`, read: false, delivered: false, created_at: new Date().toISOString() }); }); } },
  ];

  const statusText = online ? "● Online" : lastSeenText(liveLastSeen);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: T.bg, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      <div style={{ flexShrink: 0, background: T.bgCard, borderBottom: `1px solid ${T.border}`, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
          <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: "50%", background: T.bgInput, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.text, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>←</button>

          <div onClick={viewProfile} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={contact.name} photo={contact.photo} size={40} />
              {online && (
                <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: T.success, border: `2px solid ${T.bgCard}`, boxShadow: `0 0 6px ${T.success}` }} />
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
                {contact.name}
                {contact.is_premium && <PrimeBadge />}
              </div>
              <div style={{ fontSize: 11, color: online ? T.success : T.textMid, marginTop: 1 }}>{statusText}</div>
            </div>
          </div>

          <button onClick={() => setShowCallMenu(true)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: T.bgInput, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer", flexShrink: 0 }}>
            📞
          </button>

          <button onClick={() => setShowChatMenu(true)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: T.textMid, fontSize: 22, cursor: "pointer", flexShrink: 0 }}>⋯</button>
        </div>

        {(contact.location || contact.industry) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, margin: "0 14px 10px", padding: "8px 14px" }}>
            {contact.location && <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 1 }}>📍 Location</div><div style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{contact.location}</div></div>}
            {contact.industry && <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 1 }}>🏭 Industry</div><div style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{contact.industry}</div></div>}
            <button onClick={viewProfile} style={{ background: "none", border: "none", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>View profile</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "12px 14px", minHeight: 0 }}>
        {isBlocked && (
          <div style={{ textAlign: "center", padding: "16px", background: "#1a0a0a", border: "1px solid #f8717133", borderRadius: 12, margin: "8px 0" }}>
            <div style={{ fontSize: 13, color: "#f87171" }}>🚫 You have blocked this user</div>
            <button onClick={unblockUser} style={{ marginTop: 8, background: "none", border: "1px solid #f87171", borderRadius: 8, padding: "5px 14px", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Unblock</button>
          </div>
        )}

        {msgs.length === 0 && !isBlocked && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>👋</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>Start the conversation</div>
            <div style={{ fontSize: 13, color: T.textLow }}>Say hello to {contact.name?.split(" ")[0]}</div>
          </div>
        )}

        {msgs.map((msg, i) => {
          const mine = msg.sender_id === session.userId;
          const linkUrl = msg.content?.split(" ").find(w => w.startsWith("http"));
          const isImg = msg.content?.startsWith("📷") && linkUrl;
          const isDoc = msg.content?.startsWith("📄") && linkUrl;
          const isLoc = msg.content?.startsWith("📍") && linkUrl;

          return (
            <div key={msg.id || i}>
              {needsSep(msgs, i) && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 11, color: T.textLow, fontWeight: 600, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 12px" }}>{fmtSep(msg.created_at)}</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 4 }}>
                <div
                  style={{ maxWidth: "75%", position: "relative", cursor: "default" }}
                  onTouchStart={e => { e.currentTarget._t = setTimeout(() => setSelectedMsg(msg), 500); }}
                  onTouchEnd={e => clearTimeout(e.currentTarget._t)}
                  onContextMenu={e => { e.preventDefault(); setSelectedMsg(msg); }}
                >
                  <div style={{
                    background: msg.deleted ? T.bgInput : mine ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgCard,
                    border: (msg.deleted || !mine) ? `1px solid ${T.border}` : "none",
                    borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: isImg ? "4px" : "10px 14px",
                    boxShadow: mine && !msg.deleted ? "0 2px 12px #f9731430" : "none",
                    overflow: "hidden",
                  }}>
                    {msg.deleted ? (
                      <div style={{ fontSize: 13, color: T.textLow, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6, padding: "0 2px" }}>
                        <span>🚫</span> This message was deleted
                      </div>
                    ) : isImg ? (
                      <>
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                          <img src={linkUrl} alt="" style={{ width: "100%", maxWidth: 220, height: 160, objectFit: "cover", borderRadius: 12, display: "block" }} />
                        </a>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, padding: "4px 6px 2px", fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>
                          {fmtTime(msg.created_at)} <Tick msg={msg} mine={mine} />
                        </div>
                      </>
                    ) : isDoc ? (
                      <>
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: mine ? "rgba(0,0,0,0.15)" : T.bgInput, borderRadius: 10, padding: "10px 12px" }}>
                          <span style={{ fontSize: 26 }}>📄</span>
                          <div><div style={{ fontSize: 12, fontWeight: 700, color: mine ? "#fff" : T.text }}>{msg.content.split(" ").slice(1, -1).join(" ") || "Document"}</div><div style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>Tap to open</div></div>
                        </a>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, padding: "4px 2px 0", fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>
                          {fmtTime(msg.created_at)} <Tick msg={msg} mine={mine} />
                        </div>
                      </>
                    ) : isLoc ? (
                      <>
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, background: mine ? "rgba(0,0,0,0.15)" : T.bgInput, borderRadius: 10, padding: "10px 12px" }}>
                          <span style={{ fontSize: 26 }}>📍</span>
                          <div><div style={{ fontSize: 12, fontWeight: 700, color: mine ? "#fff" : T.text }}>Shared Location</div><div style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>Tap to open Maps</div></div>
                        </a>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, padding: "4px 2px 0", fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>
                          {fmtTime(msg.created_at)} <Tick msg={msg} mine={mine} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 14, color: mine ? "#fff" : T.text, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.content}</div>
                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 3, marginTop: 3, fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow }}>
                          {fmtTime(msg.created_at)} <Tick msg={msg} mine={mine} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {showAttach && (
        <div style={{ flexShrink: 0, background: T.bgCard, borderTop: `1px solid ${T.border}`, padding: "12px 20px 16px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <button onClick={() => setShowAttach(false)} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 28px", color: T.textMid, fontSize: 14, cursor: "pointer" }}>▾</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {attachOpts.map(o => (
              <div key={o.label} onClick={o.action} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <div style={{ width: 54, height: 54, borderRadius: 16, background: o.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{o.icon}</div>
                <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isBlocked && (
        <div style={{ flexShrink: 0, background: "#1a0a0a", borderTop: "1px solid #f8717133", padding: "10px 20px", textAlign: "center", fontSize: 12, color: "#f87171" }}>
          You blocked this user.&nbsp;
          <button onClick={unblockUser} style={{ background: "none", border: "none", color: T.orange, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Unblock</button>
        </div>
      )}

      {!isBlocked && (
        <div style={{ flexShrink: 0, background: T.bgCard, borderTop: `1px solid ${T.border}`, padding: "10px 14px", paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))", display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", flexShrink: 0 }}>😊</button>

          <div style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 24, display: "flex", alignItems: "center", paddingLeft: 14 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              style={{ flex: 1, background: "none", border: "none", color: T.text, fontSize: 14, outline: "none", padding: "11px 8px 11px 0", fontFamily: "'Plus Jakarta Sans',sans-serif", minWidth: 0 }}
            />
          </div>

          <button onClick={() => setShowAttach(a => !a)} style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: showAttach ? T.orangeMd : "none", border: showAttach ? `1px solid ${T.orange}44` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", transition: "all .2s" }}>📎</button>

          <button onClick={send} disabled={sending}
            style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: text.trim() ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgInput, border: text.trim() ? "none" : `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: text.trim() ? "pointer" : "default", boxShadow: text.trim() ? "0 4px 16px #f9731444" : "none", transition: "all .2s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={text.trim() ? "#fff" : T.textLow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={text.trim() ? "#fff" : T.textLow} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {showChatMenu && <BottomMenu options={chatMenuOptions} onClose={() => setShowChatMenu(false)} />}
      {showCallMenu && <BottomMenu options={callMenuOptions} onClose={() => setShowCallMenu(false)} />}
      {selectedMsg && (
        <BottomMenu options={getMsgOptions(selectedMsg)} onClose={() => setSelectedMsg(null)} />
      )}
    </div>
  );
}

/* ─── CONTACT ROW ─── */
function ContactRow({ conv, isActive, onClick, isOnline }) {
  const online = isOnline(conv.id);
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", background: isActive ? "#f9731610" : "transparent", borderLeft: `3px solid ${isActive ? T.orange : "transparent"}`, borderBottom: `1px solid ${T.border}`, transition: "background .15s" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar name={conv.name} photo={conv.photo} size={50} />
        {online && (
          <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: T.success, border: `2px solid ${T.bg}`, boxShadow: `0 0 6px ${T.success}` }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "66%", display: "flex", alignItems: "center" }}>
            {conv.name}
            {conv.is_premium && <PrimeBadge />}
          </span>
          <span style={{ fontSize: 11, color: T.textLow, flexShrink: 0 }}>{fmtTime(conv.last_at)}</span>
        </div>
        <div style={{ fontSize: 11, color: T.textLow, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {online ? <span style={{ color: T.success }}>● Online</span> : (conv.designation || conv.company || "TezConnect Member")}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: conv.unread > 0 ? T.textMid : T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
            {conv.last_msg || "Say hello 👋"}
          </span>
          {conv.unread > 0 && (
            <div style={{ minWidth: 20, height: 20, borderRadius: "50%", background: T.orange, color: "#fff", fontSize: 10, fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{conv.unread}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function MessagesPage({ session, onViewProfile, openChatWith }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState(null);
  const { isOnline, onlineIds } = usePresence();

  const [isPremium, setIsPremium] = useState(false);
  const [checkingPremium, setCheckingPremium] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const isUnlimited = isAdmin || isPremium;

  useEffect(() => {
    supabase.from("profiles").select("is_premium, premium_expires_at").eq("id", session.userId).single()
      .then(({ data }) => {
        if (data) {
          const active = data.is_premium && (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());
          setIsPremium(!!active);
        }
        setCheckingPremium(false);
      });
  }, [session.userId]);

  /* Gate for opening a chat — Free tier can browse contacts but not chat */
  const openChat = useCallback((contact) => {
    if (checkingPremium) return;
    if (!isUnlimited) { setShowUpgrade(true); return; }
    setActive(contact);
  }, [checkingPremium, isUnlimited]);

  /* Gate for starting a call */
  const { startCall } = useCall();
  const guardedStartCall = useCallback((contact, callType) => {
    if (!isUnlimited) { setShowUpgrade(true); return; }
    startCall(contact, callType);
  }, [isUnlimited, startCall]);

  const loadContacts = useCallback(async () => {
    const { data: msgs } = await supabase
      .from("messages").select("*")
      .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`)
      .order("created_at", { ascending: false });

    if (!msgs?.length) { setContacts([]); setLoading(false); return; }

    const ids = [...new Set(msgs.map(m => m.sender_id === session.userId ? m.receiver_id : m.sender_id))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", ids);
    const pm = {};
    (profiles || []).forEach(p => { pm[p.id] = p; });

    const seen = new Set();
    const list = [];
    for (const msg of msgs) {
      const oid = msg.sender_id === session.userId ? msg.receiver_id : msg.sender_id;
      if (seen.has(oid)) continue;
      seen.add(oid);
      const p = pm[oid] || {};
      const unread = msgs.filter(m => m.sender_id === oid && m.receiver_id === session.userId && !m.read).length;
      list.push({ ...p, id: oid, last_msg: msg.content, last_at: msg.created_at, unread });
    }
    setContacts(list);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => {
    loadContacts();
    const sub = supabase.channel("msgs_list_" + session.userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: m }) => {
        if (m.sender_id === session.userId || m.receiver_id === session.userId) loadContacts();
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [session.userId, loadContacts]);

  const prevOnlineIdsRef = useRef(onlineIds);
  useEffect(() => {
    if (prevOnlineIdsRef.current !== onlineIds) {
      prevOnlineIdsRef.current = onlineIds;
      loadContacts();
    }
  }, [onlineIds, loadContacts]);

  useEffect(() => {
    if (openChatWith?.id) openChat(openChatWith);
  }, [openChatWith, openChat]);

  /* Open chat from elsewhere in the app — also gated */
  useEffect(() => {
    const h = async (e) => {
      const { userId } = e.detail || {};
      if (!userId) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (p) openChat(p);
    };
    window.addEventListener("tez-open-chat", h);
    return () => window.removeEventListener("tez-open-chat", h);
  }, [openChat]);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.name?.toLowerCase().includes(q) || c.designation?.toLowerCase().includes(q);
    if (tab === "requests") return match && c.unread > 0;
    return match;
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "connections", label: "Connections" },
    { id: "requests", label: "Requests", badge: contacts.filter(c => c.unread > 0).length },
  ];

  return (
    <>
      {active && createPortal(
        <ChatView
          contact={active}
          session={session}
          onBack={() => setActive(null)}
          isOnline={isOnline}
          onStartCall={guardedStartCall}
          onViewProfile={onViewProfile}
        />,
        document.body
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Messages</h2>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange, boxShadow: `0 0 8px ${T.orange}` }} />
          </div>
          <div style={{ fontSize: 12, color: T.textLow }}>
            {isUnlimited ? "Stay connected, grow together." : "Upgrade to Prime to start chatting."}
          </div>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textLow, pointerEvents: "none" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
            style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px 14px 11px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = T.border} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: tab === t.id ? T.orangeMd : T.bgCard, border: `1px solid ${tab === t.id ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 16px", color: tab === t.id ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {t.label}
              {t.badge > 0 && <span style={{ background: T.orange, color: "#fff", borderRadius: "50%", minWidth: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, padding: "0 3px" }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {!checkingPremium && !isUnlimited && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#1a0a2e,#2d1854)", border: "1px solid #7c3aed44", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>👑</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Chat & calls need Prime</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Free tier can browse but not message</div>
            </div>
            <button onClick={() => setShowUpgrade(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              Upgrade
            </button>
          </div>
        )}

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          {loading && [1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: T.bgInput, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: "50%", height: 13, background: T.bgInput, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: "35%", height: 11, background: T.bgInput, borderRadius: 4 }} />
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>{search ? "No results" : "No conversations yet"}</div>
              <div style={{ fontSize: 13, color: T.textLow }}>Connect with members to start chatting</div>
            </div>
          )}

          {!loading && filtered.map(c => (
            <ContactRow key={c.id} conv={c} isActive={active?.id === c.id} onClick={() => openChat(c)} isOnline={isOnline} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{ width: 50, height: 50, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px #f9731444" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {showUpgrade && (
        <PremiumUpgradeModal
          session={session}
          onClose={() => setShowUpgrade(false)}
          onSuccess={() => { setShowUpgrade(false); setIsPremium(true); }}
        />
      )}
    </>
  );
}
