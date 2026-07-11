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

  DEBUG LOGGING ADDED IN THIS VERSION
  ------------------------------------
  Every step of startCall() now logs to console with a "[TezConnect Call]"
  prefix, so you can see exactly where the flow stops if calls "do nothing".
  Remove these console.log lines once calls are confirmed working.
*/

const T = {
  bg: "#06070d", success: "#22c55e", error: "#f87171",
};

const RINGTONE_URL = "/ringtone.mp3"; // place a ringtone file at public/ringtone.mp3 (or update this path)

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

/* ─── CALL SCREEN ─── */
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
  const ringtoneRef = useRef();

  const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

  const sendSignal = async (type, data) => {
    console.log("[TezConnect Call] sendSignal:", type, { from: session.userId, to: contact.id });
    const { error } = await supabase.from("webrtc_signals").insert({ from_user: session.userId, to_user: contact.id, type, data });
    if (error) console.error("[TezConnect Call] sendSignal FAILED:", type, error);
  };

  const getMedia = async () => {
    console.log("[TezConnect Call] requesting media, callType =", callType);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[TezConnect Call] navigator.mediaDevices.getUserMedia is unavailable — this usually means the page is not served over HTTPS (or localhost). Camera/mic access requires a secure origin.");
      return null;
    }
    const constraints = callType === "video" ? { video: true, audio: true } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints).catch((e) => { console.error("[TezConnect Call] getUserMedia failed:", e); return null; });
    if (!stream) return null;
    console.log("[TezConnect Call] got media stream successfully");
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
      console.log("[TezConnect Call] connection state:", pc.connectionState);
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

  const stopRingtone = () => {
    ringtoneRef.current?.pause();
    ringtoneRef.current = null;
  };

  const startCallFlow = async () => {
    console.log("[TezConnect Call] startCallFlow() — outgoing call");
    const stream = await getMedia();
    if (!stream) {
      console.error("[TezConnect Call] no media stream — aborting call");
      alert("Could not access camera/microphone. Check browser permissions and that the site is loaded over HTTPS.");
      onEnd();
      return;
    }
    const pc = await createPC(stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendSignal("call-request", { callType, offer });
    setCallState("calling");
    console.log("[TezConnect Call] call-request sent, waiting for answer…");
  };

  const acceptCall = async () => {
    stopRingtone();
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
    stopRingtone();
    await sendSignal("hang-up", {});
    cleanup();
    onEnd();
  };

  const declineCall = async () => {
    stopRingtone();
    await sendSignal("hang-up", {});
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    stopRingtone();
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    if (chanRef.current) supabase.removeChannel(chanRef.current);
  };

  useEffect(() => {
    if (callState === "incoming") {
      const audio = new Audio(RINGTONE_URL);
      audio.loop = true;
      audio.play().catch(e => console.warn("Ringtone autoplay blocked by browser:", e));
      ringtoneRef.current = audio;
    }
    return () => { ringtoneRef.current?.pause(); ringtoneRef.current = null; };
  }, [callState]);

  useEffect(() => {
    console.log("[TezConnect Call] CallScreen mounted, isIncoming =", isIncoming);
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
      .subscribe((status) => {
        console.log("[TezConnect Call] webrtc channel status:", status);
      });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDur = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const isVideo = callType === "video";
  const showRemoteVideo = isVideo && callState === "connected";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999999, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          display: showRemoteVideo ? "block" : "none",
        }}
      />

      {!showRemoteVideo && (
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
        console.log("[TezConnect Call] incoming signal received:", sig.type, "from", sig.from_user);
        if (sig.type !== "call-request") return;
        if (activeCallRef.current) {
          console.log("[TezConnect Call] already on a call — ignoring incoming call-request");
          return;
        }

        setActiveCall("pending");
        const { data: p } = await supabase.from("profiles").select("*").eq("id", sig.from_user).single();
        const caller = p || { id: sig.from_user, name: "Unknown" };
        setActiveCall(prev => (prev && prev !== "pending") ? prev : {
          contact: caller, callType: sig.data.callType, isIncoming: true, incomingOffer: sig.data.offer,
        });
      })
      .subscribe((status) => {
        console.log("[TezConnect Call] signals channel status:", status, "for user", session.userId);
      });

    return () => { if (signalChanRef.current) supabase.removeChannel(signalChanRef.current); };
  }, [session?.userId]);

  const startCall = useCallback((contact, callType) => {
    console.log("[TezConnect Call] CallProvider.startCall() invoked", { contact, callType, currentActiveCall: activeCallRef.current });
    if (activeCallRef.current && activeCallRef.current !== "pending") {
      console.warn("[TezConnect Call] BLOCKED — activeCallRef is already set to a non-null, non-pending value. This means a previous call didn't clean up properly. Reloading the page will reset this.", activeCallRef.current);
      return;
    }
    console.log("[TezConnect Call] setting activeCall — CallScreen should now render");
    setActiveCall({ contact, callType, isIncoming: false });
  }, []);

  const endCall = useCallback(() => {
    console.log("[TezConnect Call] endCall() — clearing activeCall");
    setActiveCall(null);
  }, []);

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
