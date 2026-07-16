import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useConnections(userId) {
  const [connections, setConnections] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      if (error) {
        console.error("useConnections error:", error);
        return;
      }
      setConnections(data || []);
    } catch (err) {
      console.error("useConnections catch:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPremiumStatus = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", userId)
      .single();
    if (data) {
      const active = data.is_premium && (!data.premium_expires_at || new Date(data.premium_expires_at) > new Date());
      setIsPremium(!!active);
    }
  }, [userId]);

  useEffect(() => {
    fetchConnections();
    fetchPremiumStatus();
  }, [fetchConnections, fetchPremiumStatus]);

  const getStatus = useCallback((otherUserId) => {
    const conn = connections.find(c =>
      (c.sender_id === userId && c.receiver_id === otherUserId) ||
      (c.sender_id === otherUserId && c.receiver_id === userId)
    );
    if (!conn) return { status: "none", connection: null, isSender: false };
    return {
      status: conn.status,
      connection: conn,
      isSender: conn.sender_id === userId,
    };
  }, [connections, userId]);

  const accepted = connections.filter(c => c.status === "accepted");

  /* sendRequest — previously did a plain insert every time, which is fine
     the very first time two people interact but fails permanently the
     moment a row already exists for that pair: rejectRequest only ever sets
     status to "rejected", it never deletes the row, so the unique
     constraint on (sender_id, receiver_id) blocks every future request
     between those two people forever, for anyone, not just admin.

     Fix: look up any existing row between the two users first (in either
     direction, same as getStatus does) and reuse it — reviving a rejected
     row back to pending instead of trying to insert a duplicate. Only
     inserts a brand-new row when there's truly no history between the two
     users yet. */
  const sendRequest = useCallback(async (receiverId) => {
    // Free tier: max 2 accepted connections total
    if (!isPremium && accepted.length >= 2) {
      return { error: "LIMIT_REACHED" };
    }

    const existing = connections.find(c =>
      (c.sender_id === userId && c.receiver_id === receiverId) ||
      (c.sender_id === receiverId && c.receiver_id === userId)
    );

    if (existing) {
      if (existing.status === "accepted" || existing.status === "pending") {
        // Nothing to do — already connected or already waiting on a
        // response. Not an error, just a no-op.
        return { error: null };
      }
      // Status is "rejected" (or anything else stale) — revive this exact
      // row as a fresh pending request from the current sender, instead of
      // inserting a duplicate that collides with the unique constraint.
      const { error } = await supabase
        .from("connections")
        .update({
          sender_id: userId,
          receiver_id: receiverId,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) {
        console.error("sendRequest (revive) error:", error);
        return { error: error.message };
      }
      fetchConnections();
      return { error: null };
    }

    const { error } = await supabase
      .from("connections")
      .insert({ sender_id: userId, receiver_id: receiverId, status: "pending" });
    if (error) {
      console.error("sendRequest error:", error);
      return { error: error.message };
    }
    fetchConnections();
    return { error: null };
  }, [userId, isPremium, accepted.length, fetchConnections, connections]);

  const acceptRequest = useCallback(async (connectionId) => {
    // Also block accepting if it would push a free user over the limit
    if (!isPremium && accepted.length >= 2) {
      return { error: "LIMIT_REACHED" };
    }
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", connectionId);
    if (error) {
      console.error("acceptRequest error:", error);
      return { error: error.message };
    }
    fetchConnections();
    return { error: null };
  }, [fetchConnections, isPremium, accepted.length]);

  const rejectRequest = useCallback(async (connectionId) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", connectionId);
    if (error) console.error("rejectRequest error:", error);
    else fetchConnections();
  }, [fetchConnections]);

  const removeConnection = useCallback(async (connectionId) => {
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId);
    if (error) console.error("removeConnection error:", error);
    else fetchConnections();
  }, [fetchConnections]);

  const pendingReceived = connections.filter(
    c => c.receiver_id === userId && c.status === "pending"
  );
  const pendingSent = connections.filter(
    c => c.sender_id === userId && c.status === "pending"
  );

  return {
    connections,
    loading,
    isPremium,
    getStatus,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeConnection,
    pendingReceived,
    pendingSent,
    accepted,
    refresh: fetchConnections,
  };
}
