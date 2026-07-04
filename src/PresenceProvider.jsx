import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

/*
  PresenceProvider
  -----------------
  Mount this ONCE, at the root of your app, wrapping everything that renders
  after login — NOT inside MessagesPage. That's the actual bug: presence was
  only ever tracked while the Messages tab happened to be open, so "last
  seen"/"online" never reflected the real login session.

  Usage in your App.jsx:

    import { PresenceProvider } from "./PresenceProvider";

    function App() {
      const [session, setSession] = useState(null); // however you already track login

      return (
        <PresenceProvider session={session}>
          {session ? <YourAuthenticatedApp /> : <LoginScreen />}
        </PresenceProvider>
      );
    }

  Then anywhere you need online status (MessagesPage, ContactRow, profile
  screen, etc.) just do:

    import { usePresence } from "./PresenceProvider";
    const { isOnline } = usePresence();
    isOnline(someUserId) // true/false, live
*/

const PresenceContext = createContext({ onlineIds: new Set(), isOnline: () => false });

export function PresenceProvider({ session, children }) {
  const [onlineIds, setOnlineIds] = useState(new Set());
  const heartbeatRef = useRef(null);

  useEffect(() => {
    if (!session?.userId) return; // not logged in yet — nothing to track

    const ch = supabase.channel("global_presence", {
      config: { presence: { key: session.userId } },
    });

    const goOnline = async () => {
      await supabase.from("profiles").update({ is_online: true }).eq("id", session.userId);
    };
    const goOffline = () => {
      supabase.from("profiles").update({ is_online: false, last_seen: new Date().toISOString() }).eq("id", session.userId);
    };

    ch.on("presence", { event: "sync" }, () => {
        setOnlineIds(new Set(Object.keys(ch.presenceState())));
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setOnlineIds(prev => new Set(prev).add(key));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineIds(prev => { const s = new Set(prev); s.delete(key); return s; });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await ch.track({ online_at: new Date().toISOString() });
          await goOnline();
        }
      });

    // Heartbeat: refresh last_seen every 30s while online. This means if the
    // app/tab is killed WITHOUT a clean disconnect (phone home button, OS
    // kills a backgrounded browser tab, crash), last_seen is never more than
    // ~30s stale instead of frozen at whenever they first logged in.
    heartbeatRef.current = setInterval(() => {
      supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", session.userId);
    }, 30000);

    // Tab/app closed or refreshed
    window.addEventListener("beforeunload", goOffline);

    // Backgrounded (switched apps, minimized, switched browser tabs) — this
    // is what makes "online" behave like WhatsApp instead of staying stuck
    // "online" forever after someone leaves the app open in the background.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        goOffline();
      } else {
        goOnline();
        ch.track({ online_at: new Date().toISOString() });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(heartbeatRef.current);
      goOffline(); // covers logout / component unmount too
      ch.untrack();
      supabase.removeChannel(ch);
      window.removeEventListener("beforeunload", goOffline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session?.userId]);

  const isOnline = (id) => onlineIds.has(id);

  return (
    <PresenceContext.Provider value={{ onlineIds, isOnline }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
