const T = {
  bg: "#06070d", bgCard: "#0b0d17", border: "#1a1f35",
  orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textLow: "#343c58",
};

const NAV = [
  { id: "dashboard",    icon: "⊞",  label: "Home" },
  { id: "feed",         icon: "📸",  label: "Feed" },
  { id: "network",      icon: "🌐",  label: "Network" },
  { id: "messages",     icon: "💬",  label: "Messages" },
  { id: "profile",      icon: "👤",  label: "Profile" },
  { id: "more",      icon: "☰",  label: "More" },
];

export default function BottomNav({ active, onNav, pendingCount = 0, unreadMessages = 0 }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: T.bgCard,
      borderTop: `1px solid ${T.border}`,
      display: "flex", alignItems: "center",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom)",
      backdropFilter: "blur(20px)",
    }}>
      {NAV.map(item => {
        const isActive = active === item.id;
        const badge = item.id === "network"
          ? pendingCount
          : item.id === "messages"
          ? unreadMessages
          : 0;

        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "10px 0", gap: 3,
              background: "transparent", border: "none",
              cursor: "pointer", position: "relative",
              transition: "all .15s",
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div style={{
                position: "absolute", top: 0, left: "25%", right: "25%",
                height: 2, background: T.orange,
                borderRadius: "0 0 4px 4px",
              }} />
            )}

            {/* Icon */}
            <div style={{ position: "relative" }}>
              <span style={{
                fontSize: 22,
                filter: isActive ? "none" : "grayscale(0.3)",
                opacity: isActive ? 1 : 0.5,
              }}>
                {item.icon}
              </span>
              {badge > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  width: 16, height: 16,
                  background: T.orange, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 800, color: "#fff",
                  border: `2px solid ${T.bgCard}`,
                }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>

            {/* Label */}
            <span style={{
              fontSize: 9, fontWeight: isActive ? 700 : 500,
              color: isActive ? T.orange : T.textLow,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: ".02em",
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
