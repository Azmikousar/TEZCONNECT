import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", text: "#eef0f8",
  textMid: "#6b7594", textLow: "#343c58",
  error: "#f87171", errorLo: "#f8717112",
};

export default function SentRequestsPanel({ pendingSent, removeConnection }) {
  const [receivers, setReceivers] = useState({});

  useEffect(() => {
    if (!pendingSent.length) return;
    const ids = pendingSent.map(c => c.receiver_id);
    supabase
      .from("profiles")
      .select("id, name, photo, designation, company")
      .in("id", ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => { map[p.id] = p; });
        setReceivers(map);
      });
  }, [pendingSent]);

  if (!pendingSent.length) return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📤</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>
        No sent requests
      </div>
      <div style={{ fontSize: 12, color: T.textLow }}>
        Requests you send will appear here until accepted or rejected
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pendingSent.map(conn => {
        const receiver = receivers[conn.receiver_id];
        if (!receiver) return null;
        const initials = (receiver.name || "?")
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
              {receiver.photo
                ? <img src={receiver.photo} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
                {receiver.name}
              </div>
              {receiver.designation && (
                <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>
                  {receiver.designation}
                </div>
              )}
              {receiver.company && (
                <div style={{ fontSize: 11, color: T.textMid }}>
                  {receiver.company}
                </div>
              )}
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>
                ⏳ Pending · Sent {new Date(conn.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </div>
            </div>

            {/* Withdraw */}
            <button
              onClick={() => removeConnection(conn.id)}
              style={{
                background: T.errorLo, border: `1px solid ${T.error}44`,
                borderRadius: 8, padding: "8px 14px",
                color: T.error, fontSize: 12, fontWeight: 700,
                cursor: "pointer", flexShrink: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Withdraw
            </button>
          </div>
        );
      })}
    </div>
  );
}