import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171",
};

function timeLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 86400 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 172800) return "Yesterday";
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  return `${day} ${month}`;
}

function dateSeparator(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 86400 && d.getDate() === now.getDate()) return "Today";
  if (diff < 172800) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function shouldShowDateSep(messages, index) {
  if (index === 0) return true;
  const curr = new Date(messages[index].created_at);
  const prev = new Date(messages[index - 1].created_at);
  return curr.toDateString() !== prev.toDateString();
}

/* ── Contact Row ── */
function ContactRow({ conv, isActive, onClick }) {
  const initials = (conv.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["linear-gradient(135deg,#f97316,#ea6008)", "linear-gradient(135deg,#7c3aed,#a78bfa)", "linear-gradient(135deg,#0369a1,#38bdf8)", "linear-gradient(135deg,#15803d,#22c55e)", "linear-gradient(135deg,#be123c,#f43f5e)"];
  const bg = colors[(conv.name || "").charCodeAt(0) % colors.length];

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 16px", cursor: "pointer",
        background: isActive ? "#f9731610" : "transparent",
        borderLeft: isActive ? `3px solid ${T.orange}` : "3px solid transparent",
        borderBottom: `1px solid ${T.border}`,
        transition: "all .15s",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", overflow: "hidden" }}>
          {conv.photo ? <img src={conv.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
        </div>
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: T.success, border: `2px solid ${T.bg}` }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{conv.name}</span>
          <span style={{ fontSize: 11, color: T.textLow, flexShrink: 0 }}>{timeLabel(conv.last_message_at)}</span>
        </div>
        <div style={{ fontSize: 11, color: T.textLow, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.designation || conv.company || "TezConnect Member"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: conv.unread > 0 ? T.textMid : T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
            {conv.last_message || "Say hello 👋"}
          </span>
          {conv.unread > 0 && (
            <div style={{ minWidth: 20, height: 20, borderRadius: "50%", background: T.orange, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>
              {conv.unread}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Chat View ── */
function ChatView({ contact, session, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const bottomRef = useRef();
  const inputRef = useRef();
  const channelRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${session.userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${session.userId})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ read: true })
      .eq("sender_id", contact.id).eq("receiver_id", session.userId).eq("read", false);
  }, [session.userId, contact.id]);

  useEffect(() => {
    fetchMessages();
    const channelName = "chat_" + session.userId + "_" + contact.id + "_" + Math.random().toString(36).slice(2, 6);
    channelRef.current = supabase.channel(channelName)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new;
        if ((m.sender_id === session.userId && m.receiver_id === contact.id) ||
            (m.sender_id === contact.id && m.receiver_id === session.userId)) {
          setMessages(prev => [...prev, m]);
        }
      })
      .subscribe();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [contact.id, session.userId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    await supabase.from("messages").insert({
      sender_id: session.userId, receiver_id: contact.id,
      content, read: false, created_at: new Date().toISOString(),
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const initials = (contact.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = [
    "linear-gradient(135deg,#f97316,#ea6008)",
    "linear-gradient(135deg,#7c3aed,#a78bfa)",
    "linear-gradient(135deg,#0369a1,#38bdf8)",
    "linear-gradient(135deg,#15803d,#22c55e)",
    "linear-gradient(135deg,#be123c,#f43f5e)",
  ];
  const avatarBg = colors[(contact.name || "").charCodeAt(0) % colors.length];

  const attachOptions = [
    { icon: "🖼️", label: "Gallery",  color: "#7c3aed" },
    { icon: "📷", label: "Camera",   color: "#ea580c" },
    { icon: "📄", label: "Document", color: "#0369a1" },
    { icon: "📍", label: "Location", color: "#15803d" },
  ];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 300,
      background: T.bg,
      display: "flex",
      flexDirection: "column",
      // Leave room for iOS safe area at bottom
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>

      {/* ── Chat Header ── */}
      <div style={{ flexShrink: 0, background: T.bgCard, borderBottom: `1px solid ${T.border}`, padding: "10px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <button onClick={onBack}
            style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", color: T.text, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>
            ←
          </button>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
            {contact.photo ? <img src={contact.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.name}</div>
            <div style={{ fontSize: 11, color: T.textMid }}>
              {contact.designation || "TezConnect Member"}&nbsp;
              <span style={{ color: T.success }}>● Online</span>
            </div>
          </div>
          <a href={`tel:${contact.mobile || contact.whatsapp || ""}`}
            style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, textDecoration: "none", color: T.textMid, flexShrink: 0 }}>
            📞
          </a>
          <button style={{ background: "none", border: "none", color: T.textMid, fontSize: 20, cursor: "pointer", flexShrink: 0 }}>⋯</button>
        </div>

        {/* Location / Industry strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px" }}>
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
          <button style={{ background: "none", border: "none", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            View profile
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", margin: "auto", padding: "40px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>Start the conversation</div>
            <div style={{ fontSize: 13, color: T.textLow }}>Say hello to {contact.name?.split(" ")[0]}</div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === session.userId;
          const showSep = shouldShowDateSep(messages, i);
          return (
            <div key={msg.id}>
              {showSep && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0" }}>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 11, color: T.textLow, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>
                    {dateSeparator(msg.created_at)}
                  </span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>
              )}
              <div style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
                <div style={{
                  maxWidth: "72%",
                  background: isMine ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgCard,
                  border: isMine ? "none" : `1px solid ${T.border}`,
                  borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 14px",
                  boxShadow: isMine ? "0 4px 16px #f9731430" : "none",
                }}>
                  <div style={{ fontSize: 14, color: isMine ? "#fff" : T.text, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.content}</div>
                  <div style={{ fontSize: 10, color: isMine ? "rgba(255,255,255,0.7)" : T.textLow, marginTop: 4, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
                    {timeLabel(msg.created_at)}
                    {isMine && <span style={{ color: msg.read ? "#60a5fa" : "rgba(255,255,255,0.6)" }}>{msg.read ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Attachment Panel ── */}
      {showAttach && (
        <div style={{ flexShrink: 0, background: T.bgCard, borderTop: `1px solid ${T.border}`, padding: "14px 20px 18px", animation: "slideUp .25s ease" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <button onClick={() => setShowAttach(false)}
              style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 20, padding: "4px 20px", color: T.textMid, fontSize: 14, cursor: "pointer" }}>
              ▾
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {attachOptions.map(opt => (
              <div key={opt.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}
                onClick={() => setShowAttach(false)}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: opt.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                  {opt.icon}
                </div>
                <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div style={{
        flexShrink: 0,
        background: T.bgCard,
        borderTop: `1px solid ${T.border}`,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <button style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", flexShrink: 0, lineHeight: 1 }}>😊</button>

        <div style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 24, display: "flex", alignItems: "center", padding: "2px 14px" }}>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message..."
            style={{ flex: 1, background: "none", border: "none", color: T.text, fontSize: 14, outline: "none", padding: "10px 0", fontFamily: "'Plus Jakarta Sans',sans-serif", minWidth: 0 }}
          />
        </div>

        <button
          onClick={() => setShowAttach(a => !a)}
          style={{ background: showAttach ? T.orangeMd : "none", border: showAttach ? `1px solid ${T.orange}44` : "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer", flexShrink: 0 }}>
          📎
        </button>

        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: text.trim() ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgInput,
            border: text.trim() ? "none" : `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: text.trim() ? "pointer" : "default",
            flexShrink: 0,
            boxShadow: text.trim() ? "0 4px 14px #f9731440" : "none",
            transition: "all .2s",
          }}>
          <span style={{ fontSize: 18, color: text.trim() ? "#fff" : T.textLow, transform: "rotate(45deg)", display: "block", marginLeft: 2 }}>➤</span>
        </button>
      </div>
    </div>
  );
}


/* ── Main MessagesPage ── */
export default function MessagesPage({ session }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeContact, setActiveContact] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = window.innerWidth <= 768;

  const fetchContacts = useCallback(async () => {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`)
      .order("created_at", { ascending: false });

    if (!msgs?.length) { setLoading(false); return; }

    const contactIds = [...new Set(msgs.map(m => m.sender_id === session.userId ? m.receiver_id : m.sender_id))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("id", contactIds);
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const seen = new Set();
    const convs = [];
    for (const msg of msgs) {
      const otherId = msg.sender_id === session.userId ? msg.receiver_id : msg.sender_id;
      if (seen.has(otherId)) continue;
      seen.add(otherId);
      const profile = profileMap[otherId] || {};
      const unread = msgs.filter(m => m.sender_id === otherId && m.receiver_id === session.userId && !m.read).length;
      convs.push({ ...profile, id: otherId, last_message: msg.content, last_message_at: msg.created_at, unread });
    }

    setContacts(convs);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => {
    fetchContacts();
    const sub = supabase.channel("messages_list_" + session.userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new;
        if (m.sender_id === session.userId || m.receiver_id === session.userId) fetchContacts();
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [session.userId, fetchContacts]);

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.designation?.toLowerCase().includes(q);
    if (activeTab === "connections") return matchSearch;
    if (activeTab === "requests") return matchSearch && c.unread > 0;
    return matchSearch;
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "connections", label: "Connections" },
    { id: "requests", label: "Requests", badge: contacts.filter(c => c.unread > 0).length },
  ];

  // Mobile: show chat fullscreen
  if (isMobile && activeContact) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: T.bg, display: "flex", flexDirection: "column" }}>
        <ChatView contact={activeContact} session={session} onBack={() => setActiveContact(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: isMobile ? "auto" : "calc(100vh - 80px)", gap: 0 }}>

      {/* ── Contacts Sidebar ── */}
      <div style={{
        width: isMobile ? "100%" : 340,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: T.bg,
        borderRight: isMobile ? "none" : `1px solid ${T.border}`,
      }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: "-.02em" }}>Messages</h2>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange, boxShadow: `0 0 8px ${T.orange}` }} />
          </div>
          <div style={{ fontSize: 12, color: T.textLow }}>Stay connected, grow together.</div>
        </div>

        {/* Search */}
        <div style={{ padding: "0 12px 12px", flexShrink: 0, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textLow, pointerEvents: "none" }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search connections..."
              style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "10px 14px 10px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 10, background: T.bgInput, border: `1px solid ${T.border}`, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>⚙</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 12px 10px", flexShrink: 0, display: "flex", gap: 8 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: activeTab === tab.id ? T.orangeMd : T.bgInput, border: `1px solid ${activeTab === tab.id ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "6px 14px", color: activeTab === tab.id ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer", position: "relative" }}>
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ background: T.orange, color: "#fff", borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, padding: "0 3px" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: T.bgInput, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: "55%", height: 13, background: T.bgInput, borderRadius: 4, marginBottom: 7 }} />
                    <div style={{ width: "40%", height: 11, background: T.bgInput, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>No conversations yet</div>
              <div style={{ fontSize: 13, color: T.textLow }}>Connect with members and start messaging</div>
            </div>
          )}

          {!loading && filtered.map(contact => (
            <ContactRow
              key={contact.id}
              conv={contact}
              isActive={activeContact?.id === contact.id}
              onClick={() => setActiveContact(contact)}
            />
          ))}
        </div>

        {/* New message FAB */}
        <div style={{ padding: "12px 16px", flexShrink: 0, display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${T.border}` }}>
          <button style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, cursor: "pointer", boxShadow: "0 4px 16px #f9731444" }}>
            +
          </button>
        </div>
      </div>

      {/* ── Chat Panel (desktop) ── */}
      {!isMobile && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {activeContact ? (
            <ChatView contact={activeContact} session={session} onBack={() => setActiveContact(null)} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, background: T.bg }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.orangeLo, border: `1px solid ${T.orange}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💬</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>Your Messages</div>
              <div style={{ fontSize: 13, color: T.textLow, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
                Select a conversation from the left to start chatting with a TezConnect member
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
