import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";
const TYPE_CONFIG = {
  new_post:            { icon: "📸", text: "shared a new post" },
  connection_request:  { icon: "🤝", text: "sent you a connection request" },
  connection_accepted: { icon: "✅", text: "accepted your connection" },
  new_message:         { icon: "💬", text: "sent you a message" },
  new_comment:         { icon: "💭", text: "commented on your post" },
  new_like:            { icon: "❤️", text: "liked your post" },
  new_event:           { icon: "📅", text: "created a new event" },
};


// --- 1. Hook Logic ---
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: notifs, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, photo").in("id", actorIds);
    const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    const merged = notifs.map(n => ({ ...n, actor: profileMap[n.actor_id] }));
    setNotifications(merged);
    setUnreadCount(merged.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, loading, markAsRead };
}

// --- 2. Instagram-Style UI Component ---
const T = { bg: "#000000", surface: "#1a1a1a", text: "#ffffff", muted: "#a8a8a8", accent: "#3897f0" };

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications(session?.userId);

  const Panel = (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000060", backdropFilter: "blur(4px)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "70vh", background: T.bg, 
        borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 9999, display: "flex", flexDirection: "column",
        maxWidth: 500, margin: "0 auto", overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626" }}>
          <h2 style={{ color: T.text, fontSize: 16, margin: 0 }}>Notifications</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.text, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <p style={{ color: T.muted, textAlign: "center", marginTop: 20 }}>Loading...</p> : 
            notifications.map((n) => {
              const initials = n.actor?.name?.slice(0, 2).toUpperCase() || "??";
              return (
                <div key={n.id} onClick={() => { markAsRead(n.id); onNavigate(n.type); }} style={{ 
                  display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, cursor: "pointer",
                  backgroundColor: n.read ? "transparent" : "#121212"
                }}>
                  {/* Profile Image */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#333", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>
                    {n.actor?.photo ? <img src={n.actor.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.3 }}>
                      <strong style={{ fontWeight: 600 }}>{n.actor?.name || "User"}</strong> 
                      {" "}{n.type === "new_like" ? "liked your post." : "sent you a message."}
                      <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>1h</span>
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent }} />}
                </div>
              );
            })
          }
        </div>
      </div>
    </>
  );

  return createPortal(Panel, document.body);
}
