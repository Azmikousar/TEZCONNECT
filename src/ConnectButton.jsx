import { useState } from "react";

const T = {
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  border: "#1a1f35", textMid: "#6b7594", error: "#f87171",
  errorLo: "#f8717112", success: "#22c55e", successLo: "#22c55e12",
  bgInput: "#0f1120", text: "#eef0f8",
};

export default function ConnectButton({ userId, targetId, getStatus, sendRequest, acceptRequest, rejectRequest, removeConnection }) {
  const [loading, setLoading] = useState(false);

  if (userId === targetId) return null;

  const { status, connection, isSender } = getStatus(targetId);

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === "send")   await sendRequest(targetId);
      if (action === "accept") await acceptRequest(connection.id);
      if (action === "reject") await rejectRequest(connection.id);
      if (action === "remove") await removeConnection(connection.id);
    } finally {
      setLoading(false);
    }
  };

  const btn = (label, action, bg, color, border) => (
    <button
      onClick={() => handle(action)}
      disabled={loading}
      style={{
        flex: 1, background: bg, border,
        borderRadius: 8, padding: "8px 0",
        color, fontSize: 12, fontWeight: 700,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
        transition: "all .2s",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {loading ? "…" : label}
    </button>
  );

  // Not connected
  if (status === "none") return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {btn(
        "🤝 Connect",
        "send",
        "linear-gradient(135deg,#f97316,#ea6008)",
        "#fff",
        "none"
      )}
    </div>
  );

  // Request sent by me — waiting
  if (status === "pending" && isSender) return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <div style={{
        flex: 1, background: T.orangeLo, border: `1px solid ${T.orange}33`,
        borderRadius: 8, padding: "8px 0",
        color: T.orange, fontSize: 12, fontWeight: 700, textAlign: "center",
      }}>
        ⏳ Request Sent
      </div>
      {btn("Withdraw", "remove", T.bgInput, T.textMid, `1px solid ${T.border}`)}
    </div>
  );

  // Request received by me — accept or reject
  if (status === "pending" && !isSender) return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {btn(
        "✓ Accept",
        "accept",
        T.successLo,
        T.success,
        `1px solid ${T.success}44`
      )}
      {btn(
        "✕ Reject",
        "reject",
        T.errorLo,
        T.error,
        `1px solid ${T.error}44`
      )}
    </div>
  );

  // Connected
  if (status === "accepted") return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <div style={{
        flex: 1, background: T.successLo, border: `1px solid ${T.success}44`,
        borderRadius: 8, padding: "8px 0",
        color: T.success, fontSize: 12, fontWeight: 700, textAlign: "center",
      }}>
        ✓ Connected
      </div>
      {btn("Remove", "remove", T.bgInput, T.textMid, `1px solid ${T.border}`)}
    </div>
  );

  // Rejected — allow resend
  if (status === "rejected") return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {btn(
        "🤝 Connect Again",
        "remove",
        "linear-gradient(135deg,#f97316,#ea6008)",
        "#fff",
        "none"
      )}
    </div>
  );

  return null;
}