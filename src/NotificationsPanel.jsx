import React, { useState, useEffect, useCallback } from "react";
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

/* ── Hook ── */
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data: notifs, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Notifications fetch error:", error);
      setLoading(false);
      return;
    }

    if (!notifs || notifs.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, photo")
      .in("id", actorIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const merged = notifs.map(n => ({ ...n, actor: profileMap[n.actor_id] || null }));

    setNotifications(merged);
    setUnreadCount(merged.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    if (!userId) return;

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

  const markAsRead = useCallback(async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
}

/* ── UI ── */
const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
};

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(session?.userId);

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id);
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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 800 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        maxHeight: "75vh",
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: "20px 20px 0 0",
        zIndex: 801,
        display: "flex",
        flexDirection: "column",
        animation: "slideUp .3s ease",
        maxWidth: 600,
        margin: "0 auto",
      }}>

        {/* Handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 20px 14px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8, background: T.orange, color: "#fff",
                borderRadius: 20, fontSize: 10, fontWeight: 800, padding: "2px 8px",
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: T.orangeMd, border: `1px solid ${T.orange}44`,
                  borderRadius: 8, padding: "5px 12px",
                  color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: T.bgInput, border: `1px solid ${T.border}`,
                borderRadius: "50%", width: 30, height: 30,
                color: T.textMid, fontSize: 16, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{
                width: 24, height: 24,
                border: "2px solid #f9731633", borderTopColor: "#f97316",
                borderRadius: "50%", animation: "spin .7s linear infinite",
                margin: "0 auto 12px",
              }} />
              <div style={{ fontSize: 12, color: T.textLow }}>Loading notifications…</div>
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div style={{ padding: "50px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>
                All caught up!
              </div>
              <div style={{ fontSize: 13, color: T.textLow }}>
                No notifications yet.
              </div>
            </div>
          )}

          {!loading && notifications.map((n, idx) => {
            const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
            const actor = n.actor || {};
            const initials = (actor.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px",
                  background: n.read ? "transparent" : T.orangeMd,
                  borderBottom: idx < notifications.length - 1 ? `1px solid ${T.border}` : "none",
                  cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = n.read ? T.bgHover : "#f9731633"}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : T.orangeMd}
              >
                {/* Avatar + type badge */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f97316,#ea6008)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "#fff",
                    overflow: "hidden",
                  }}>
                    {actor.photo
                      ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials
                    }
                  </div>
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: T.bgCard, border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11,
                  }}>
                    {cfg.icon}
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                    <strong style={{ color: n.read ? T.text : T.orange }}>
                      {actor.name || "Someone"}
                    </strong>
                    {" "}{cfg.text}
                  </div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 3 }}>
                    {timeAgo(n.created_at)} ago
                  </div>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: T.orange, flexShrink: 0,
                    boxShadow: `0 0 6px ${T.orange}`,
                  }} />
                )}
              </div>
            );
          })}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}
