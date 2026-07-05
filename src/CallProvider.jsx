import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabase";

/*
  CallProvider
  ------------
  WHY THIS EXISTS:
  Previously the incoming-call listener (and <CallScreen>) lived inside
  MessagesPage. But MessagesPage only renders while page === "messages" in
  App.jsx — it unmounts completely on every other page. That means the
  moment the callee navigates to Dashboard, Network, Leads, etc., the
  listener for incoming calls is torn down and calls silently never reach
  them.

  FIX: this provider is mounted ONCE at the app root (wrapping everything,
  same level as PresenceProvider), so the webrtc_signals listener — and the
  full-screen CallScreen overlay — exist for the entire life of the logged-in
  session, no matter what page is open.

  Usage:
    // App.jsx
    <PresenceProvider session={session}>
      <CallProvider session={session}>
        <AppShell .../>
      </CallProvider>
    </PresenceProvider>

    // Anywhere that needs to start a call (e.g. MessagesPage / ChatView)
    const { startCall } = useCall();
    startCall(contact, "video"); // or "audio"

  Requires in Supabase:
    - Realtime enabled (INSERT) on the "webrtc_signals" table
    - RLS: INSERT allowed where auth.uid() = from_user
    - RLS: SELECT allowed where auth.uid() = to_user OR auth.uid() = from_user
*/

const T = {
  bg: "#06070d", success: "#22c55e", error: "#f87171",
};

const AVATAR_COLORS = [
  "linear-gradient(135deg,#f97316,#ea6008)",
  "linear-gradient(135deg,#7c3aed,#a78bfa)",
  "linear-gradient(135deg,#0369a1,#38bdf8)",
  "linear-gradient(135deg,#15803d,#22c55e)",
  "linear-gradient(135deg,#be123c,#f43f5e)",
];
const getColor = (name) => AVATAR_COLORS[(name || "A").charCodeAt(0) % AVATAR_COLORS.length];

const CallContext = createContext({ startCall: () => {} });
export function useCall() {
  return useContext(CallContext);
}

