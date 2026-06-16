import { useState } from "react";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
};

const APP_URL = "https://tezconnect.vercel.app";
const APP_NAME = "TezConnect";
const SHARE_TEXT = `⚡ Join me on *TezConnect* — India's B2B Professional Network!

Connect with verified professionals, generate leads, attend events, and grow your business.

📲 Download & Sign Up Free:
${APP_URL}

*Connect Faster. Grow Smarter.* 🚀`;

export default function ShareApp({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("share");

  const copyLink = () => {
    navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TezConnect — B2B Professional Network",
          text: SHARE_TEXT,
          url: APP_URL,
        });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const shareVia = [
    {
      label: "WhatsApp",
      icon: "💬",
      color: "#25d366",
      bg: "#25d36618",
      border: "#25d36633",
      url: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`,
    },
    {
      label: "LinkedIn",
      icon: "🔗",
      color: "#0a66c2",
      bg: "#0a66c218",
      border: "#0a66c233",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`,
    },
    {
      label: "Twitter / X",
      icon: "🐦",
      color: "#1da1f2",
      bg: "#1da1f218",
      border: "#1da1f233",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("⚡ Join TezConnect — India's B2B Professional Network!\n\nConnect, collaborate, and grow.\n" + APP_URL)}`,
    },
    {
      label: "Telegram",
      icon: "✈️",
      color: "#229ed9",
      bg: "#229ed918",
      border: "#229ed933",
      url: `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent("⚡ Join TezConnect — India's B2B Professional Network!")}`,
    },
    {
      label: "Facebook",
      icon: "📘",
      color: "#1877f2",
      bg: "#1877f218",
      border: "#1877f233",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`,
    },
    {
      label: "Email",
      icon: "✉️",
      color: "#f97316",
      bg: "#f9731618",
      border: "#f9731633",
      url: `mailto:?subject=${encodeURIComponent("Join me on TezConnect!")}&body=${encodeURIComponent(SHARE_TEXT)}`,
    },
  ];

  const steps = [
    { icon: "1️⃣", title: "Share this link", desc: "Send the app link to your contact via WhatsApp, SMS, or any platform" },
    { icon: "2️⃣", title: "They open the link", desc: "The link opens TezConnect in their browser — no app store needed" },
    { icon: "3️⃣", title: "Add to Home Screen", desc: "They can install it as an app by tapping 'Add to Home Screen' in their browser" },
    { icon: "4️⃣", title: "Sign up & connect", desc: "They create an account and can connect with you on the Network page" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", animation: "slideUp .3s ease" }}
      >
        {/* Handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>⚡ Share TezConnect</div>
              <div style={{ fontSize: 12, color: T.textLow, marginTop: 2 }}>
                Invite friends & grow your network
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[["share", "📤 Share App"], ["how", "📖 How to Install"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ flex: 1, background: activeTab === id ? T.orangeMd : T.bgInput, border: `1px solid ${activeTab === id ? T.orange + "55" : T.border}`, borderRadius: 10, padding: "9px", color: activeTab === id ? T.orange : T.textMid, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Share tab */}
          {activeTab === "share" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* App preview card */}
              <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 16, padding: "20px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(145deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 4px 16px #f9731444" }}>
                  ⚡
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>TezConnect</div>
                  <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>B2B Professional Network</div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>{APP_URL}</div>
                </div>
              </div>

              {/* Copy link */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: T.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {APP_URL}
                </div>
                <button
                  onClick={copyLink}
                  style={{ background: copied ? T.successLo : T.orangeMd, border: `1px solid ${copied ? T.success + "44" : T.orange + "44"}`, borderRadius: 10, padding: "12px 16px", color: copied ? T.success : T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0, transition: "all .2s", whiteSpace: "nowrap" }}
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>

              {/* Native share button */}
              <button
                onClick={shareNative}
                style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 20px #f9731440", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                📤 Share App
              </button>

              {/* Platform buttons */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
                  Share via platform
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {shareVia.map(platform => (
                    <a
                      key={platform.label}
                      href={platform.url}
                      target="_blank" rel="noopener noreferrer"
                      style={{ background: platform.bg, border: `1px solid ${platform.border}`, borderRadius: 12, padding: "12px 8px", color: platform.color, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "all .2s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      <span style={{ fontSize: 22 }}>{platform.icon}</span>
                      <span>{platform.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Share message preview */}
              <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>
                  Message Preview
                </div>
                <pre style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
                  {SHARE_TEXT}
                </pre>
              </div>
            </div>
          )}

          {/* How to install tab */}
          {activeTab === "how" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 4 }}>
                TezConnect works like a native app on any phone — no app store download needed. Here's how your friend can install it:
              </div>

              {steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{step.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 4 }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}

              {/* Platform specific */}
              <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px", marginTop: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 12 }}>Platform instructions:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🍎</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>iPhone (Safari)</div>
                      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>Open link in Safari → Tap Share button → "Add to Home Screen" → Add</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🤖</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Android (Chrome)</div>
                      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>Open link in Chrome → Tap ⋮ menu → "Add to Home Screen" → Install</div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab("share")}
                style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                📤 Share Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

