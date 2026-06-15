import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120",
  border: "#1a1f35", orange: "#f97316", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12", error: "#f87171", errorLo: "#f8717112",
};

// --- Helper Components ---
function Section({ title, desc, children }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{title}</div>
        {desc && <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>{desc}</div>}
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

// --- Main Settings Component ---
export default function SettingsPage({ session, profile, onSaveProfile, onLogout }) {
  const [active, setActive] = useState("account");

  const sections = [
    { id: "account", icon: "👤", label: "Account" },
    { id: "username", icon: "🔗", label: "Public URL" },
    { id: "notifications_history", icon: "🔔", label: "Notifications" },
    { id: "password", icon: "🔒", label: "Password" },
    { id: "privacy", icon: "🔐", label: "Privacy" },
    { id: "danger", icon: "⚠️", label: "Danger" },
  ];

  return (
    <div className="settings-layout" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      
      {/* Sidebar Nav */}
      <div className="nav-sidebar" style={{ width: 200, flexShrink: 0, position: "sticky", top: 90, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>⚙ Settings</div>
        </div>
        <nav className="nav-buttons" style={{ padding: "8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setActive(s.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, textAlign: "left",
              background: active === s.id ? T.orangeMd : "transparent",
              color: active === s.id ? T.orange : (s.id === "danger" ? T.error : T.textMid),
              fontWeight: active === s.id ? 700 : 500, fontSize: 13, border: "none", cursor: "pointer", transition: "all .18s"
            }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        {active === "account" && <Section title="👤 Account Info"><div>Email: {session.email}</div></Section>}
        {active === "notifications_history" && <NotificationsHistorySection session={session} />}
        {/* Add other sections here similarly */}
      </div>
    </div>
  );
}

// --- Notification History Logic ---
function NotificationsHistorySection({ session }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", session.userId).limit(20);
      setNotifs(data || []);
      setLoading(false);
    }
    load();
  }, [session.userId]);

  return (
    <Section title="🔔 Notifications" desc="Your recent activity">
      {loading ? "Loading..." : notifs.map(n => (
        <div key={n.id} style={{ padding: "12px", borderBottom: `1px solid ${T.border}` }}>
          {n.type}
        </div>
      ))}
    </Section>
  );
}
