import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

// --- Helper Functions ---
function timeLabel(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function dateSeparator(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── ChatView Component ── */
function ChatView({ contact, session, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("messages").select("*")
      .or(`and(sender_id.eq.${session.userId},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${session.userId})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  }, [session.userId, contact.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    await supabase.from("messages").insert({
      sender_id: session.userId, receiver_id: contact.id,
      content, read: false, created_at: new Date().toISOString(),
    });
    fetchMessages();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: T.bg, display: "flex", flexDirection: "column", zIndex: 1000
    }}>
      {/* Header */}
      <div style={{ padding: "15px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{ background: T.bgInput, color: T.text, border: "none", padding: "8px 12px", borderRadius: 8 }}>←</button>
        <span style={{ color: T.text, fontWeight: 700 }}>{contact.name}</span>
      </div>

      {/* Messages List (Scrollable) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: "flex", 
            justifyContent: msg.sender_id === session.userId ? "flex-end" : "flex-start",
            marginBottom: "10px"
          }}>
            <div style={{
              background: msg.sender_id === session.userId ? T.orange : T.bgCard,
              padding: "10px 15px", borderRadius: 15, color: "#fff", maxWidth: "70%"
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar (Pinned at bottom) */}
      <div style={{ 
        padding: "15px", background: T.bgCard, borderTop: `1px solid ${T.border}`,
        display: "flex", gap: 10, alignItems: "center" 
      }}>
        <input 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, color: T.text, padding: "12px", borderRadius: 20, outline: "none" }}
        />
        <button onClick={send} style={{ background: T.orange, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 20 }}>Send</button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MessagesPage({ session }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);

  useEffect(() => {
    // Replace with your actual fetching logic
    const load = async () => {
      const { data } = await supabase.from("profiles").select("*");
      setContacts(data || []);
    };
    load();
  }, []);

  if (activeContact) {
    return <ChatView contact={activeContact} session={session} onBack={() => setActiveContact(null)} />;
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, padding: "20px" }}>
      <h1>Messages</h1>
      {contacts.map(c => (
        <div key={c.id} onClick={() => setActiveContact(c)} style={{ padding: 15, background: T.bgCard, marginBottom: 10, borderRadius: 10, cursor: "pointer" }}>
          {c.name}
        </div>
      ))}
    </div>
  );
}
