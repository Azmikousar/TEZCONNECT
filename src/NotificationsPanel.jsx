import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

// --- 1. Hook Logic ---
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data: notifs, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); setLoading(false); return; }

    const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, photo").in("id", actorIds);
    const profileMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

    const merged = notifs.map(n => ({ ...n, actor: profileMap[n.actor_id] }));
    setNotifications(merged);
    setUnreadCount(merged.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  return { notifications, unreadCount, loading, markAsRead };
}

// --- 2. Modern UI Component ---
const T = { bg: "#09090b", surface: "#18181b", border: "#27272a", primary: "#f97316", text: "#fafafa", textMuted: "#a1a1aa" };

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications(session?.userId);

  const Panel = (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000060", backdropFilter: "blur(4px)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, maxHeight: "85vh", 
        background: T.bg, borderTop: `1px solid ${T.border}`, borderRadius: "24px 24px 0 0",
        zIndex: 9999, display: "flex", flexDirection: "column", maxWidth: 500, margin: "0 auto",
        boxShadow: "0 -20px 40px -10px rgba(0,0,0,0.5)", padding: "20px"
      }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: T.text, fontSize: 20, margin: 0 }}>Notifications {unreadCount > 0 && <span style={{ color: T.primary }}>· {unreadCount}</span>}</h2>
          <button onClick={onClose} style={{ background: T.surface, border: "none", color: T.textMuted, width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? <p style={{ color: T.textMuted, textAlign: "center" }}>Loading...</p> : 
            notifications.map((n) => (
              <div key={n.id} onClick={() => { markAsRead(n.id); onNavigate(n.type); }} style={{ 
                padding: "16px", background: n.read ? "transparent" : T.surface,
                borderRadius: 12, border: `1px solid ${n.read ? 'transparent' : T.border}`,
                cursor: "pointer", display: "flex", gap: 12, alignItems: "center"
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "transparent" : T.primary }} />
                <p style={{ margin: 0, fontSize: 14, color: T.text }}><strong style={{ color: T.primary }}>{n.actor?.name}</strong> {n.type === "new_like" ? "liked your post" : "sent an update"}</p>
              </div>
            ))
          }
        </div>
      </div>
    </>
  );

  return createPortal(Panel, document.body);
}
