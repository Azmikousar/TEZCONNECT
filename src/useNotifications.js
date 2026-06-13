import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(name, photo)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    const sub = supabase
      .channel("notifications_channel")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: fetchNotifications };
}
