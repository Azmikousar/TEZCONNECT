import { useNotifications } from "./useNotifications";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 490 }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 60,
        right: 20,
        width: 360,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "70vh",
        overflowY: "auto",
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        boxShadow: "0 20px 60px #000000aa",
        zIndex: 491,
        animation: "scaleIn .2s ease",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, background: T.bgCard, zIndex: 1,
        }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: 8, color: T.orange }}>({unreadCount})</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: "none", border: "none", color: T.orange,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{
              width: 20, height: 20,
              border: "2px solid #f9731633", borderTopColor: "#f97316",
              borderRadius: "50%", animation: "spin .7s linear infinite",
              margin: "0 auto",
            }} />
            <div style={{ fontSize: 12, color: T.textLow, marginTop: 10 }}>
              Loading notifications…
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && notifications.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>
              All caught up!
            </div>
            <div style={{ fontSize: 12, color: T.textLow }}>
              No notifications yet
            </div>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.map(n => {
          const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
          const actor = n.actor || {};
          const initials = (actor.name || "?")
            .split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 16px", cursor: "pointer",
                background: n.read ? "transparent" : T.orangeMd,
                borderBottom: `1px solid ${T.border}`,
                transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = n.read ? T.bgHover : "#f9731633"}
              onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : T.orangeMd}
            >
              {/* Avatar with type icon badge */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#f97316,#ea6008)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden",
                }}>
                  {actor.photo
                    ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>
                <span style={{
                  position: "absolute", bottom: -2, right: -2,
                  fontSize: 13, background: T.bgCard, borderRadius: "50%",
                  width: 20, height: 20, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  border: `1px solid ${T.border}`,
                }}>
                  {cfg.icon}
                </span>
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
                  width: 8, height: 8, borderRadius: "50%",
                  background: T.orange, flexShrink: 0, marginTop: 6,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