/* ─── CALL SCREEN (unchanged logic, moved here from messages.jsx) ─── */
function CallScreen({ contact, session, callType, isIncoming, incomingOffer, onEnd }) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();
  const localStreamRef = useRef();
  const [callState, setCallState] = useState(isIncoming ? "incoming" : "calling");
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef();
  const chanRef = useRef();
  const pendingCandidates = useRef([]);

  const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

  const sendSignal = async (type, data) => {
    const { error } = await supabase.from("webrtc_signals").insert({ from_user: session.userId, to_user: contact.id, type, data });
    if (error) console.error("sendSignal failed:", type, error);
  };

  const getMedia = async () => {
    const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints).catch((e) => { console.error("getUserMedia failed:", e); return null; });
    if (!stream) return null;
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPC = async (stream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    stream?.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.ontrack = e => { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]; };
    pc.onicecandidate = e => { if (e.candidate) sendSignal("ice-candidate", { candidate: e.candidate }); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") hangUp();
    };
    return pc;
  };

  const flushPendingCandidates = async (pc) => {
    for (const c of pendingCandidates.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.error("addIceCandidate failed:", e));
    }
    pendingCandidates.current = [];
  };

  const startCallFlow = async () => {
    const stream = await getMedia();
    if (!stream) { alert("Could not access camera/microphone. Check browser permissions."); onEnd(); return; }
    const pc = await createPC(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal("call-request", { callType, offer });
    setCallState("calling");
  };

  const acceptCall = async () => {
    setCallState("connected");
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    const stream = await getMedia();
    if (!stream) { alert("Could not access camera/microphone. Check browser permissions."); hangUp(); return; }
    const pc = await createPC(stream);
    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
    await flushPendingCandidates(pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal("answer", { answer });
  };

  const hangUp = async () => {
    await sendSignal("hang-up", {});
    cleanup();
    onEnd();
  };

  const declineCall = async () => {
    await sendSignal("hang-up", {});
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (chanRef.current) supabase.removeChannel(chanRef.current);
  };

  useEffect(() => {
    if (!isIncoming) startCallFlow();

    const ch = `webrtc_${[session.userId, contact.id].sort().join("_")}`;
    chanRef.current = supabase.channel(ch)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "webrtc_signals", filter: `to_user=eq.${session.userId}` }, async ({ new: sig }) => {
        if (sig.from_user !== contact.id) return;
        const pc = pcRef.current;
        if (sig.type === "answer" && pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.data.answer));
          await flushPendingCandidates(pc);
          setCallState("connected");
          timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        }
        if (sig.type === "ice-candidate") {
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(sig.data.candidate)).catch(() => {});
          } else {
            pendingCandidates.current.push(sig.data.candidate);
          }
        }
        if (sig.type === "hang-up") { cleanup(); onEnd(); }
      })
      .subscribe();

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDur = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isVideo = callType === "video";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999999, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {isVideo && callState === "connected" ? (
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#0d1545,#06070d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: getColor(contact.name), overflow: "hidden", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: "#fff", border: "3px solid rgba(255,255,255,0.2)" }}>
              {contact.photo ? <img src={contact.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (contact.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 8 }}>{contact.name}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
              {callState === "incoming" ? `Incoming ${isVideo ? "video" : "voice"} call…` :
               callState === "calling" ? "Calling…" :
               fmtDur(duration)}
            </div>
          </div>
        </div>
      )}

      {isVideo && (
        <video ref={localVideoRef} autoPlay playsInline muted style={{ position: "absolute", top: 20, right: 20, width: 100, height: 140, borderRadius: 16, objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", zIndex: 2 }} />
      )}

      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 3 }}>
        {callState === "incoming" ? (
          <>
            <button onClick={declineCall} style={{ width: 70, height: 70, borderRadius: "50%", background: "#f87171", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 20px #f8717166" }}>📵</button>
            <button onClick={acceptCall} style={{ width: 70, height: 70, borderRadius: "50%", background: T.success, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: `0 4px 20px ${T.success}66` }}>📞</button>
          </>
        ) : (
          <>
            <button onClick={() => { setMuted(m => !m); localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = !t.enabled); }}
              style={{ width: 56, height: 56, borderRadius: "50%", background: muted ? "#f87171" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {muted ? "🔇" : "🎤"}
            </button>
            {isVideo && (
              <button onClick={() => { setCamOff(c => !c); localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = !t.enabled); }}
                style={{ width: 56, height: 56, borderRadius: "50%", background: camOff ? "#f87171" : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                {camOff ? "📵" : "📹"}
              </button>
            )}
            <button onClick={hangUp} style={{ width: 70, height: 70, borderRadius: "50%", background: "#f87171", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 20px #f8717166" }}>📵</button>
            <button onClick={() => {}} style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔊</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── PROVIDER ─── */
export function CallProvider({ session, children }) {
  const [activeCall, setActiveCall] = useState(null); // "pending" | { contact, callType, isIncoming, incomingOffer } | null
  const signalChanRef = useRef();
  const activeCallRef = useRef(null);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  useEffect(() => {
    if (!session?.userId) return;

    signalChanRef.current = supabase.channel(`signals_${session.userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "webrtc_signals", filter: `to_user=eq.${session.userId}` }, async ({ new: sig }) => {
        if (sig.type !== "call-request") return;
        if (activeCallRef.current) return; // already on a call — ignore new ones for now

        setActiveCall("pending");
        const { data: p } = await supabase.from("profiles").select("*").eq("id", sig.from_user).single();
        const caller = p || { id: sig.from_user, name: "Unknown" };
        setActiveCall(prev => (prev && prev !== "pending") ? prev : {
          contact: caller, callType: sig.data.callType, isIncoming: true, incomingOffer: sig.data.offer,
        });
      })
      .subscribe();

    return () => { if (signalChanRef.current) supabase.removeChannel(signalChanRef.current); };
  }, [session?.userId]);

  const startCall = useCallback((contact, callType) => {
    if (activeCallRef.current && activeCallRef.current !== "pending") return; // already in a call
    setActiveCall({ contact, callType, isIncoming: false });
  }, []);

  const endCall = useCallback(() => setActiveCall(null), []);

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}
      {activeCall && activeCall !== "pending" && createPortal(
        <CallScreen
          contact={activeCall.contact}
          session={session}
          callType={activeCall.callType}
          isIncoming={activeCall.isIncoming}
          incomingOffer={activeCall.incomingOffer}
          onEnd={endCall}
        />,
        document.body
      )}
    </CallContext.Provider>
  );
}
