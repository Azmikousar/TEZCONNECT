import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

const COLORS = [
  "linear-gradient(135deg,#f97316,#ea6008)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#15803d,#22c55e)",
  "linear-gradient(135deg,#be123c,#f43f5e)",
];

function getColor(name) {
  return COLORS[(name || "A").charCodeAt(0) % COLORS.length];
}

function Avatar({ name, photo, size = 44 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: getColor(name), overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: "#fff",
    }}>
      {photo
        ? <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
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

function ChatView({ contact, session, onBack }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const chanRef = useRef();

  const loadMsgs = useCallback(async () => {
    const { data } = await supabase
      .from("messages").select("*")
      .or(`and(sender_id.eq.${session.userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${session.userId})`)
      .order("created_at", { ascending: true });
    setMsgs(data || []);
    await supabase.from("messages").update({ read: true })
      .eq("sender_id", contact.id)
      .eq("receiver_id", session.userId)
      .eq("read", false);
  }, [session.userId, contact.id]);

  useEffect(() => {
    loadMsgs();
    const ch = `chat_${[session.userId, contact.id].sort().join("_")}_${Math.random().toString(36).slice(2, 7)}`;
    chanRef.current = supabase.channel(ch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: m }) => {
        const ok =
          (m.sender_id === session.userId && m.receiver_id === contact.id) ||
          (m.sender_id === contact.id && m.receiver_id === session.userId);
        if (ok) setMsgs(p => [...p, m]);
      })
      .subscribe();
    return () => { if (chanRef.current) supabase.removeChannel(chanRef.current); };
  }, [contact.id, session.userId, loadMsgs]);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [msgs]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText("");
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: session.userId, receiver_id: contact.id,
      content, read: false, created_at: new Date().toISOString(),
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const viewProfile = () => {
    onBack();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("tez-view-profile", { detail: { userId: contact.id } }));
    }, 100);
  };

  const uploadAndSend = async (file, label) => {
    const path = `msg/${session.userId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type });
    if (!error) {
      const { data: d } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("messages").insert({
        sender_id: session.userId, receiver_id: contact.id,
        content: `${label} ${d.publicUrl}`,
        read: false, created_at: new Date().toISOString(),
      });
    }
  };

  const attachOpts = [
    {
      icon: "🖼️", label: "Gallery", color: "#7c3aed",
      action: () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "image/*";
        inp.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], "📷"); };
        inp.click(); setShowAttach(false);
      },
    },
    {
      icon: "📷", label: "Camera", color: "#ea580c",
      action: () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "image/*"; inp.capture = "environment";
        inp.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], "📷"); };
        inp.click(); setShowAttach(false);
      },
    },
    {
      icon: "📄", label: "Document", color: "#0369a1",
      action: () => {
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = ".pdf,.doc,.docx,.xls,.xlsx,.txt";
        inp.onchange = e => { if (e.target.files[0]) uploadAndSend(e.target.files[0], `📄 ${e.target.files[0].name}`); };
        inp.click(); setShowAttach(false);
      },
    },
    {
      icon: "📍", label: "Location", color: "#15803d",
      action: () => {
        setShowAttach(false);
        if (!navigator.geolocation) { alert("Location not supported"); return; }
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
            await supabase.from("messages").insert({
              sender_id: session.userId, receiver_id: contact.id,
              content: `📍 My Location: ${url}`,
              read: false, created_at: new Date().toISOString(),
            });
          },
          () => alert("Could not get location. Please allow location access.")
        );
      },
    },
  ];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999, background: T.bg,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>

      {/* TOP BAR */}
      <div style={{
        flexShrink: 0, background: T.bgCard,
        borderBottom: `1px solid ${T.border}`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
          <button onClick={onBack} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: T.bgInput, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.text, fontSize: 18, cursor: "pointer", flexShrink: 0,
          }}>←</button>

          <div onClick={viewProfile} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, cursor: "pointer" }}>
            <Avatar name={contact.name} photo={contact.photo} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {contact.name}
              </div>
              <div style={{ fontSize: 11, color: T.textMid }}>
                {contact.designation || "TezConnect Member"}&nbsp;
                <span style={{ color: T.success }}>● Online</span>
              </div>
            </div>
          </div>

          <a href={`tel:${contact.mobile || contact.whatsapp || ""}`} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: T.bgInput, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, textDecoration: "none", flexShrink: 0,
          }}>📞</a>

          <button style={{ background: "none", border: "none", color: T.textMid, fontSize: 22, cursor: "pointer", flexShrink: 0 }}>⋯</button>
        </div>

        {(contact.location || contact.industry) && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 10, margin: "0 14px 12px", padding: "10px 14px",
          }}>
            {contact.location && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 2 }}>📍 Location</div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{contact.location}</div>
              </div>
            )}
            {contact.industry && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 2 }}>🏭 Industry</div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 700 }}>{contact.industry}</div>
              </div>
            )}
            <button onClick={viewProfile(member.id)} style={{
              background: "none", border: "none", color: T.orange,
              fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}>View profile</button>
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "14px", minHeight: 0 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>👋</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>Start the conversation</div>
            <div style={{ fontSize: 13, color: T.textLow }}>Say hello to {contact.name?.split(" ")[0]}</div>
          </div>
        )}

        {msgs.map((msg, i) => {
  const mine = msg.sender_id === session.userId;
  const isImage = msg.content?.startsWith("📷") && msg.content?.includes("http");
  const isDoc = msg.content?.startsWith("📄") && msg.content?.includes("http");
  const isLocation = msg.content?.startsWith("📍") && msg.content?.includes("http");
  const linkUrl = msg.content?.split(" ").find(w => w.startsWith("http"));

  return (
    <div key={msg.id || i}>
      {needsSep(msgs, i) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{
            fontSize: 11, color: T.textLow, fontWeight: 600,
            background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: "3px 12px",
          }}>{fmtSep(msg.created_at)}</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
      )}
      <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 6 }}>
        <div style={{
          maxWidth: "75%",
          background: mine ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgCard,
          border: mine ? "none" : `1px solid ${T.border}`,
          borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: isImage ? "4px" : "10px 14px",
          boxShadow: mine ? "0 4px 16px #f9731430" : "none",
          overflow: "hidden",
        }}>
          {/* Image message */}
          {isImage && linkUrl && (
            <div>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                <img src={linkUrl} alt="Shared image" style={{
                  width: "100%", maxWidth: 240, height: 180,
                  objectFit: "cover", borderRadius: 14, display: "block",
                }} />
              </a>
              <div style={{
                fontSize: 10, padding: "4px 10px 6px",
                color: mine ? "rgba(255,255,255,0.65)" : T.textLow,
                textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
              }}>
                {fmtTime(msg.created_at)}
                {mine && <span style={{ color: msg.read ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>{msg.read ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          )}

          {/* Document message */}
          {isDoc && linkUrl && (
            <div>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: mine ? "rgba(0,0,0,0.15)" : T.bgInput,
                  borderRadius: 10, padding: "10px 12px", marginBottom: 4,
                }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>📄</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: mine ? "#fff" : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {msg.content.split(" ")[1] || "Document"}
                    </div>
                    <div style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow, marginTop: 2 }}>
                      Tap to open
                    </div>
                  </div>
                </div>
              </a>
              <div style={{
                fontSize: 10, paddingTop: 2,
                color: mine ? "rgba(255,255,255,0.65)" : T.textLow,
                textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
              }}>
                {fmtTime(msg.created_at)}
                {mine && <span style={{ color: msg.read ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>{msg.read ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          )}

          {/* Location message */}
          {isLocation && linkUrl && (
            <div>
              <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: mine ? "rgba(0,0,0,0.15)" : T.bgInput,
                  borderRadius: 10, padding: "10px 12px", marginBottom: 4,
                }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>📍</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: mine ? "#fff" : T.text }}>Shared Location</div>
                    <div style={{ fontSize: 10, color: mine ? "rgba(255,255,255,0.6)" : T.textLow, marginTop: 2 }}>Tap to open in Maps</div>
                  </div>
                </div>
              </a>
              <div style={{
                fontSize: 10, paddingTop: 2,
                color: mine ? "rgba(255,255,255,0.65)" : T.textLow,
                textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
              }}>
                {fmtTime(msg.created_at)}
                {mine && <span style={{ color: msg.read ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>{msg.read ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          )}

          {/* Regular text message */}
          {!isImage && !isDoc && !isLocation && (
            <div>
              <div style={{ fontSize: 14, color: mine ? "#fff" : T.text, lineHeight: 1.5, wordBreak: "break-word" }}>
                {msg.content}
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4,
                marginTop: 4, fontSize: 10,
                color: mine ? "rgba(255,255,255,0.65)" : T.textLow,
              }}>
                {fmtTime(msg.created_at)}
                {mine && <span style={{ color: msg.read ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>{msg.read ? "✓✓" : "✓"}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
})}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ATTACHMENT PANEL */}
      {showAttach && (
        <div style={{
          flexShrink: 0, background: T.bgCard,
          borderTop: `1px solid ${T.border}`,
          padding: "12px 20px 16px",
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <button onClick={() => setShowAttach(false)} style={{
              background: T.bgInput, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "4px 28px",
              color: T.textMid, fontSize: 14, cursor: "pointer",
            }}>▾</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {attachOpts.map(opt => (
              <div key={opt.label} onClick={opt.action}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 16, background: opt.color,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>{opt.icon}</div>
                <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <div style={{
        flexShrink: 0, background: T.bgCard,
        borderTop: `1px solid ${T.border}`,
        padding: "10px 14px",
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", flexShrink: 0 }}>😊</button>

        <div style={{
          flex: 1, background: T.bgInput, border: `1px solid ${T.border}`,
          borderRadius: 24, display: "flex", alignItems: "center", paddingLeft: 14,
        }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            style={{
              flex: 1, background: "none", border: "none",
              color: T.text, fontSize: 14, outline: "none",
              padding: "11px 8px 11px 0",
              fontFamily: "'Plus Jakarta Sans',sans-serif", minWidth: 0,
            }}
          />
        </div>

        <button onClick={() => setShowAttach(a => !a)} style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: showAttach ? T.orangeMd : "none",
          border: showAttach ? `1px solid ${T.orange}44` : "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, cursor: "pointer", transition: "all .2s",
        }}>📎</button>

        <button onClick={send} disabled={sending} style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: text.trim()
            ? "linear-gradient(135deg,#f97316,#ea6008)"
            : "linear-gradient(135deg,#f9731655,#ea600855)",
          border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: text.trim() ? "pointer" : "default",
          boxShadow: text.trim() ? "0 4px 16px #f9731444" : "none",
          transition: "all .2s",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function ContactRow({ conv, isActive, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 16px", cursor: "pointer",
      background: isActive ? "#f9731610" : "transparent",
      borderLeft: `3px solid ${isActive ? T.orange : "transparent"}`,
      borderBottom: `1px solid ${T.border}`,
      transition: "background .15s",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Avatar name={conv.name} photo={conv.photo} size={50} />
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: 12, height: 12, borderRadius: "50%",
          background: T.success, border: `2px solid ${T.bg}`,
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "66%" }}>
            {conv.name}
          </span>
          <span style={{ fontSize: 11, color: T.textLow, flexShrink: 0 }}>{fmtTime(conv.last_at)}</span>
        </div>
        <div style={{ fontSize: 11, color: T.textLow, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {conv.designation || conv.company || "TezConnect Member"}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: conv.unread > 0 ? T.textMid : T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
            {conv.last_msg || "Say hello 👋"}
          </span>
          {conv.unread > 0 && (
            <div style={{
              minWidth: 20, height: 20, borderRadius: "50%",
              background: T.orange, color: "#fff",
              fontSize: 10, fontWeight: 800, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px",
            }}>{conv.unread}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage({ session }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [active, setActive] = useState(null);

  const loadContacts = useCallback(async () => {
    const { data: msgs } = await supabase
      .from("messages").select("*")
      .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`)
      .order("created_at", { ascending: false });

    if (!msgs?.length) { setLoading(false); return; }

    const ids = [...new Set(msgs.map(m =>
      m.sender_id === session.userId ? m.receiver_id : m.sender_id
    ))];
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
      const unread = msgs.filter(m =>
        m.sender_id === oid && m.receiver_id === session.userId && !m.read
      ).length;
      list.push({ ...p, id: oid, last_msg: msg.content, last_at: msg.created_at, unread });
    }
    setContacts(list);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => {
    loadContacts();
    const sub = supabase
      .channel("msgs_list_" + session.userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, ({ new: m }) => {
        if (m.sender_id === session.userId || m.receiver_id === session.userId) loadContacts();
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [session.userId, loadContacts]);

  useEffect(() => {
    const handler = async (e) => {
      const { userId } = e.detail || {};
      if (!userId) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (p) setActive(p);
    };
    window.addEventListener("tez-open-chat", handler);
    return () => window.removeEventListener("tez-open-chat", handler);
  }, []);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const match = !q || c.name?.toLowerCase().includes(q) || c.designation?.toLowerCase().includes(q);
    if (tab === "requests") return match && c.unread > 0;
    return match;
  });

  const tabs = [
    { id: "all",         label: "All" },
    { id: "connections", label: "Connections" },
    { id: "requests",    label: "Requests", badge: contacts.filter(c => c.unread > 0).length },
  ];

  return (
    <>
      {active && createPortal(
        <ChatView contact={active} session={session} onBack={() => setActive(null)} />,
        document.body
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0 }}>Messages</h2>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange, boxShadow: `0 0 8px ${T.orange}` }} />
          </div>
          <div style={{ fontSize: 12, color: T.textLow }}>Stay connected, grow together.</div>
        </div>

        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textLow, pointerEvents: "none" }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connections..."
            style={{
              width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "11px 14px 11px 36px",
              color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: tab === t.id ? T.orangeMd : T.bgCard,
              border: `1px solid ${tab === t.id ? T.orange + "55" : T.border}`,
              borderRadius: 20, padding: "7px 16px",
              color: tab === t.id ? T.orange : T.textMid,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{
                  background: T.orange, color: "#fff", borderRadius: "50%",
                  minWidth: 17, height: 17,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 800, padding: "0 3px",
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          {loading && [1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: T.bgInput, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: "50%", height: 13, background: T.bgInput, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ width: "35%", height: 11, background: T.bgInput, borderRadius: 4, marginBottom: 6 }} />
                <div style={{ width: "65%", height: 11, background: T.bgInput, borderRadius: 4 }} />
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>
                {search ? "No results found" : "No conversations yet"}
              </div>
              <div style={{ fontSize: 13, color: T.textLow }}>
                {search ? "Try a different name" : "Connect with members to start chatting"}
              </div>
            </div>
          )}

          {!loading && filtered.map(contact => (
            <ContactRow
              key={contact.id}
              conv={contact}
              isActive={active?.id === contact.id}
              onClick={() => setActive(contact)}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button style={{
            width: 50, height: 50, borderRadius: "50%",
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px #f9731444",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
