const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  error: "#f87171", errorLo: "#f8717112",
};

const MORE_NAV = [
  { id: "services",     icon: "🚀", label: "Our Services" },
  { id: "leads",        icon: "🎯", label: "Leads" },
  { id: "events",       icon: "📅", label: "Events" },
  { id: "testimonials", icon: "🎬", label: "Testimonials" },
  { id: "settings",     icon: "⚙",  label: "Settings" },
  { id: "analytics", icon: "📊", label: "Lead Analytics" },
{ id: "refer",     icon: "🎁", label: "Refer & Earn" },
{ id: "wallet",    icon: "💳", label: "Wallet" },

  

];

export default function MobileMoreMenu({ onNav, onLogout, onClose, session, profile,onShare }) {
  const initials = (session?.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 200 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: T.bgCard,
          borderTop: `1px solid ${T.border}`,
          borderRadius: "20px 20px 0 0",
          padding: "8px 0 32px",
          animation: "slideUp .25s ease",
        }}
      > {/* Header container for back button and handle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: T.text, fontSize: 22, cursor: "pointer", padding: 0, marginRight: 4 }}
          >
            ←
          </button>
        </div>
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "8px auto 20px" }} />

        {/* User info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px 16px", borderBottom: `1px solid ${T.border}`, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff", overflow: "hidden",
          }}>
            {profile?.photo
              ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{session?.name}</div>
            <div style={{ fontSize: 11, color: T.textLow }}>{session?.email}</div>
          </div>
        </div>

        {/* Nav items */}
        {MORE_NAV.map(item => (
          <button
            key={item.id}
            onClick={() => {
    if (item.id === "share") {
      onClose();
      // trigger share from parent
      onShare?.();
      return;
    }
    onNav(item.id);
    onClose();
  }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", background: "none", border: "none",
              color: T.text, fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        {/* Share app */}
<div style={{ margin: "0 20px", paddingTop: 8 }}>
  <button
    onClick={() => { onShare(); onClose(); }}
    style={{
      width: "100%",
      background: "linear-gradient(135deg,#f97316,#ea6008)",
      border: "none", borderRadius: 12, padding: "14px 0",
      color: "#fff", fontSize: 15, fontWeight: 700,
      cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      boxShadow: "0 4px 20px #f9731440",
    }}
  >
    <span style={{ fontSize: 20 }}>📤</span>
    Share TezConnect
  </button>
</div>



        {/* Sign out */}
        <div style={{ margin: "8px 20px 0", paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "14px 0", background: "none", border: "none",
              color: T.error, fontSize: 15, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 22, width: 30, textAlign: "center" }}>⏏</span>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
