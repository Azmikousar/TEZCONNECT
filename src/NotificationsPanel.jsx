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

// --- 2. UI Component ---
const T = { bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35", orange: "#f97316", text: "#eef0f8" };

export default function NotificationsPanel({ session, onClose, onNavigate }) {
  const { notifications, unreadCount, loading, markAsRead } = useNotifications(session?.userId);

  const Panel = (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 9998 }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxHeight: "80vh", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", zIndex: 9999, display: "flex", flexDirection: "column", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ color: T.text, margin: 0 }}>Notifications ({unreadCount})</h3>
          <button onClick={onClose} style={{ background: T.bgInput, color: "white", border: "none", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? <div style={{ padding: 20, color: "white" }}>Loading...</div> : 
            notifications.map((n) => (
              <div key={n.id} onClick={() => { markAsRead(n.id); onNavigate(n.type); }} style={{ padding: "15px 20px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                <strong style={{ color: n.read ? T.text : T.orange }}>{n.actor?.name || "Someone"}</strong>
                <span style={{ color: "white" }}> {n.type === "new_like" ? "liked your post" : "sent an update"}</span>
              </div>
            ))
          }
        </div>
      </div>
    </>
  );

  return createPortal(Panel, document.body);
}
