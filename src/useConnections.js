import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(name, photo)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        console.error("useNotifications error:", error);
        return;
      }
      setNotifications(data || []);
    } catch (err) {
      console.error("useNotifications catch:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Live updates — new notifications (a connection request, a like, a
  // message, etc.) appear immediately without the user needing to reopen
  // the panel or refresh the page.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => { fetchNotifications(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    // Optimistic — flip it locally right away, then persist.
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    if (error) {
      console.error("markAsRead error:", error);
      fetchNotifications(); // roll back to real state on failure
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      console.error("markAllAsRead error:", error);
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
