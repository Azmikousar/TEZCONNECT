import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useConnections(userId) {
  const [connections, setConnections] = useState([]);
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

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

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

  const sendRequest = useCallback(async (receiverId) => {
    const { error } = await supabase
      .from("connections")
      .insert({ sender_id: userId, receiver_id: receiverId });
    if (error) console.error("sendRequest error:", error);
    else fetchConnections();
  }, [userId, fetchConnections]);

  const acceptRequest = useCallback(async (connectionId) => {
    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", connectionId);
    if (error) console.error("acceptRequest error:", error);
    else fetchConnections();
  }, [fetchConnections]);

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
  const accepted = connections.filter(c => c.status === "accepted");

  return {
    connections,
    loading,
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