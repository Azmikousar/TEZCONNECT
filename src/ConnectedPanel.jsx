import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", text: "#eef0f8",
  textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  info: "#38bdf8",
};

export default function ConnectedPanel({ accepted, userId, removeConnection }) {
  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    if (!accepted.length) return;
    const ids = accepted.map(c =>
      c.sender_id === userId ? c.receiver_id : c.sender_id
    );
    supabase
      .from("profiles")
      .select("id, name, photo, designation, company, whatsapp, linkedin, location")
      .in("id", ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      });
  }, [accepted, userId]);

  if (!accepted.length) return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>🤝</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>
        No connections yet
      </div>
      <div style={{ fontSize: 12, color: T.textLow }}>
        Accept requests or send one to start building your network
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        background: T.successLo, border: `1px solid ${T.success}33`,
        borderRadius: 10, padding: "10px 16px",
        fontSize: 12, color: T.success, fontWeight: 600,
      }}>
        ✓ {accepted.length} connection{accepted.length !== 1 ? "s" : ""}
      </div>

      {accepted.map(conn => {
        const otherId = conn.sender_id === userId ? conn.receiver_id : conn.sender_id;
        const person = profiles[otherId];
        if (!person) return null;
        const initials = (person.name || "?")
          .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

        return (
          <div key={conn.id} style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg,#f97316,#ea6008)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: "#fff",
              overflow: "hidden", flexShrink: 0,
              boxShadow: "0 4px 12px #00000044",
            }}>
              {person.photo
                ? <img src={person.photo} alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
                {person.name}
              </div>
              {person.designation && (
                <div style={{ fontSize: 11, color: T.orange, fontWeight: 600 }}>
                  {person.designation}
                </div>
              )}
              {person.company && (
                <div style={{ fontSize: 11, color: T.textMid }}>
                  {person.company}
                </div>
              )}
              {person.location && (
                <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>
                  📍 {person.location}
                </div>
              )}
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>
                Connected {new Date(conn.updated_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {person.whatsapp && (
                <a
                  href={`https://wa.me/${person.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    background: "#25d36618", border: "1px solid #25d36633",
                    borderRadius: 8, padding: "8px 12px",
                    color: "#25d366", fontSize: 12, fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  💬
                </a>
              )}
              {person.linkedin && (
                <a
                  href={person.linkedin.startsWith("http")
                    ? person.linkedin : "https://" + person.linkedin}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    background: T.bgInput, border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: "8px 12px",
                    color: T.textMid, fontSize: 12, fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  🔗
                </a>
              )}
              <button
                onClick={() => removeConnection(conn.id)}
                style={{
                  background: T.errorLo, border: `1px solid ${T.error}44`,
                  borderRadius: 8, padding: "8px 12px",
                  color: T.error, fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}