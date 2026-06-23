import { useState } from "react";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
};

const MORE_NAV = [
  { id: "marketplace",  icon: "🛍️", label: "Marketplace",    sub: "Buy from members" },
  { id: "myproducts",   icon: "📦", label: "My Listings",     sub: "Sell your products" },
  { id: "tezprints",    icon: "🖨️", label: "Tez Prints",      sub: "Official merchandise" },
  { id: "appstore",     icon: "📱", label: "Tez App Store",   sub: "Premium software" },
  { id: "services",     icon: "🚀", label: "Our Services",    sub: "TezConnect offerings" },
  { id: "leads",        icon: "🎯", label: "Leads",           sub: "Manage your leads" },
  { id: "analytics",    icon: "📊", label: "Lead Analytics",  sub: "Track performance" },
  { id: "events",       icon: "📅", label: "Events",          sub: "Browse & register" },
  { id: "testimonials", icon: "🎬", label: "Testimonials",    sub: "Member stories" },
  { id: "refer",        icon: "🎁", label: "Refer & Earn",    sub: "Invite & get rewards" },
  { id: "wallet",       icon: "💳", label: "Wallet",          sub: "Your balance" },
  { id: "settings",     icon: "⚙️", label: "Settings",        sub: "App preferences" },
];

export default function MobileMoreMenu({ session, profile, onNav, onLogout, onClose, onShare }) {
  const initials = (profile?.name || session?.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "#000000bb", zIndex: 500 }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          height: "88vh",
          background: T.bgCard,
          borderTop: `1px solid ${T.border}`,
          borderRadius: "20px 20px 0 0",
          zIndex: 501,
          display: "flex",
          flexDirection: "column",
          animation: "slideUp .28s ease",
          overflow: "hidden",
        }}
      >
        {/* Top bar with back button */}
        <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: T.bgInput, border: `1px solid ${T.border}`,
                borderRadius: 9, padding: "7px 14px",
                color: T.text, fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              ← Back
            </button>
            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>More</div>
            <div style={{ width: 70 }} />
          </div>

          {/* Handle */}
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        </div>

        {/* User info */}
        <div style={{ flexShrink: 0, padding: "14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
            {profile?.photo
              ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.name || session?.name || "Member"}</div>
            <div style={{ fontSize: 11, color: T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.designation || session?.email || ""}</div>
          </div>
          <button
            onClick={() => { onShare && onShare(); onClose(); }}
            style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 9, padding: "7px 12px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            📤 Share
          </button>
        </div>

        {/* Scrollable nav list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            minHeight: 0,
            padding: "8px 12px",
          }}
        >
          {MORE_NAV.map((item, i) => (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); onClose(); }}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 14,
                background: "transparent",
                border: "none",
                borderBottom: i < MORE_NAV.length - 1 ? `1px solid ${T.border}` : "none",
                padding: "14px 8px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: T.bgInput, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 14, color: T.textLow, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ flexShrink: 0, padding: "12px 16px 32px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
          <button
            onClick={onLogout}
            style={{ flex: 1, background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 12, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            ⏏ Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
