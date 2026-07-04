import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabase";

/*
  PresenceProvider
  -----------------
  Single global presence channel for the whole logged-in session, tied to
  session.userId — NOT to whether the Messages page happens to be open.
  This is what MessagesPage.jsx's `usePresence()` hook expects.

  Two things happen here:

  1) LIVE "ONLINE" STATE
     One shared Supabase Realtime Presence channel ("global_presence") is
     joined once per login. Every logged-in user tracks themselves on it.
     `onlineIds` is a Set of userIds currently present. `isOnline(id)`
     checks membership. Because it's one channel for the whole app, the
     contacts list AND an open chat both read the exact same live state.

  2) ACCURATE last_seen
     Presence "leave" events fire on graceful disconnects (tab closed
     cleanly, logout) but are NOT reliable for crashes, killed apps, phone
     lock, or lost network — those can leave `last_seen` stale indefinitely.
     To fix that we ALSO run a heartbeat that stamps `profiles.last_seen`
     every 25s while the tab is active/visible, stamps immediately on
     login, and stamps on tab hide/close/logout as a fast-path. This means
     `last_seen` is always within ~25s of reality even if presence "leave"
     never fires.

  Requires (Supabase SQL):
    alter table profiles add column if not exists last_seen timestamptz default now();
    create policy "Users can update own last_seen" on profiles
      for update using (auth.uid() = id) with check (auth.uid() = id);
*/

const PresenceContext = createContext({
  onlineIds: new Set(),
  isOnline: () => false,
});

export function usePresence() {
  return useContext(PresenceContext);
}

const HEARTBEAT_MS = 25000;

export function PresenceProvider({ session, children }) {
  const [onlineIds, setOnlineIds] = useState(new Set());
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);

  const stampLastSeen = useCallback(() => {
    if (!session?.userId) return;
    supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", session.userId)
      .then(({ error }) => {
        if (error) console.error("stampLastSeen failed:", error);
      });
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) {
      setOnlineIds(new Set());
      return;
    }

    // Stamp immediately on login so a stale last_seen from a prior
    // ungraceful disconnect gets cleared right away.
    stampLastSeen();

    // ── Global presence channel ──
    const channel = supabase.channel("global_presence", {
      config: { presence: { key: session.userId } },
    });
    channelRef.current = channel;

    const syncOnline = () => {
      const state = channel.presenceState();
      setOnlineIds(new Set(Object.keys(state)));
    };

    channel
      .on("presence", { event: "sync" }, syncOnline)
      .on("presence", { event: "join" }, syncOnline)
      .on("presence", { event: "leave" }, ({ key }) => {
        syncOnline();
        // Best-effort: stamp the leaving user's last_seen if it's us
        // (their own client stamps on unload/hide too, this is a backstop).
        if (key === session.userId) stampLastSeen();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    // ── Heartbeat for last_seen accuracy ──
    heartbeatRef.current = setInterval(() => {
      if (!document.hidden) stampLastSeen();
    }, HEARTBEAT_MS);

    const onVisibilityChange = () => {
      if (document.hidden) stampLastSeen();
    };
    window.addEventListener("beforeunload", stampLastSeen);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stampLastSeen(); // final stamp on unmount/logout
      clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", stampLastSeen);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.userId, stampLastSeen]);

  const isOnline = useCallback((userId) => onlineIds.has(userId), [onlineIds]);

  return (
    <PresenceContext.Provider value={{ onlineIds, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}
