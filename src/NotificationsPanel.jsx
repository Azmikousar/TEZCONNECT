import { useNotifications } from "./useNotifications";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120",
  border: "#1a1f35", orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
};

const TYPE_CONFIG = {
  new_post:            { icon: "📸", text: "shared a new post" },
  connection_request:  { icon: "🤝", text: "sent you a connection request" },
  connection_accepted: { icon: "✅", text: "accepted your connection request" },
  new_message:         { icon: "💬", text: "sent you a message" },
  new_comment:         { icon: "💭", text: "commented on your post" },
  new_like:            { icon: "❤️", text: "liked your post" },
};

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(session.userId);

  const handleClick = (notif) => {
    if (!notif.read) markAsRead(notif.id);
    if (notif.type === "new_post" || notif.type === "new_comment" || notif.type === "new_like") {
      onNavigate("feed");
    } else if (notif.type === "connection_request" || notif.type === "connection_accepted") {
      onNavigate("network");
    } else if (notif.type === "new_message") {
      onNavigate("messages");
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#0000", zIndex: 500 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: 60, right: 20,
          width: 360, maxWidth: "calc(100vw - 40px)",
          maxHeight: "70vh", overflowY: "auto",
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: 16, boxShadow: "0 20px 60px #000000aa",
          animation: "scaleIn .2s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, background: T.bgCard, zIndex: 1,
        }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>
            Notifications {unreadCount > 0 && <span style={{ color: T.orange }}>({unreadCount})</span>}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{ background: "none", border: "none", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ width: 20, height: 20, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 13, color: T.textLow }}>No notifications yet</div>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || { icon: "🔔", text: "sent you an update" };
            const actor = n.actor || {};
            const initials = (actor.name || "?").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
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
                onMouseEnter={e => e.currentTarget.style.background = n.read ? "#141726" : "#f9731633"}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : T.orangeMd}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,#f97316,#ea6008)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden",
                  position: "relative",
                }}>
                  {actor.photo
                    ? <img src={actor.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                  <span style={{
                    position: "absolute", bottom: -2, right: -2,
                    fontSize: 14, background: T.bgCard, borderRadius: "50%",
                    width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {cfg.icon}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, lineHeight: 1.4 }}>
                    <strong>{actor.name || "Someone"}</strong> {cfg.text}
                  </div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.orange, flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
