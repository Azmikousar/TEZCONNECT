import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", info: "#38bdf8", amber: "#fbbf24",
};

function Tag({ children, color = T.orange }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: color + "18", border: `1px solid ${color}33`,
      color, borderRadius: 20, padding: "4px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export default function UserProfileModal({ userId, session, onClose, connectionProps }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState("about");
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data || null);
        setLoading(false);
      });
  }, [userId]);

  const shareProfile = () => {
    const url = profile?.username
      ? `${window.location.origin}/u/${profile.username}`
      : `${window.location.origin}/?user=${userId}`;
    if (navigator.share) {
      navigator.share({ title: profile?.name + " on TezConnect", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isMe = userId === session?.userId;
  const initials = (profile?.name || "?")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const tabs = [
    ["about",    "About"],
    ["business", "Business"],
    ["contact",  "Contact"],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#000d",
        zIndex: 600, display: "flex", alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bg, width: "100%", maxWidth: 600,
          maxHeight: "92vh", borderRadius: "20px 20px 0 0",
          overflow: "hidden", display: "flex", flexDirection: "column",
          animation: "slideUp .3s ease",
        }}
      >
        {/* Handle */}
        <div style={{ padding: "10px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
          <button
            onClick={onClose}
            style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: "50%", width: 32, height: 32, color: T.textMid,
              fontSize: 16, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
              <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
              <span style={{ color: T.textMid, fontSize: 13 }}>Loading profile…</span>
            </div>
          ) : !profile ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Profile not found</div>
            </div>
          ) : (
            <>
              {/* Cover */}
              <div style={{
                height: 120, margin: "0 16px", borderRadius: 16,
                background: profile.cover
                  ? `url(${profile.cover}) center/cover`
                  : "linear-gradient(135deg,#0d1020,#1a0a05)",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%,#f9731618,transparent 60%)" }} />
              </div>

              {/* Avatar + name */}
              <div style={{ padding: "0 20px", transform: "translateY(-36px)", marginBottom: -10 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `3px solid ${T.bg}`,
                  background: "linear-gradient(135deg,#f97316,#ea6008)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, fontWeight: 800, color: "#fff",
                  overflow: "hidden", boxShadow: "0 8px 24px #00000066",
                }}>
                  {profile.photo
                    ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-.02em" }}>
                    {profile.name}
                    {isMe && <span style={{ fontSize: 11, color: T.orange, fontWeight: 700, marginLeft: 8 }}>You</span>}
                  </div>
                  {profile.designation && (
                    <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginTop: 2 }}>
                      {profile.designation}
                    </div>
                  )}
                  {profile.company && (
                    <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>
                      {profile.company}{profile.industry ? " · " + profile.industry : ""}
                    </div>
                  )}
                  {profile.location && (
                    <div style={{ fontSize: 12, color: T.textLow, marginTop: 4 }}>
                      📍 {profile.location}
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
                  {[
                    [profile.skills?.length || 0, "Skills"],
                    [profile.services?.length || 0, "Services"],
                    [profile.certifications?.length || 0, "Certs"],
                  ].map(([v, l]) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: T.orange }}>{v}</div>
                      <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                {!isMe && (
                  <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                    {/* Connect button */}
                    {connectionProps && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        {(() => {
                          const { status, connection, isSender } = connectionProps.getStatus(userId);
                          if (status === "none") return (
                            <button
                              onClick={() => connectionProps.sendRequest(userId)}
                              style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "10px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                            >
                              🤝 Connect
                            </button>
                          );
                          if (status === "pending" && isSender) return (
                            <button
                              onClick={() => connectionProps.removeConnection(connection.id)}
                              style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                            >
                              ⏳ Requested
                            </button>
                          );
                          if (status === "pending" && !isSender) return (
                            <button
                              onClick={() => connectionProps.acceptRequest(connection.id)}
                              style={{ width: "100%", background: T.successLo || "#22c55e12", border: `1px solid ${T.success}44`, borderRadius: 10, padding: "10px", color: T.success, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                            >
                              ✓ Accept Request
                            </button>
                          );
                          if (status === "accepted") return (
                            <button
                              style={{ width: "100%", background: "#22c55e12", border: "1px solid #22c55e44", borderRadius: 10, padding: "10px", color: "#22c55e", fontSize: 13, fontWeight: 700, cursor: "default", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                            >
                              ✓ Connected
                            </button>
                          );
                          return null;
                        })()}
                      </div>
                    )}

                    {/* WhatsApp */}
                    {profile.whatsapp && (
                      <a
                        href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, minWidth: 100, background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "10px", color: "#25d366", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
                      >
                        💬 WhatsApp
                      </a>
                    )}

                    {/* Share */}
                    <button
                      onClick={shareProfile}
                      style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", color: copied ? T.success : T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                    >
                      {copied ? "✓" : "↗️"}
                    </button>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4, padding: "8px 16px 0", borderBottom: `1px solid ${T.border}`, marginTop: 16 }}>
                {tabs.map(([id, lbl]) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      background: "none", border: "none",
                      borderBottom: `2px solid ${tab === id ? T.orange : "transparent"}`,
                      color: tab === id ? T.text : T.textMid,
                      fontWeight: tab === id ? 700 : 500,
                      fontSize: 13, padding: "10px 16px",
                      cursor: "pointer", whiteSpace: "nowrap",
                      transition: "all .2s",
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: "20px 20px 40px" }}>
                {tab === "about" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {profile.bio && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Bio</div>
                        <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.8 }}>{profile.bio}</p>
                      </div>
                    )}
                    {profile.skills?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Skills</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {profile.skills.map(s => <Tag key={s}>{s}</Tag>)}
                        </div>
                      </div>
                    )}
                    {profile.services?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Services</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {profile.services.map(s => <Tag key={s} color={T.info}>{s}</Tag>)}
                        </div>
                      </div>
                    )}
                    {profile.achievements?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Achievements</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {profile.achievements.map((a, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, background: T.bgCard, borderRadius: 10, padding: "10px 14px" }}>
                              <span style={{ color: T.amber, fontSize: 14, flexShrink: 0 }}>🏆</span>
                              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>{a}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "business" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {[
                      ["Company",    profile.company],
                      ["Industry",   profile.industry],
                      ["Category",   profile.category],
                      ["Experience", profile.experience],
                      ["Team Size",  profile.teamSize || profile.team_size],
                      ["Website",    profile.website],
                    ].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ width: 100, fontSize: 11, color: T.textLow, fontWeight: 600, flexShrink: 0 }}>{l}</div>
                        <div style={{ fontSize: 13, color: T.text }}>
                          {l === "Website"
                            ? <a href={v.startsWith("http") ? v : "https://" + v} target="_blank" rel="noopener noreferrer" style={{ color: T.orange }}>{v}</a>
                            : v
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "contact" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {profile.mobile && (
                      <a href={`tel:${profile.mobile}`} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", textDecoration: "none" }}>
                        <span style={{ fontSize: 18 }}>📱</span>
                        <div>
                          <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>Mobile</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{profile.mobile}</div>
                        </div>
                      </a>
                    )}
                    {profile.whatsapp && (
                      <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: "#25d36612", border: "1px solid #25d36633", borderRadius: 10, padding: "12px 14px", textDecoration: "none" }}>
                        <span style={{ fontSize: 18 }}>💬</span>
                        <div>
                          <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>WhatsApp</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#25d366" }}>{profile.whatsapp}</div>
                        </div>
                      </a>
                    )}
                    {profile.email && (
                      <a href={`mailto:${profile.email}`} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", textDecoration: "none" }}>
                        <span style={{ fontSize: 18 }}>✉️</span>
                        <div>
                          <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>Email</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.orange }}>{profile.email}</div>
                        </div>
                      </a>
                    )}
                    {profile.linkedin && (
                      <a href={profile.linkedin.startsWith("http") ? profile.linkedin : "https://" + profile.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", textDecoration: "none" }}>
                        <span style={{ fontSize: 18 }}>🔗</span>
                        <div>
                          <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>LinkedIn</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{profile.linkedin}</div>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
