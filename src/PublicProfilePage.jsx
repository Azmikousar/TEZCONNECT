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
    <span style={{ display: "inline-flex", alignItems: "center", background: color + "18", border: `1px solid ${color}33`, color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

export default function PublicProfilePage({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (!username) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase())
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setProfile(data); }
        setLoading(false);
      });
  }, [username]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ width: 28, height: 28, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <span style={{ color: T.textMid, fontSize: 14 }}>Loading profile…</span>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: 64 }}>🔍</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: T.text }}>Profile Not Found</div>
      <div style={{ color: T.textMid, fontSize: 14 }}>No profile found for @{username}</div>
      <a href="/" style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
        Go to TezConnect
      </a>
    </div>
  );

  const initials = (profile.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#080a15", borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(145deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Tez<span style={{ color: T.orange }}>Connect</span></span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={copyLink}
            style={{ background: copied ? T.successLo : T.bgCard, border: `1px solid ${copied ? T.success + "44" : T.border}`, borderRadius: 8, padding: "7px 14px", color: copied ? T.success : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}
          >
            {copied ? "✓ Copied!" : "🔗 Share Profile"}
          </button>
          <a href="/"
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
            Join TezConnect
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>

        {/* Cover + Avatar */}
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 0, border: `1px solid ${T.border}` }}>
          <div style={{ height: 180, background: profile.cover ? `url(${profile.cover}) center/cover` : "linear-gradient(135deg,#0d1020,#1a0a05)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%,#f9731618,transparent 60%)" }} />
          </div>
          <div style={{ background: T.bgCard, padding: "0 28px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, transform: "translateY(-44px)", marginBottom: -20 }}>
              <div style={{ width: 88, height: 88, borderRadius: "50%", border: `3px solid ${T.bgCard}`, overflow: "hidden", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 8px 24px #00000066" }}>
                {profile.photo ? <img src={profile.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em" }}>{profile.name}</div>
            {profile.designation && <div style={{ fontSize: 14, color: T.orange, fontWeight: 600, marginTop: 3 }}>{profile.designation}</div>}
            {profile.company && <div style={{ fontSize: 13, color: T.textMid, marginTop: 2 }}>{profile.company}{profile.industry ? " · " + profile.industry : ""}</div>}
            {profile.location && <div style={{ fontSize: 12, color: T.textLow, marginTop: 6 }}>📍 {profile.location}</div>}

            {/* Share + WhatsApp CTA */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              {profile.whatsapp && (
                <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: "#25d36618", border: "1px solid #25d36633", borderRadius: 9, padding: "9px 18px", color: "#25d366", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  💬 WhatsApp
                </a>
              )}
              {profile.linkedin && (
                <a href={profile.linkedin.startsWith("http") ? profile.linkedin : "https://" + profile.linkedin} target="_blank" rel="noopener noreferrer"
                  style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 18px", color: T.textMid, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  🔗 LinkedIn
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`}
                  style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 18px", color: T.textMid, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  ✉ Email
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px", marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>About</div>
            <p style={{ fontSize: 14, color: "#c8cce0", lineHeight: 1.8 }}>{profile.bio}</p>
          </div>
        )}

        {/* Skills + Services */}
        {(profile.skills?.length > 0 || profile.services?.length > 0) && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "24px", marginTop: 16, display: "flex", flexDirection: "column", gap: 20 }}>
            {profile.skills?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.skills.map(s => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
            )}
            {profile.services?.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Services</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {profile.services.map(s => <Tag key={s} color={T.info}>{s}</Tag>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 16, padding: "28px", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>
            Connect with {profile.name?.split(" ")[0]} on TezConnect ⚡
          </div>
          <div style={{ color: T.textMid, fontSize: 13, marginBottom: 20, lineHeight: 1.7 }}>
            Join India's B2B Professional Network to connect, collaborate, and grow.
          </div>
          <a href="/"
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block", boxShadow: "0 4px 20px #f9731440" }}>
            Join Free on TezConnect →
          </a>
        </div>
      </div>
    </div>
  );
}
