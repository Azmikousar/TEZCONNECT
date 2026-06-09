import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export function useDashboardStats(userId) {
  const [stats, setStats] = useState({
    connections: 0,
    leads: 0,
    events: 0,
    cities: 0,
    testimonials: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      const [
        { count: connections },
        { count: leads },
        { count: events },
        { data: cityData },
        { count: testimonials },
      ] = await Promise.all([
        // Accepted connections
        supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),

        // My leads
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),

        // Events I joined or created
        supabase
          .from("event_rsvps")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),

        // Unique cities from all profiles
        supabase
          .from("profiles")
          .select("location")
          .not("location", "is", null),

        // Testimonials
        supabase
          .from("testimonials")
          .select("*", { count: "exact", head: true }),
      ]);

      // Count unique cities
      const uniqueCities = new Set(
        (cityData || [])
          .map(p => p.location?.split(",").pop()?.trim())
          .filter(Boolean)
      ).size;

      setStats({
        connections: connections || 0,
        leads: leads || 0,
        events: events || 0,
        cities: uniqueCities || 0,
        testimonials: testimonials || 0,
        loading: false,
      });
    }

    fetchStats();
  }, [userId]);

  return stats;
}