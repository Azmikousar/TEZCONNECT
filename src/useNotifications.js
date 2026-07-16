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

  /* sendRequest — two layers of defense against the duplicate-key bug:

     1) Check local `connections` state first (fast path) and revive an
        existing row instead of inserting, same as before.

     2) If that check somehow misses it — local state can be stale right
        after a page load, a race with another tab, etc. — the insert below
        will still hit Postgres's unique constraint (error code 23505).
        Instead of surfacing that raw error to the user, we now catch that
        specific case, fetch the real conflicting row straight from the
        database, and revive IT. This is what was still failing for
        "regular user" pages even after the first fix: local state being
        out of sync doesn't matter anymore, because this fallback always
        checks the database directly rather than trusting the cache. */
  const sendRequest = useCallback(async (receiverId) => {
    // Free tier: max 2 accepted connections total
    if (!isPremium && accepted.length >= 2) {
      return { error: "LIMIT_REACHED" };
    }

    const existing = connections.find(c =>
      (c.sender_id === userId && c.receiver_id === receiverId) ||
      (c.sender_id === receiverId && c.receiver_id === userId)
    );

    const reviveRow = async (rowId) => {
      const { error } = await supabase
        .from("connections")
        .update({
          sender_id: userId,
          receiver_id: receiverId,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowId);
      if (error) {
        console.error("sendRequest (revive) error:", error);
        return { error: error.message };
      }
      fetchConnections();
      return { error: null };
    };

    if (existing) {
      if (existing.status === "accepted" || existing.status === "pending") {
        return { error: null }; // already connected or already waiting — no-op
      }
      return reviveRow(existing.id);
    }

    const { error } = await supabase
      .from("connections")
      .insert({ sender_id: userId, receiver_id: receiverId, status: "pending" });

    if (!error) {
      fetchConnections();
      return { error: null };
    }

    // Postgres unique_violation — local state didn't know about a row that
    // the database actually has. Go find it directly and revive it instead
    // of failing.
    if (error.code === "23505") {
      const { data: conflictRows, error: lookupErr } = await supabase
        .from("connections")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
        .limit(1);
      if (lookupErr || !conflictRows?.length) {
        console.error("sendRequest conflict lookup failed:", lookupErr);
        return { error: error.message };
      }
      const conflictRow = conflictRows[0];
      if (conflictRow.status === "accepted" || conflictRow.status === "pending") {
        fetchConnections();
        return { error: null };
      }
      return reviveRow(conflictRow.id);
    }

    console.error("sendRequest error:", error);
    return { error: error.message };
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
