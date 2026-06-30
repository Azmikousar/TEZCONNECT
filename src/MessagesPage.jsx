import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

// --- Theme & Constants ---
const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

// --- Helper Functions ---
const timeLabel = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  return d.toDateString() === now.toDateString() 
    ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

// --- Main Page Component ---
export default function MessagesPage({ session }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);

  const fetchContacts = useCallback(async () => {
    if (!session?.userId) return;
    
    // Fetch latest messages for the current user
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${session.userId},receiver_id.eq.${session.userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch Error:", error);
      setLoading(false);
      return;
    }

    // Logic to group unique contacts
    const uniqueContacts = [];
    const seenIds = new Set();
    
    (msgs || []).forEach(msg => {
      const otherId = msg.sender_id === session.userId ? msg.receiver_id : msg.sender_id;
      if (!seenIds.has(otherId)) {
        seenIds.add(otherId);
        uniqueContacts.push({
          id: otherId,
          lastMsg: msg.content,
          time: msg.created_at
        });
      }
    });

    setContacts(uniqueContacts);
    setLoading(false);
  }, [session.userId]);

  useEffect(() => {
    fetchContacts();
    // Subscribe to real-time updates
    const channel = supabase.channel("realtime_msgs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchContacts)
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, [fetchContacts]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.text, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: "20px 16px" }}>
        <h2 style={{ fontSize: 24, margin: 0 }}>Messages <span style={{ color: T.orange }}>●</span></h2>
        <p style={{ color: T.textMid, fontSize: 13, marginTop: 4 }}>Stay connected, grow together.</p>
      </div>

      {/* Content List */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <div style={{ color: T.textMid }}>Loading conversations...</div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 50, color: T.textMid }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <p>No conversations yet. Start by connecting with someone!</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => setActiveContact(contact)}
              style={{
                background: T.bgCard, padding: 15, borderRadius: 12,
                marginBottom: 10, border: `1px solid ${T.border}`, cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>User {contact.id.slice(0, 5)}...</span>
                <span style={{ fontSize: 11, color: T.textMid }}>{timeLabel(contact.time)}</span>
              </div>
              <p style={{ fontSize: 13, color: T.textMid, margin: "5px 0 0" }}>{contact.lastMsg}</p>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{
        position: "fixed", right: 20, bottom: 90, width: 56, height: 56,
        borderRadius: "50%", background: T.orange, display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: 24, cursor: "pointer"
      }}>+</div>
    </div>
  );
}
