import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171",
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

export default function MessagesPage({ session }) {
  const [connections, setConnections] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [unread, setUnread]           = useState({});
  const [search, setSearch]           = useState("");
  const bottomRef                     = useRef(null);
  const inputRef                      = useRef(null);

  // Load connected users
  useEffect(() => {
    async function loadConnections() {
      const { data: conns } = await supabase
        .from("connections")
        .select("*")
        .eq("status", "accepted")
        .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`);

      if (!conns?.length) return;

      const ids = conns.map(c =>
        c.sender_id === session.userId ? c.receiver_id : c.sender_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, photo, designation, company")
        .in("id", ids);

      setConnections(profiles || []);
    }
    loadConnections();
  }, [session.userId]);

  // Load messages for selected conversation
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

    // Mark received messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", selected.id)
      .eq("receiver_id", session.userId)
      .eq("read", false);

    // Clear unread count for this person
    setUnread(u => ({ ...u, [selected.id]: 0 }));
  }, [selected, session.userId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const sub = supabase
      .channel("messages_channel")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, payload => {
        const msg = payload.new;
        const isForMe = msg.receiver_id === session.userId;
        const isFromSelected = selected && msg.sender_id === selected.id;
        const isByMe = msg.sender_id === session.userId;

        if (isByMe || isFromSelected) {
          setMessages(prev => [...prev, msg]);
          if (isFromSelected) {
            // Mark as read immediately since we're in the chat
            supabase.from("messages").update({ read: true }).eq("id", msg.id);
          }
        } else if (isForMe) {
          // Increment unread for sender
          setUnread(u => ({ ...u, [msg.sender_id]: (u[msg.sender_id] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [session.userId, selected]);

  // Load unread counts on mount
  useEffect(() => {
    supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", session.userId)
      .eq("read", false)
      .then(({ data }) => {
        const counts = {};
        (data || []).forEach(m => {
          counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
        });
        setUnread(counts);
      });
  }, [session.userId]);

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

  const filtered = connections.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

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

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div style={{
      display: "flex", height: "calc(100vh - 130px)",
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
    }}>

      {/* LEFT — Contacts list */}
      <div style={{
        width: 280, flexShrink: 0,
        borderRight: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 10 }}>
            💬 Messages
            {totalUnread > 0 && (
              <span style={{ marginLeft: 8, background: T.orange, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px" }}>
                {totalUnread}
              </span>
            )}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connections…"
            style={{
              width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
              borderRadius: 8, padding: "8px 12px", color: T.text,
              fontSize: 12, outline: "none", boxSizing: "border-box",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = T.orange}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>

        {/* Contacts */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {connections.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
              <div style={{ fontSize: 12, color: T.textLow, lineHeight: 1.6 }}>
                Connect with people on the Network page to start messaging
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "20px 16px", textAlign: "center", fontSize: 12, color: T.textLow }}>
              No results
            </div>
          ) : (
            filtered.map(person => {
              const isActive = selected?.id === person.id;
              const count = unread[person.id] || 0;
              return (
                <div
                  key={person.id}
                  onClick={() => setSelected(person)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", cursor: "pointer",
                    background: isActive ? T.orangeMd : "transparent",
                    borderLeft: `3px solid ${isActive ? T.orange : "transparent"}`,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.bgHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ position: "relative" }}>
                    <Avatar profile={person} size={40} />
                    {count > 0 && (
                      <div style={{
                        position: "absolute", top: -2, right: -2,
                        width: 16, height: 16, background: T.orange,
                        borderRadius: "50%", border: `2px solid ${T.bgCard}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800, color: "#fff",
                      }}>
                        {count}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: count > 0 ? 800 : 600, fontSize: 13, color: isActive ? T.orange : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {person.name}
                    </div>
                    <div style={{ fontSize: 11, color: T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {person.designation || person.company || "TezConnect Member"}
                    </div>
                  </div>
                  {count > 0 && (
                    <span style={{ background: T.orange, color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "2px 6px", flexShrink: 0 }}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT — Chat window */}
      {!selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64 }}>💬</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text }}>Your Messages</div>
          <div style={{ fontSize: 13, color: T.textMid, maxWidth: 300, lineHeight: 1.7 }}>
            Select a connection from the left to start a conversation
          </div>
          {connections.length === 0 && (
            <div style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "10px 20px", fontSize: 12, color: T.orange, fontWeight: 600 }}>
              Connect with people in the Network tab first
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Chat header */}
          <div style={{
            padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 12,
            background: T.bgCard,
          }}>
            <Avatar profile={selected} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                {selected.name}
              </div>
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
                💬 WhatsApp
              </a>
            )}
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 4 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", opacity: 0.6 }}>
                <div style={{ fontSize: 40 }}>👋</div>
                <div style={{ fontSize: 13, color: T.textMid }}>
                  Start the conversation with {selected.name.split(" ")[0]}
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

                  {/* Messages */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {msgs.map((msg, i) => {
                      const isMe = msg.sender_id === session.userId;
                      const showAvatar = !isMe && (i === 0 || msgs[i-1]?.sender_id !== msg.sender_id);
                      return (
                        <div key={msg.id} style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          alignItems: "flex-end",
                          gap: 8,
                        }}>
                          {!isMe && (
                            <div style={{ width: 28, flexShrink: 0 }}>
                              {showAvatar && <Avatar profile={selected} size={28} />}
                            </div>
                          )}
                          <div style={{ maxWidth: "65%" }}>
                            <div style={{
                              background: isMe
                                ? "linear-gradient(135deg,#f97316,#ea6008)"
                                : T.bgInput,
                              border: isMe ? "none" : `1px solid ${T.border}`,
                              borderRadius: isMe
                                ? "16px 16px 4px 16px"
                                : "16px 16px 16px 4px",
                              padding: "10px 14px",
                              fontSize: 13, color: isMe ? "#fff" : T.text,
                              lineHeight: 1.5,
                              wordBreak: "break-word",
                            }}>
                              {msg.content}
                            </div>
                            <div style={{
                              fontSize: 10, color: T.textLow, marginTop: 3,
                              textAlign: isMe ? "right" : "left",
                              display: "flex", alignItems: "center",
                              justifyContent: isMe ? "flex-end" : "flex-start",
                              gap: 4,
                            }}>
                              {formatTime(msg.created_at)}
                              {isMe && (
                                <span style={{ color: msg.read ? T.success : T.textLow }}>
                                  {msg.read ? "✓✓" : "✓"}
                                </span>
                              )}
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
            padding: "12px 16px", borderTop: `1px solid ${T.border}`,
            display: "flex", gap: 10, alignItems: "flex-end",
            background: T.bgCard,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message ${selected.name.split(" ")[0]}…`}
              rows={1}
              style={{
                flex: 1, background: T.bgInput, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "10px 14px",
                color: T.text, fontSize: 13, outline: "none",
                resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "border-color .2s",
              }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{
                width: 42, height: 42, flexShrink: 0,
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
      )}
    </div>
  );
}