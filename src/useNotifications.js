import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    console.log("Fetching notifications for:", userId);


    // Step 1 — fetch notifications
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
      
      console.log("Notifications:", notifs, "Error:", notifErr);

    if (!notifs || notifs.length === 0) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Step 2 — fetch actor profiles separately
    const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, photo")
      .in("id", actorIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    // Step 3 — merge
    const merged = notifs.map(n => ({
      ...n,
      actor: profileMap[n.actor_id] || null,
    }));

    setNotifications(merged);
    setUnreadCount(merged.filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const sub = supabase
      .channel("notifications_channel_" + userId)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
