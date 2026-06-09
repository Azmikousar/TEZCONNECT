import { supabase } from "./supabase";
import { useState, useEffect } from "react";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", text: "#eef0f8",
  textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
};

export default function RequestsPanel({ pendingReceived, acceptRequest, rejectRequest }) {
  const [senders, setSenders] = useState({});

  useEffect(() => {
    if (!pendingReceived.length) return;
    const ids = pendingReceived.map(c => c.sender_id);
    supabase
      .from("profiles")
      .select("id, name, photo, designation, company")
      .in("id", ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => { map[p.id] = p; });
        setSenders(map);
      });
  }, [pendingReceived]);

  if (!pendingReceived.length) return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: "24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>
        No pending requests
      </div>
      <div style={{ fontSize: 12, color: T.textLow }}>
        When someone sends you a connection request it will appear here
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pendingReceived.map(conn => {
        const sender = senders[conn.sender_id];
        if (!sender) return null;
        const initials = (sender.name || "?")
          .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

        return (
          <div key={conn.id} style={{
            background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg,#f97316,#ea6008)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
              overflow: "hidden", flexShrink: 0,
            }}>
              {sender.photo
                ? <img src={sender.photo} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
                {sender.name}
              </div>
              {sender.designation && (
                <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>
                  {sender.designation}
                </div>
              )}
              {sender.company && (
                <div style={{ fontSize: 11, color: T.textMid }}>
                  {sender.company}
                </div>
              )}
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>
                Sent {new Date(conn.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => acceptRequest(conn.id)}
                style={{
                  background: T.successLo, border: `1px solid ${T.success}44`,
                  borderRadius: 8, padding: "8px 14px",
                  color: T.success, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                ✓ Accept
              </button>
              <button
                onClick={() => rejectRequest(conn.id)}
                style={{
                  background: T.errorLo, border: `1px solid ${T.error}44`,
                  borderRadius: 8, padding: "8px 14px",
                  color: T.error, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}