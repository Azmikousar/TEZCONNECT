import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

// --- Theme Config ---
const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e",
};

// ... (Include your existing Avatar, timeLabel, dateSep, showSep functions here)

// --- Bottom Navigation Component ---
function BottomNav({ active, setActive }) {
  const items = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "network", icon: "👥", label: "Network" },
    { id: "messages", icon: "💬", label: "Messages" },
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "more", icon: "⋯", label: "More" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: T.bgCard, borderTop: `1px solid ${T.border}`,
      display: "flex", justifyContent: "space-around", padding: "12px 0",
      paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      zIndex: 1000
    }}>
      {items.map(item => (
        <div key={item.id} onClick={() => setActive(item.id)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          color: active === item.id ? T.orange : T.textMid, cursor: "pointer"
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- Main Page Component ---
export default function MessagesPage({ session }) {
  // ... (Keep your existing state logic for contacts, search, etc.)
  
  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "20px 16px 100px 16px" }}>
      
      {/* Messages Header */}
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 24, color: T.text, margin: 0 }}>Messages <span style={{ color: T.orange }}>●</span></h2>
          <div style={{ color: T.textMid, fontSize: 13 }}>Stay connected, grow together.</div>
        </div>
        {/* Top Right Icons */}
        <div style={{ display: "flex", gap: 15, fontSize: 20, color: T.text }}>
          <span>✉️</span>
          <span>🔔</span>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#333", overflow: "hidden" }}>
            <img src={session.avatar_url} alt="Profile" />
          </div>
        </div>
      </div>

      {/* Search and Tabs remains same as your provided code */}
      {/* ... (Insert your Search/Tabs/List code here) ... */}

      {/* Floating Action Button */}
      <div style={{
        position: "fixed", right: 20, bottom: 90,
        width: 56, height: 56, borderRadius: "50%",
        background: T.orange, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.4)",
        cursor: "pointer", zIndex: 900
      }}>+</div>

      {/* Bottom Navigation */}
      <BottomNav active="messages" setActive={() => {}} />
    </div>
  );
}
