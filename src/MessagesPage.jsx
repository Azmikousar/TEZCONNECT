import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

function Avatar({ profile, size = 40 }) {
  const initials = (profile?.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg,#f97316,#ea6008)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: "#fff",
      overflow: "hidden", flexShrink: 0,
    }}>
      {profile?.photo
        ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials
      }
    </div>
  );
}

/* ── Chat Window ── */
function ChatWindow({ selected, session, onBack, isMobile }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!selected) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${session.userId},receiver_id.eq.${selected.id}),` +
        `and(sender_id.eq.${selected.id},receiver_id.eq.${session.userId})`
      )
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ read: true })
      .eq("sender_id", selected.id).eq("receiver_id", session.userId).eq("read", false);
  }, [selected, session.userId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const sub = supabase.channel("chat_" + selected?.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        payload => {
          const msg = payload.new;
          if (
            (msg.sender_id === session.userId && msg.receiver_id === selected?.id) ||
            (msg.sender_id === selected?.id && msg.receiver_id === session.userId)
          ) {
            setMessages(prev => [...prev, msg]);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(sub);
  }, [selected, session.userId]);

  const sendMessage = async () => {
    if (!input.trim() || !selected || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: session.userId,
      receiver_id: selected.id,
      content,
    });
    setSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (ts) => new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });

  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const grouped = messages.reduce((acc, msg) => {
    const key = new Date(msg.created_at).toDateString();
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "100vh" : "100%",
      background: T.bg,
    }}>
      {/* Chat header */}
      <div style={{
        padding: isMobile ? "12px 16px" : "14px 20px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 12,
        background: T.bgCard,
        paddingTop: isMobile ? "calc(12px + env(safe-area-inset-top))" : "14px",
        flexShrink: 0,
      }}>
        {isMobile && (
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: T.text, fontSize: 22, cursor: "pointer", padding: 0, marginRight: 4 }}
          >
            ←
          </button>
        )}
        <Avatar profile={selected} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{selected.name}</div>
          <div style={{ fontSize: 11, color: T.textLow }}>
            {selected.designation || selected.company || "TezConnect Member"}
          </div>
        </div>
        {selected.whatsapp && (
          <a
            href={`https://wa.me/${selected.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ background: "#25d36618", border: "1px solid #25d36633", borderRadius: 8, padding: "7px 12px", color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
          >
            💬
          </a>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center", opacity: 0.6 }}>
            <Avatar profile={selected} size={60} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: T.textMid }}>
              Start a conversation with {selected.name.split(" ")[0]}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              {/* Date divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 10, color: T.textLow, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {formatDate(msgs[0].created_at)}
                </span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {msgs.map((msg) => {
                  const isMe = msg.sender_id === session.userId;
                  return (
                    <div key={msg.id} style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      alignItems: "flex-end", gap: 8,
                    }}>
                      {!isMe && <Avatar profile={selected} size={26} />}
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{
                          background: isMe ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgCard,
                          border: isMe ? "none" : `1px solid ${T.border}`,
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          padding: "10px 14px",
                          fontSize: 14, color: isMe ? "#fff" : T.text,
                          lineHeight: 1.5, wordBreak: "break-word",
                        }}>
                          {msg.content}
                        </div>
                        <div style={{
                          fontSize: 10, color: T.textLow, marginTop: 3,
                          textAlign: isMe ? "right" : "left",
                          display: "flex", alignItems: "center",
                          justifyContent: isMe ? "flex-end" : "flex-start", gap: 4,
                        }}>
                          {formatTime(msg.created_at)}
                          {isMe && <span style={{ color: msg.read ? T.success : T.textLow }}>{msg.read ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px",
        paddingBottom: "calc(10px + env(safe-area-inset-bottom))",
        borderTop: `1px solid ${T.border}`,
        display: "flex", gap: 10, alignItems: "flex-end",
        background: T.bgCard, flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`Message ${selected.name.split(" ")[0]}…`}
          rows={1}
          style={{
            flex: 1, background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: "10px 14px",
            color: T.text, fontSize: 14, outline: "none",
            resize: "none", lineHeight: 1.5, maxHeight: 100,
            overflowY: "auto", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, flexShrink: 0,
            background: input.trim() ? "linear-gradient(135deg,#f97316,#ea6008)" : T.bgInput,
            border: input.trim() ? "none" : `1px solid ${T.border}`,
            borderRadius: "50%", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, transition: "all .2s",
            boxShadow: input.trim() ? "0 4px 14px #f9731440" : "none",
          }}
        >
          {sending ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}

/* ── Contacts List ── */
function ContactsList({ session, onSelect, unread }) {
  const [connections, setConnections] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: conns } = await supabase
        .from("connections").select("*").eq("status", "accepted")
        .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`);
      if (!conns?.length) return;
      const ids = conns.map(c => c.sender_id === session.userId ? c.receiver_id : c.sender_id);
      const { data: profiles } = await supabase
        .from("profiles").select("id, name, photo, designation, company, whatsapp")
        .in("id", ids);
      setConnections(profiles || []);
    }
    load();
  }, [session.userId]);

  const filtered = connections.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 12 }}>
          💬 Messages
          {Object.values(unread).reduce((a, b) => a + b, 0) > 0 && (
            <span style={{ marginLeft: 8, background: T.orange, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px" }}>
              {Object.values(unread).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search connections…"
          style={{
            width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "10px 14px", color: T.text,
            fontSize: 13, outline: "none", boxSizing: "border-box",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {connections.length === 0 ? (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🤝</div>
            <div style={{ fontSize: 13, color: T.textLow, lineHeight: 1.6 }}>
              Connect with people on the Network page to start messaging
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: T.textLow }}>No results</div>
        ) : (
          filtered.map(person => {
            const count = unread[person.id] || 0;
            return (
              <div
                key={person.id}
                onClick={() => onSelect(person)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", cursor: "pointer",
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ position: "relative" }}>
                  <Avatar profile={person} size={48} />
                  {count > 0 && (
                    <div style={{
                      position: "absolute", top: -2, right: -2,
                      width: 18, height: 18, background: T.orange,
                      borderRadius: "50%", border: `2px solid ${T.bg}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 800, color: "#fff",
                    }}>
                      {count}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: count > 0 ? 800 : 600, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {person.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {person.designation || person.company || "TezConnect Member"}
                  </div>
                </div>
                {count > 0 && (
                  <span style={{ background: T.orange, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px", flexShrink: 0 }}>
                    {count}
                  </span>
                )}
                <span style={{ color: T.textLow, fontSize: 18 }}>›</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Main Messages Page ── */
export default function MessagesPage({ session }) {
  const [selected, setSelected]     = useState(null);
  const [unread, setUnread]         = useState({});
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    supabase.from("messages").select("sender_id")
      .eq("receiver_id", session.userId).eq("read", false)
      .then(({ data }) => {
        const counts = {};
        (data || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
        setUnread(counts);
      });

    const sub = supabase.channel("msgs_unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        supabase.from("messages").select("sender_id")
          .eq("receiver_id", session.userId).eq("read", false)
          .then(({ data }) => {
            const counts = {};
            (data || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
            setUnread(counts);
          });
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [session.userId]);

  const handleSelect = (person) => {
    setSelected(person);
    setUnread(u => ({ ...u, [person.id]: 0 }));
  };

  /* Mobile: show either list OR chat, not both */
  if (isMobile) {
    if (selected) {
      return (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: T.bg,
        }}>
          <ChatWindow
            selected={selected}
            session={session}
            onBack={() => setSelected(null)}
            isMobile={true}
          />
        </div>
      );
    }
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        minHeight: "calc(100vh - 140px)",
      }}>
        <ContactsList
          session={session}
          onSelect={handleSelect}
          unread={unread}
        />
      </div>
    );
  }

  /* Desktop: side by side */
  return (
    <div style={{
      display: "flex", height: "calc(100vh - 130px)",
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Left contacts */}
      <div style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${T.border}` }}>
        <ContactsList session={session} onSelect={handleSelect} unread={unread} />
      </div>

      {/* Right chat */}
      {!selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64 }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>Your Messages</div>
          <div style={{ fontSize: 13, color: T.textMid, maxWidth: 300, lineHeight: 1.7 }}>
            Select a connection from the left to start a conversation
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ChatWindow selected={selected} session={session} onBack={() => setSelected(null)} isMobile={false} />
        </div>
      )}
    </div>
  );
}
