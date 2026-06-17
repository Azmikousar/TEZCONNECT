import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  amber: "#fbbf24", amberLo: "#fbbf2412",
};

const APP_URL = "https://tezconnect.vercel.app";
const POINTS_PER_REFERRAL = 100;
const RUPEES_PER_POINT = 0.1;

export default function ReferEarnPage({ session }) {
  const [profile, setProfile]     = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [wallet, setWallet]       = useState(null);
  const [copied, setCopied]       = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: prof }, { data: refs }, { data: wal }] = await Promise.all([
        supabase.from("profiles").select("id, name, referral_code").eq("id", session.userId).single(),
        supabase.from("referrals").select("*, referred:referred_id(name, photo)").eq("referrer_id", session.userId),
        supabase.from("wallets").select("*").eq("user_id", session.userId).single(),
      ]);
      setProfile(prof);
      setReferrals(refs || []);
      setWallet(wal);
      setLoading(false);
    }
    load();
  }, [session.userId]);

  const referralLink = profile?.referral_code
    ? `${APP_URL}?ref=${profile.referral_code}`
    : `${APP_URL}`;

  const shareText = `🚀 Join me on *TezConnect* — India's B2B Professional Network!\n\nUse my referral link to sign up and get bonus points:\n${referralLink}\n\n*Connect Faster. Grow Smarter.* ⚡`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const completed = referrals.filter(r => r.status === "completed").length;
  const pending   = referrals.filter(r => r.status === "pending").length;
  const points    = completed * POINTS_PER_REFERRAL;
  const earnings  = (points * RUPEES_PER_POINT).toFixed(2);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "24px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎁</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 6 }}>Refer & Earn</div>
        <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 16px" }}>
          Invite friends to TezConnect and earn <strong style={{ color: T.orange }}>{POINTS_PER_REFERRAL} points</strong> for every successful referral. Points convert to real money!
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "6px 16px" }}>
          <span style={{ fontSize: 14 }}>💰</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>₹{RUPEES_PER_POINT} per point · {POINTS_PER_REFERRAL} points per referral</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Referrals",  value: completed, icon: "👥", color: T.orange },
          { label: "Points",     value: points,    icon: "⭐", color: T.amber },
          { label: "Earned",     value: `₹${earnings}`, icon: "💰", color: T.success },
        ].map(s => (
          <div key={s.label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: s.color, letterSpacing: "-.02em" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>🔗 Your Referral Link</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 14 }}>Share this link — earn points when they sign up</div>

        {/* Referral code badge */}
        <div style={{ background: T.bgInput, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Your Code</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.orange, letterSpacing: ".1em", fontFamily: "monospace" }}>
              {profile?.referral_code || "LOADING"}
            </div>
          </div>
          <button
            onClick={copyLink}
            style={{ background: copied ? T.successLo : T.orangeMd, border: `1px solid ${copied ? T.success + "44" : T.orange + "44"}`, borderRadius: 8, padding: "8px 14px", color: copied ? T.success : T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s", flexShrink: 0 }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>

        {/* Link */}
        <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: T.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 14 }}>
          {referralLink}
        </div>

        {/* Share buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={shareWhatsApp}
            style={{ background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "12px", color: "#25d366", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            💬 Share on WhatsApp
          </button>
          <button
            onClick={() => { if (navigator.share) navigator.share({ title: "Join TezConnect!", text: shareText, url: referralLink }); else copyLink(); }}
            style={{ background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "12px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            📤 Share App
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>📖 How It Works</div>
        {[
          { step: "1", icon: "🔗", title: "Share your link", desc: "Send your referral link to friends via WhatsApp or any platform" },
          { step: "2", icon: "✍️", title: "They sign up", desc: "Friend clicks your link and creates a TezConnect account" },
          { step: "3", icon: "⭐", title: "Earn points", desc: `You get ${POINTS_PER_REFERRAL} points when they complete their profile` },
          { step: "4", icon: "💰", title: "Withdraw money", desc: `Convert points to cash — ₹${RUPEES_PER_POINT} per point` },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.orangeMd, border: `1px solid ${T.orange}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral list */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>
          👥 Your Referrals
          {pending > 0 && <span style={{ marginLeft: 8, background: T.amberLo, border: `1px solid ${T.amber}33`, color: T.amber, borderRadius: 20, fontSize: 10, padding: "2px 8px" }}>{pending} pending</span>}
        </div>
        {referrals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
            <div style={{ fontSize: 13, color: T.textLow }}>No referrals yet — start sharing your link!</div>
          </div>
        ) : (
          referrals.map(r => {
            const person = r.referred || {};
            const initials = (person.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                  {person.photo ? <img src={person.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{person.name || "Member"}</div>
                  <div style={{ fontSize: 11, color: T.textLow }}>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: r.status === "completed" ? T.success : T.amber }}>
                    {r.status === "completed" ? `+${POINTS_PER_REFERRAL} pts` : "Pending"}
                  </div>
                  <div style={{ fontSize: 10, color: T.textLow, marginTop: 2, textTransform: "capitalize" }}>{r.status}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
