const T = {
  bgCard: "#0b0d17", border: "#1a1f35",
  orange: "#f97316", text: "#eef0f8", textMid: "#6b7594",
  success: "#22c55e",
};

export default function MobileTopBar({
  title, session, profile, onNotifications,
  notifUnread = 0, onMore, showBack, onBack,
}) {
  const initials = (session?.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#06070dee",
      backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
      padding: "10px 16px",
      display: "flex", alignItems: "center", gap: 12,
      paddingTop: "calc(10px + env(safe-area-inset-top))",
    }}>
      {/* Left — back or logo */}
      {showBack ? (
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: T.text, fontSize: 20, cursor: "pointer", padding: 0 }}
        >
          ←
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(145deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            ⚡
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: T.text, letterSpacing: "-.03em" }}>
            Tez<span style={{ color: T.orange }}>Connect</span>
          </span>
        </div>
      )}

      {/* Title */}
      <div style={{ flex: 1, fontWeight: 700, fontSize: 15, color: T.text }}>
        {showBack ? title : ""}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notification bell */}
        <button
          onClick={onNotifications}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0, position: "relative" }}
        >
          🔔
          {notifUnread > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              width: 16, height: 16,
              background: T.orange, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 800, color: "#fff",
              border: `2px solid #06070d`,
            }}>
              {notifUnread > 9 ? "9+" : notifUnread}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg,#f97316,#ea6008)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800, color: "#fff",
          overflow: "hidden", flexShrink: 0,
          border: `2px solid ${T.orange}44`,
        }}>
          {profile?.photo
            ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
      </div>
    </div>
  );
}
