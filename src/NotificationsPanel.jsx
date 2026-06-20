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

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

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

    const actorIds = [...new Set((notifs || []).map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, photo").in("id", actorIds);
    const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    const merged = (notifs || []).map(n => ({ ...n, actor: profileMap[n.actor_id] }));
    setNotifications(merged);
    setUnreadCount(merged.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    // Real-time subscription — this was completely missing before
    const sub = supabase
      .channel("notifications_channel_" + userId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId, fetchNotifications]);

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
}

// --- 2. Instagram-Style UI Component ---
const T = { bg: "#000000", surface: "#1a1a1a", text: "#ffffff", muted: "#a8a8a8", accent: "#3897f0" };

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(session?.userId);

  const handleClick = (n) => {
    markAsRead(n.id);
    if (["new_post", "new_comment", "new_like"].includes(n.type)) {
      onNavigate("feed");
    } else if (["connection_request", "connection_accepted"].includes(n.type)) {
      onNavigate("network");
    } else if (n.type === "new_message") {
      onNavigate("messages");
    } else if (n.type === "new_event") {
      onNavigate("events");
    }
    onClose();
  };

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
          <h2 style={{ color: T.text, fontSize: 16, margin: 0 }}>
            Notifications {unreadCount > 0 && <span style={{ color: T.accent }}>({unreadCount})</span>}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", color: T.text, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <p style={{ color: T.muted, textAlign: "center", marginTop: 20 }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 50 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
              <p style={{ color: T.muted, fontSize: 13 }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
              const initials = n.actor?.name?.slice(0, 2).toUpperCase() || "??";
              return (
                <div key={n.id} onClick={() => handleClick(n)} style={{
                  display: "flex", alignItems: "center", padding: "12px 20px", gap: 12, cursor: "pointer",
                  backgroundColor: n.read ? "transparent" : "#121212"
                }}>
                  {/* Profile Image with type badge */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#333", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}>
                      {n.actor?.photo ? <img src={n.actor.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : initials}
                    </div>
                    <span style={{
                      position: "absolute", bottom: -2, right: -2,
                      background: T.bg, borderRadius: "50%", width: 18, height: 18,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
                      border: "1px solid #333",
                    }}>
                      {cfg.icon}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.3 }}>
                      <strong style={{ fontWeight: 600 }}>{n.actor?.name || "User"}</strong>
                      {" "}{cfg.text}
                      <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>{timeAgo(n.created_at)}</span>
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );

  return createPortal(Panel, document.body);
}
