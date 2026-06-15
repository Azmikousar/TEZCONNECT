import { useNotifications } from "./useNotifications";
import { useState, useEffect } from "react";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", error: "#f87171",
};

const TYPE_CONFIG = {
  new_post:            { icon: "📸", text: "shared a new post" },
  connection_request:  { icon: "🤝", text: "sent you a connection request" },
  connection_accepted: { icon: "✅", text: "accepted your connection" },
  new_message:         { icon: "💬", text: "sent you a message" },
  new_comment:         { icon: "💭", text: "commented on your post" },
  new_like:            { icon: "❤️", text: "liked your post" },
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead,
  } = useNotifications(session.userId);

  const handleClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    if (["new_post", "new_comment", "new_like"].includes(notif.type)) {
      onNavigate("feed");
    } else if (["connection_request", "connection_accepted"].includes(notif.type)) {
      onNavigate("network");
    } else if (notif.type === "new_message") {
      onNavigate("messages");
    }
    onClose();
  };

  return (
    <>
      {/* Full screen backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "#000000aa",
          zIndex: 800,
        }}
      />

      {/* Slide up panel — works on both mobile and desktop */}
      <div style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        maxHeight: "80vh",
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

        {/* Handle bar */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px 14px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 8,
                background: T.orange, color: "#fff",
                borderRadius: 20, fontSize: 10,
                fontWeight: 800, padding: "2px 8px",
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
                  background: T.orangeMd,
                  border: `1px solid ${T.orange}44`,
                  borderRadius: 8, padding: "5px 12px",
                  color: T.orange, fontSize: 11,
                  fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: T.bgInput,
                border: `1px solid ${T.border}`,
                borderRadius: "50%", width: 30, height: 30,
                color: T.textMid, fontSize: 16,
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Loading */}
          {loading && (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{
                width: 24, height: 24,
                border: "2px solid #f9731633",
                borderTopColor: "#f97316",
                borderRadius: "50%",
                animation: "spin .7s linear infinite",
                margin: "0 auto 12px",
              }} />
              <div style={{ fontSize: 12, color: T.textLow }}>
                Loading notifications…
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && notifications.length === 0 && (
            <div style={{ padding: "50px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 6 }}>
                All caught up!
              </div>
              <div style={{ fontSize: 13, color: T.textLow }}>
                No notifications yet. When someone posts, likes, or messages you — it shows here.
              </div>
            </div>
          )}

          {/* List */}
          {!loading && notifications.map((n, idx) => {
            const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
            const actor = n.actor || {};
            const initials = (actor.name || "?")
              .split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

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
                {/* Avatar with badge */}
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
                  {/* Type icon badge */}
                  <div style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
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
                    {timeAgo(n.created_at)}
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

          {/* Bottom padding for mobile */}
          <div style={{ height: 20 }} />
        </div>
      </div>
    </>
  );
}
