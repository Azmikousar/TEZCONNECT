import { useState, useEffect, useCallback, useRef } from "react";
import { useNotifications } from "./useNotifications";
import NotificationsPanel from "./NotificationsPanel";
import { useIsMobile } from "./useIsMobile";
import { supabase } from "./supabase";   // ← add this line
import { uploadPhoto } from "./uploadPhoto";
import NetworkPage from "./NetworkPage";
import { useConnections } from "./useConnections";
import { useDashboardStats } from "./useDashboardStats";
import LeadsPage from "./LeadsPage";
import EventsPage from "./EventsPage";
import MessagesPage from "./MessagesPage";
import PublicProfilePage from "./PublicProfilePage";
import SettingsPage from "./SettingsPage";
import { PresenceProvider } from "./PresenceProvider";
import BottomNav from "./BottomNav";
import MobileTopBar from "./MobileTopBar";
import MobileMoreMenu from "./MobileMoreMenu";
import ServicesPage from "./ServicesPage";
import ShareApp from "./ShareApp";
import LeadAnalyticsPage from "./LeadAnalyticsPage";
import ReferEarnPage from "./ReferEarnPage";
import WalletPage from "./WalletPage";
import MyProductsPage from "./MyProductsPage";
import MarketplacePage from "./MarketplacePage";
import TezPrintsPage from "./TezPrintsPage";
import TezAppStorePage from "./TezAppStorePage";
import OrdersPage from "./OrdersPage";
import { CallProvider } from "./CallProvider";
import PremiumUpgradeModal from "./PremiumUpgradeModal";
function PrimeBadge() {
  return (
    <span style={{ fontSize: 9, color: "#fbbf24", background: "#fbbf2418", border: "1px solid #fbbf2444", borderRadius: 20, padding: "1px 6px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
      👑 PRIME
    </span>
  );
}
















/* ═══════════════════════════════════════════════════════════
   VALIDATION
═══════════════════════════════════════════════════════════ */
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const clean = (s) => s.trim().replace(/[<>]/g, "");

/* ═══════════════════════════════════════════════════════════
   TOKENS — Orange × Deep Navy
═══════════════════════════════════════════════════════════ */
const T = {
  bg: "#06070d",
  bgCard: "#0b0d17",
  bgInput: "#0f1120",
  bgHover: "#141726",
  border: "#1a1f35",
  borderHi: "#f9731633",
  orange: "#f97316",
  orangeHi: "#fb923c",
  orangeLo: "#f9731612",
  orangeMd: "#f9731625",
  amber: "#fbbf24",
  text: "#eef0f8",
  textMid: "#6b7594",
  textLow: "#343c58",
  success: "#22c55e",
  successLo: "#22c55e12",
  error: "#f87171",
  errorLo: "#f8717112",
  info: "#38bdf8",
  infoLo: "#38bdf812",
  sidebar: "#080a15",
  sidebarBorder: "#141830",
};


/* ═══════════════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#06070d;font-family:'Plus Jakarta Sans',sans-serif;color:#eef0f8;-webkit-font-smoothing:antialiased}
input,button,select,textarea{font-family:'Plus Jakarta Sans',sans-serif}
@keyframes fadeUp  {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn  {from{opacity:0}to{opacity:1}}
@keyframes scaleIn {from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin    {to{transform:rotate(360deg)}}
@keyframes slideR  {from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes playPulse{0%,100%{box-shadow:0 0 0 0 #f9731644}70%{box-shadow:0 0 0 10px #f9731600}}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: .6;
    transform: scale(1.2);
  }
}

::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#1a1f35;border-radius:4px}
@keyframes slideUp {from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
`;



function GlobalStyles() {
  useEffect(() => {
    const id = "tez-g";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════════════
   BACKGROUND
═══════════════════════════════════════════════════════════ */
function Background() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.03 }}
      >
        <defs>
          <pattern
            id="g"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#f97316" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,#f9731608 0%,transparent 65%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle,#fbbf2405 0%,transparent 65%)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════════════════ */
function Logo({ size = "md", collapsed = false }) {
  const s = {
    sm: { icon: 26, brand: 16, sub: 8 },
    md: { icon: 34, brand: 20, sub: 9 },
    lg: { icon: 48, brand: 28, sub: 10 },
  }[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: collapsed ? 0 : 10 }}>
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.icon * 0.26,
          background: "linear-gradient(145deg,#f97316,#ea6008)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: s.icon * 0.46,
          flexShrink: 0,
          boxShadow: `0 0 ${s.icon}px #f9731644`,
        }}
      >
        ⚡
      </div>
      {!collapsed && (
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: s.brand,
              color: T.text,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            Tez<span style={{ color: T.orange }}>Connect</span>
          </div>
          {size !== "sm" && (
            <div
              style={{
                fontSize: s.sub,
                color: T.textLow,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginTop: 2,
                fontWeight: 600,
              }}
            >
              B2B Professional Network
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════════ */
function Spinner({ size = 18, color = T.orange }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function StarRating({ v = 4, max = 5, size = 14, interactive = false, onChange }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => {
        const on = interactive ? (hov || v) > i : v > i;
        return (
          <span
            key={i}
            onClick={() => interactive && onChange && onChange(i + 1)}
            onMouseEnter={() => interactive && setHov(i + 1)}
            onMouseLeave={() => interactive && setHov(0)}
            style={{
              fontSize: size,
              color: on ? T.amber : T.textLow,
              cursor: interactive ? "pointer" : "default",
              transition: "color .15s",
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

function Btn({
  children,
  onClick,
  loading = false,
  disabled = false,
  variant = "primary",
  fullWidth = false,
  small = false,
  icon,
}) {
  const p = variant === "primary";
  const g = variant === "ghost";
  const d = variant === "danger";
  return (
    <button
      onClick={!loading && !disabled ? onClick : undefined}
      disabled={disabled || loading}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: small ? "8px 14px" : "12px 20px",
        background: p
          ? disabled || loading
            ? "#1a1f35"
            : "linear-gradient(135deg,#f97316,#ea6008)"
          : g
          ? "transparent"
          : d
          ? T.errorLo
          : "transparent",
        color: p ? (disabled || loading ? T.textLow : "#fff") : d ? T.error : T.textMid,
        border: p ? "none" : d ? `1px solid ${T.error}44` : `1px solid ${T.border}`,
        borderRadius: 9,
        fontSize: small ? 11 : 13,
        fontWeight: 700,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        transition: "all .2s",
        boxShadow:
          p && !disabled && !loading ? "0 4px 20px #f9731440" : "none",
        letterSpacing: "-.01em",
        flexShrink: 0,
      }}
    >
      {loading ? (
        <>
          <Spinner size={13} color={p ? "#fff" : T.orange} />
          Processing…
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

function Alert({ type = "error", children, onDismiss }) {
  const c = {
    error: { bg: T.errorLo, border: T.error, ico: "✕", col: T.error },
    success: { bg: T.successLo, border: T.success, ico: "✓", col: T.success },
    info: { bg: T.infoLo, border: T.info, ico: "i", col: T.info },
  }[type];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}44`,
        borderRadius: 10,
        padding: "11px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        animation: "scaleIn .2s ease",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: c.border + "22",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 800,
          color: c.col,
          flexShrink: 0,
        }}
      >
        {c.ico}
      </div>
      <div style={{ flex: 1, fontSize: 12, color: c.col, lineHeight: 1.5 }}>
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: "none",
            border: "none",
            color: c.col,
            cursor: "pointer",
            fontSize: 15,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && (
        <span
          style={{
            fontSize: 10,
            color: T.textLow,
            whiteSpace: "nowrap",
            letterSpacing: ".08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

function Tag({ children, color = T.orange, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: color + "18",
        border: `1px solid ${color}33`,
        color,
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {children}
      {onRemove && (
        <span
          onClick={onRemove}
          style={{ cursor: "pointer", fontSize: 13, lineHeight: 1, opacity: 0.7 }}
        >
          ×
        </span>
      )}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: T.textLow,
        textTransform: "uppercase",
        letterSpacing: ".1em",
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INPUT FIELD
═══════════════════════════════════════════════════════════ */
function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  icon,
  multiline = false,
  select = false,
  options = [],
  hint,
  disabled = false,
}) {
  const [foc, setFoc] = useState(false);
  const base = {
    width: "100%",
    background: foc ? T.bgHover : T.bgInput,
    border: `1.5px solid ${error ? T.error : foc ? T.orange : T.border}`,
    borderRadius: 9,
    padding: `11px ${type === "password" ? 46 : 14}px 11px ${icon ? 38 : 14}px`,
    color: T.text,
    fontSize: 13,
    outline: "none",
    transition: "all .2s",
    boxShadow: foc ? `0 0 0 3px ${error ? T.error : T.orange}15` : "none",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: foc ? T.orangeHi : T.textMid,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            transition: "color .2s",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: foc ? T.orange : T.textLow,
              pointerEvents: "none",
            }}
          >
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            disabled={disabled}
            onFocus={() => setFoc(true)}
            onBlur={() => setFoc(false)}
            style={{ ...base, resize: "vertical", paddingTop: 12, paddingBottom: 12 }}
          />
        ) : select ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFoc(true)}
            onBlur={() => setFoc(false)}
            style={{ ...base, appearance: "none" }}
          >
            {options.map((o) => (
              <option key={o.v || o} value={o.v || o}>
                {o.l || o}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => setFoc(true)}
            onBlur={() => setFoc(false)}
            style={base}
          />
        )}
      </div>
      {error && (
        <div
          style={{
            color: T.error,
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            gap: 4,
            animation: "slideR .2s ease",
          }}
        >
          <span>⚠</span>
          {error}
        </div>
      )}
      {hint && !error && (
        <div style={{ color: T.textLow, fontSize: 11 }}>{hint}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAG INPUT
═══════════════════════════════════════════════════════════ */
function TagInput({ label, values = [], onChange, placeholder, color = T.orange, max = 20 }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v) && values.length < max) {
      onChange([...values, v]);
      setInput("");
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textMid,
            textTransform: "uppercase",
            letterSpacing: ".08em",
          }}
        >
          {label}
        </label>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          style={{
            flex: 1,
            background: T.bgInput,
            border: `1.5px solid ${T.border}`,
            borderRadius: 9,
            padding: "10px 14px",
            color: T.text,
            fontSize: 13,
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = T.orange)}
          onBlur={(e) => (e.target.style.borderColor = T.border)}
        />
        <button
          onClick={add}
          style={{
            background: T.orangeMd,
            border: `1px solid ${T.orange}44`,
            borderRadius: 9,
            padding: "10px 16px",
            color: T.orange,
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          + Add
        </button>
      </div>
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {values.map((v) => (
            <Tag key={v} color={color} onRemove={() => onChange(values.filter((x) => x !== v))}>
              {v}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PHOTO UPLOAD
═══════════════════════════════════════════════════════════ */
function PhotoUpload({ value, onChange, label, size = 80, round = true, icon = "📷", bucket = "avatars", userId }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const load = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userId) {
      const r = new FileReader();
      r.onload = (ev) => onChange(ev.target.result);
      r.readAsDataURL(file);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadPhoto(file, userId, bucket);
      onChange(url);
    } catch (err) {
      console.error("Upload failed:", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        onClick={() => !uploading && ref.current.click()}
        style={{
          width: size,
          height: size,
          borderRadius: round ? "50%" : 14,
          border: `2px dashed ${T.orange}55`,
          background: T.bgInput,
          overflow: "hidden",
          cursor: uploading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "border-color .2s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.orange)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.orange + "55")}
      >
        {uploading ? (
          <Spinner size={size * 0.35} />
        ) : value ? (
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", padding: 8 }}>
            <div style={{ fontSize: size * 0.28 }}>{icon}</div>
            <div style={{ fontSize: 9, color: T.textLow, marginTop: 4, fontWeight: 600 }}>
              Upload
            </div>
          </div>
        )}
        {value && !uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
          >
            <span style={{ fontSize: 20 }}>✏️</span>
          </div>
        )}
      </div>
      {label && (
        <div style={{ fontSize: 11, color: T.textLow, fontWeight: 600 }}>{label}</div>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={load} style={{ display: "none" }} />
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════
   PROFILE COMPLETENESS BAR
═══════════════════════════════════════════════════════════ */
function ProfileCompleteness({ profile }) {
  const checks = [
    !!profile.name,
    !!profile.photo,
    !!profile.designation,
    !!profile.bio,
    !!profile.location,
    !!profile.company,
    !!profile.industry,
    !!profile.experience,
    !!profile.mobile,
    !!profile.email,
    !!(profile.skills?.length),
    !!(profile.services?.length),
    !!(profile.linkedin || profile.instagram || profile.facebook),
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const col = pct < 40 ? T.error : pct < 70 ? T.amber : pct < 100 ? T.orange : T.success;
  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Profile Completeness</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: col }}>{pct}%</span>
      </div>
      <div
        style={{ height: 6, background: T.bgInput, borderRadius: 4, overflow: "hidden" }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg,${T.orange},${col})`,
            borderRadius: 4,
            transition: "width .6s ease",
          }}
        />
      </div>
      {pct < 100 && (
        <div style={{ fontSize: 11, color: T.textLow, marginTop: 6 }}>
          Complete your profile to unlock full visibility
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE VIEW (read-only public view)
═══════════════════════════════════════════════════════════ */
function ProfileView({ profile, onEdit, session }) {
  const [tab, setTab]   = useState("posts");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const isMine = profile.id === session?.userId || !profile.id;

  useEffect(() => {
    if (tab === "posts" && session?.userId) {
      setPostsLoading(true);
      const uid = profile.id || session.userId;
      supabase.from("posts").select("*").eq("user_id", uid)
        .order("created_at", { ascending: false })
        .then(({ data }) => { setPosts(data || []); setPostsLoading(false); });
    }
  }, [tab, session?.userId, profile.id]);

  const tabs = [
    ["posts",    "⊞ Posts"],
    ["about",    "About"],
    ["business", "Business"],
    ["contact",  "Contact"],
  ];

  const SocialIcon = ({ href, icon, label }) => href ? (
    <a href={href.startsWith("http")?href:"https://"+href} target="_blank" rel="noopener noreferrer"
      style={{display:"flex",alignItems:"center",gap:8,background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 12px",color:T.text,textDecoration:"none",fontSize:12,fontWeight:600}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=T.orange+"55"} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
      <span style={{fontSize:16}}>{icon}</span>{label}
    </a>
  ) : null;

  const initials = (profile.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  return (
    
    <div style={{ background:T.bgCard, borderRadius:16, overflow:"hidden", border:`1px solid ${T.border}`, marginBottom:2 }}>
      

    

      {/* Avatar + name */}
      <div style={{background:T.bgCard,borderLeft:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,padding:"0 24px 0"}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:16,transform:"translateY(-44px)",marginBottom:-24}}>
          <div style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${T.bgCard}`,overflow:"hidden",background:"linear-gradient(135deg,#f97316,#ea6008)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:"0 8px 24px #00000066"}}>
            {profile.photo?<img src={profile.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:initials}
          </div>
        </div>
        <div style={{paddingBottom:16}}>
          <div style={{fontWeight:800,fontSize:22,color:T.text,letterSpacing:"-.03em"}}>{profile.name||<span style={{color:T.textLow}}>Your Name</span>}</div>
          {profile.designation && <div style={{fontSize:14,color:T.orange,fontWeight:600,marginTop:2}}>{profile.designation}</div>}
          {profile.company && <div style={{fontSize:13,color:T.textMid,marginTop:2}}>{profile.company}{profile.industry?" · "+profile.industry:""}</div>}
          {profile.location && <div style={{fontSize:12,color:T.textLow,marginTop:4}}>📍 {profile.location}</div>}

          {/* Stats row — Instagram style */}
          <div style={{display:"flex",gap:0,marginTop:16,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,padding:"12px 0"}}>
            {[
              [posts.length, "Posts"],
              [profile.skills?.length||0, "Skills"],
              [profile.services?.length||0, "Services"],
            ].map(([v,l],i)=>(
              <div key={l} style={{flex:1,textAlign:"center",borderRight:i<2?`1px solid ${T.border}`:"none"}}>
                <div style={{fontWeight:800,fontSize:18,color:T.text}}>{v}</div>
                <div style={{fontSize:10,color:T.textLow,textTransform:"uppercase",letterSpacing:".07em",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:T.bgCard,borderLeft:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,display:"flex",padding:"0 8px",gap:0,overflowX:"auto"}}>
        {tabs.map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{background:"none",border:"none",borderBottom:`2px solid ${tab===id?T.orange:"transparent"}`,color:tab===id?T.orange:T.textMid,fontWeight:tab===id?700:500,fontSize:13,padding:"12px 14px",cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderTop:"none",borderRadius:"0 0 16px 16px",minHeight:200}}>

        {/* Posts grid — Instagram style */}
        {tab==="posts" && (
          <div>
            {postsLoading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 0",gap:12}}>
                <div style={{width:20,height:20,border:"2px solid #f9731633",borderTopColor:"#f97316",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                <span style={{color:T.textMid,fontSize:13}}>Loading posts…</span>
              </div>
            ) : posts.length === 0 ? (
              <div style={{textAlign:"center",padding:"50px 20px"}}>
                <div style={{fontSize:48,marginBottom:12}}>📸</div>
                <div style={{fontWeight:700,fontSize:16,color:T.text,marginBottom:8}}>No posts yet</div>
                <div style={{fontSize:13,color:T.textLow,marginBottom:20}}>
                  {isMine ? "Share photos and videos to show your work and ideas" : "This member hasn't posted yet"}
                </div>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,padding:2}}>
                {posts.map(post => (
                  <div key={post.id} style={{aspectRatio:"1",overflow:"hidden",position:"relative",background:T.bgInput,cursor:"pointer"}}>
                    {post.media_type==="video" && post.media_url ? (
                      <video src={post.media_url} style={{width:"100%",height:"100%",objectFit:"cover"}} muted playsInline/>
                    ) : post.media_url ? (
                      <img src={post.media_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    ) : (
                      <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:T.bgHover,padding:8}}>
                        <p style={{fontSize:11,color:T.textMid,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:4,WebkitBoxOrient:"vertical"}}>{post.caption}</p>
                      </div>
                    )}
                    {post.media_type==="video" && (
                      <div style={{position:"absolute",top:6,right:6,fontSize:14}}>▶️</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==="about" && (
          <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:20}}>
            {profile.bio&&<div><SectionLabel>Bio</SectionLabel><p style={{color:"#c8cce0",fontSize:14,lineHeight:1.8}}>{profile.bio}</p></div>}
            {profile.skills?.length>0&&<div><SectionLabel>Skills</SectionLabel><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{profile.skills.map(s=><Tag key={s}>{s}</Tag>)}</div></div>}
            {profile.achievements?.length>0&&(
              <div><SectionLabel>Achievements</SectionLabel>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {profile.achievements.map((a,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,background:T.bgInput,borderRadius:10,padding:"12px 14px"}}>
                      <span style={{color:T.amber,fontSize:16,flexShrink:0}}>🏆</span>
                      <div style={{fontSize:13,color:T.textMid,lineHeight:1.5}}>{a}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab==="business" && (
          <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:16}}>
            {[["Company",profile.company],["Industry",profile.industry],["Category",profile.category],["Experience",profile.experience],["Team Size",profile.teamSize],["Website",profile.website]].filter(([,v])=>v).map(([l,v])=>(
              <div key={l} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <div style={{width:120,fontSize:12,color:T.textLow,fontWeight:600,flexShrink:0}}>{l}</div>
                <div style={{fontSize:13,color:T.text}}>{l==="Website"?<a href={v.startsWith("http")?v:"https://"+v} target="_blank" rel="noopener noreferrer" style={{color:T.orange}}>{v}</a>:v}</div>
              </div>
            ))}
            {profile.services?.length>0&&<div><SectionLabel>Services</SectionLabel><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{profile.services.map(s=><Tag key={s} color={T.info}>{s}</Tag>)}</div></div>}
          </div>
        )}

        {tab==="contact" && (
          <div style={{padding:"24px",display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {profile.mobile&&<ContactRow icon="📱" label="Mobile" value={profile.mobile}/>}
              {profile.whatsapp&&<ContactRow icon="💬" label="WhatsApp" value={profile.whatsapp}/>}
              {profile.email&&<ContactRow icon="✉" label="Email" value={profile.email}/>}
              {profile.website&&<ContactRow icon="🌐" label="Website" value={profile.website} link/>}
            </div>
            {(profile.linkedin||profile.facebook||profile.instagram||profile.twitter||profile.youtube)&&(
              <div>
                <SectionLabel>Social Links</SectionLabel>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  <SocialIcon href={profile.linkedin}  icon="🔗" label="LinkedIn"/>
                  <SocialIcon href={profile.facebook}  icon="📘" label="Facebook"/>
                  <SocialIcon href={profile.instagram} icon="📸" label="Instagram"/>
                  <SocialIcon href={profile.twitter}   icon="🐦" label="X / Twitter"/>
                  <SocialIcon href={profile.youtube}   icon="▶"  label="YouTube"/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function ContactRow({ icon, label, value, link }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: T.bgInput,
        border: `1px solid ${T.border}`,
        borderRadius: 9,
        padding: "10px 14px",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            color: T.textLow,
            textTransform: "uppercase",
            letterSpacing: ".07em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        {link ? (
          <a
            href={value.startsWith("http") ? value : "https://" + value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, fontWeight: 600, color: T.orange, wordBreak: "break-all" }}
          >
            {value}
          </a>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE EDITOR
═══════════════════════════════════════════════════════════ */
function ProfileEditor({ profile, onSave, onCancel, session }) {
  const [p, setP] = useState({
    name: "",
    photo: "",
    cover: "",
    designation: "",
    bio: "",
    location: "",
    company: "",
    companyLogo: "",
    industry: "",
    category: "",
    experience: "",
    teamSize: "",
    mobile: "",
    whatsapp: "",
    email: "",
    website: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    skills: [],
    services: [],
    portfolio: [],
    certifications: [],
    achievements: [],
    ...profile,
  });
  const [section, setSection] = useState("personal");
  const [saved, setSaved] = useState(false);
  const [addPortfolio, setAddPortfolio] = useState(false);
  const [pItem, setPItem] = useState({ title: "", desc: "", link: "", image: "" });
  const [addCert, setAddCert] = useState(false);
  const [cItem, setCItem] = useState({ name: "", issuer: "", year: "" });

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));

  const handleSave = () => {
    onSave(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: "personal", icon: "👤", label: "Personal" },
    { id: "business", icon: "🏢", label: "Business" },
    { id: "contact", icon: "📞", label: "Contact" },
    { id: "social", icon: "🔗", label: "Social Links" },
    { id: "professional", icon: "💼", label: "Professional" },
  ];

  const INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Education", "Real Estate",
    "Manufacturing", "Retail", "Media", "Consulting", "Other",
  ];
  const CATEGORIES = [
    "B2B Services", "SaaS", "Agency", "Startup", "Enterprise",
    "Freelancer", "Investor", "Recruiter", "Coach", "Other",
  ];
  const EXPERIENCE = [
    "0-1 years", "1-3 years", "3-5 years", "5-10 years", "10-15 years", "15+ years",
  ];
  const TEAM_SIZES = ["Solo", "2-5", "6-10", "11-25", "26-50", "51-100", "100+"];

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 0, animation: "fadeUp .35s ease" }}
    >
      {/* Editor header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-.03em" }}>
            Edit Profile
          </div>
          <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>
            Build your professional B2B presence
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onCancel} small>
            Cancel
          </Btn>
          <Btn onClick={handleSave} small icon={saved ? "✓" : "💾"}>
            {saved ? "Saved!" : "Save Changes"}
          </Btn>
        </div>
      </div>

      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: section === s.id ? T.orangeMd : T.bgCard,
              border: `1px solid ${section === s.id ? T.orange + "55" : T.border}`,
              borderRadius: 9,
              padding: "8px 14px",
              color: section === s.id ? T.orange : T.textMid,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .2s",
              flexShrink: 0,
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div
        style={{
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── PERSONAL ── */}
        {section === "personal" && (
          <>
            <SectionLabel>Photos</SectionLabel>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <PhotoUpload
                  value={p.photo}
                  onChange={(v) => set("photo", v)}
                  round
                  label="Profile Photo"
                  size={90}
                  bucket="avatars"
                  userId={session?.userId}
                />

              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <PhotoUpload
                  value={p.cover}
                  onChange={(v) => set("cover", v)}
                  round={false}
                  label="Cover Photo"
                  size={90}
                  icon="🖼️"
                  bucket="covers"
                  userId={session?.userId}
                />
              </div>
            </div>
            <Divider />
            <SectionLabel>Personal Information</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field
                label="Full Name *"
                value={p.name}
                onChange={(v) => set("name", v)}
                placeholder="e.g. Arjun Mehta"
                icon="👤"
              />
              <Field
                label="Designation / Title"
                value={p.designation}
                onChange={(v) => set("designation", v)}
                placeholder="e.g. CEO & Founder"
                icon="💼"
              />
              <Field
                label="Location"
                value={p.location}
                onChange={(v) => set("location", v)}
                placeholder="e.g. Mumbai, India"
                icon="📍"
              />
            </div>
            <Field
              label="Bio"
              value={p.bio}
              onChange={(v) => set("bio", v)}
              placeholder="Tell your professional story — who you are, what you do, what you offer..."
              multiline
              icon="📝"
            />
          </>
        )}

        {/* ── BUSINESS ── */}
        {section === "business" && (
          <>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <PhotoUpload
                value={p.companyLogo}
                onChange={(v) => set("companyLogo", v)}
                round={false}
                label="Company Logo"
                size={80}
                icon="🏢"
                bucket="logos"
                userId={session?.userId}
              />
              <div
                style={{
                  flex: 1,
                  minWidth: 200,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <Field
                  label="Company Name"
                  value={p.company}
                  onChange={(v) => set("company", v)}
                  placeholder="e.g. TechVentures India"
                  icon="🏢"
                />
                <Field
                  label="Website"
                  value={p.website}
                  onChange={(v) => set("website", v)}
                  placeholder="https://yourcompany.com"
                  icon="🌐"
                />
              </div>
            </div>
            <Divider />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field
                label="Industry"
                value={p.industry}
                onChange={(v) => set("industry", v)}
                select
                options={["", ...INDUSTRIES].map((o) => ({ v: o, l: o || "Select Industry" }))}
                icon="🏭"
              />
              <Field
                label="Business Category"
                value={p.category}
                onChange={(v) => set("category", v)}
                select
                options={["", ...CATEGORIES].map((o) => ({ v: o, l: o || "Select Category" }))}
                icon="📂"
              />
              <Field
                label="Experience"
                value={p.experience}
                onChange={(v) => set("experience", v)}
                select
                options={["", ...EXPERIENCE].map((o) => ({ v: o, l: o || "Select Experience" }))}
                icon="📅"
              />
              <Field
                label="Team Size"
                value={p.teamSize}
                onChange={(v) => set("teamSize", v)}
                select
                options={["", ...TEAM_SIZES].map((o) => ({ v: o, l: o || "Select Team Size" }))}
                icon="👥"
              />
            </div>
          </>
        )}

        {/* ── CONTACT ── */}
        {section === "contact" && (
          <>
            <SectionLabel>Contact Information</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field
                label="Mobile Number"
                value={p.mobile}
                onChange={(v) => set("mobile", v)}
                placeholder="+91 98765 43210"
                icon="📱"
                type="tel"
              />
              <Field
                label="WhatsApp Number"
                value={p.whatsapp}
                onChange={(v) => set("whatsapp", v)}
                placeholder="+91 98765 43210"
                icon="💬"
                type="tel"
              />
              <Field
                label="Email"
                value={p.email}
                onChange={(v) => set("email", v)}
                placeholder="you@company.com"
                icon="✉"
                type="email"
              />
              <Field
                label="Website"
                value={p.website}
                onChange={(v) => set("website", v)}
                placeholder="https://yourwebsite.com"
                icon="🌐"
              />
            </div>
          </>
        )}

        {/* ── SOCIAL ── */}
        {section === "social" && (
          <>
            <SectionLabel>Social Media Links</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field
                label="LinkedIn"
                value={p.linkedin}
                onChange={(v) => set("linkedin", v)}
                placeholder="linkedin.com/in/yourname"
                icon="🔗"
              />
              <Field
                label="Facebook"
                value={p.facebook}
                onChange={(v) => set("facebook", v)}
                placeholder="facebook.com/yourpage"
                icon="📘"
              />
              <Field
                label="Instagram"
                value={p.instagram}
                onChange={(v) => set("instagram", v)}
                placeholder="instagram.com/yourhandle"
                icon="📸"
              />
              <Field
                label="X / Twitter"
                value={p.twitter}
                onChange={(v) => set("twitter", v)}
                placeholder="x.com/yourhandle"
                icon="🐦"
              />
              <Field
                label="YouTube"
                value={p.youtube}
                onChange={(v) => set("youtube", v)}
                placeholder="youtube.com/@yourchannel"
                icon="▶"
              />
            </div>
          </>
        )}

        {/* ── PROFESSIONAL ── */}
        {section === "professional" && (
          <>
            <TagInput
              label="Skills"
              values={p.skills}
              onChange={(v) => set("skills", v)}
              placeholder="e.g. Business Development (press Enter)"
              color={T.orange}
            />
            <Divider />
            <TagInput
              label="Services Offered"
              values={p.services}
              onChange={(v) => set("services", v)}
              placeholder="e.g. Lead Generation (press Enter)"
              color={T.info}
            />
            <Divider />
            <TagInput
              label="Achievements"
              values={p.achievements}
              onChange={(v) => set("achievements", v)}
              placeholder="e.g. Scaled to ₹1Cr revenue in 2 years"
              color={T.amber}
            />
            <Divider />
            {/* Certifications */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <SectionLabel>Certifications</SectionLabel>
                <button
                  onClick={() => setAddCert(true)}
                  style={{
                    background: T.orangeMd,
                    border: `1px solid ${T.orange}44`,
                    borderRadius: 7,
                    padding: "5px 12px",
                    color: T.orange,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              </div>
              {p.certifications?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {p.certifications.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: T.bgInput,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        padding: "10px 14px",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🎓</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: T.textMid }}>
                          {c.issuer}
                          {c.year ? " · " + c.year : ""}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          set(
                            "certifications",
                            p.certifications.filter((_, j) => j !== i)
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: T.error,
                          cursor: "pointer",
                          fontSize: 16,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: T.textLow,
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No certifications added yet.
                </div>
              )}
            </div>
            <Divider />
            {/* Portfolio */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <SectionLabel>Portfolio</SectionLabel>
                <button
                  onClick={() => setAddPortfolio(true)}
                  style={{
                    background: T.orangeMd,
                    border: `1px solid ${T.orange}44`,
                    borderRadius: 7,
                    padding: "5px 12px",
                    color: T.orange,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add
                </button>
              </div>
              {p.portfolio?.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
                    gap: 10,
                  }}
                >
                  {p.portfolio.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.bgInput,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: "100%", height: 90, objectFit: "cover" }}
                        />
                      )}
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>
                          {item.title}
                        </div>
                        {item.desc && (
                          <div
                            style={{
                              fontSize: 11,
                              color: T.textMid,
                              marginTop: 2,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.desc}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          set(
                            "portfolio",
                            p.portfolio.filter((_, j) => j !== i)
                          )
                        }
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "#000a",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: T.textLow,
                    textAlign: "center",
                    padding: "16px 0",
                  }}
                >
                  No portfolio items yet.
                </div>
              )}
            </div>
          </>
        )}

        {/* Save button at bottom */}
        <div style={{ paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
          <Btn onClick={handleSave} fullWidth icon={saved ? "✓" : "💾"}>
            {saved ? "Profile Saved!" : "Save Changes"}
          </Btn>
        </div>
      </div>

      {/* Portfolio Add Modal */}
      {addPortfolio && (
        <div
          onClick={() => setAddPortfolio(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000c",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "24px",
              width: "100%",
              maxWidth: 420,
              animation: "scaleIn .2s ease",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 16 }}>
              Add Portfolio Item
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field
                label="Project Title *"
                value={pItem.title}
                onChange={(v) => setPItem((x) => ({ ...x, title: v }))}
                placeholder="e.g. E-commerce App"
              />
              <Field
                label="Description"
                value={pItem.desc}
                onChange={(v) => setPItem((x) => ({ ...x, desc: v }))}
                placeholder="Brief project description..."
                multiline
              />
              <Field
                label="Project Link"
                value={pItem.link}
                onChange={(v) => setPItem((x) => ({ ...x, link: v }))}
                placeholder="https://myproject.com"
                icon="🔗"
              />
              <PhotoUpload
                value={pItem.image}
                onChange={(v) => setPItem((x) => ({ ...x, image: v }))}
                round={false}
                label="Project Screenshot"
                size={60}
                icon="🖼️"
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => setAddPortfolio(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  if (!pItem.title.trim()) return;
                  set("portfolio", [...(p.portfolio || []), pItem]);
                  setPItem({ title: "", desc: "", link: "", image: "" });
                  setAddPortfolio(false);
                }}
              >
                Add Item
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Cert Add Modal */}
      {addCert && (
        <div
          onClick={() => setAddCert(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000c",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "24px",
              width: "100%",
              maxWidth: 380,
              animation: "scaleIn .2s ease",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 16 }}>
              Add Certification
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field
                label="Certification Name *"
                value={cItem.name}
                onChange={(v) => setCItem((x) => ({ ...x, name: v }))}
                placeholder="e.g. Google Analytics Certified"
              />
              <Field
                label="Issuing Organization"
                value={cItem.issuer}
                onChange={(v) => setCItem((x) => ({ ...x, issuer: v }))}
                placeholder="e.g. Google"
                icon="🏛️"
              />
              <Field
                label="Year"
                value={cItem.year}
                onChange={(v) => setCItem((x) => ({ ...x, year: v }))}
                placeholder="e.g. 2024"
                icon="📅"
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => setAddCert(false)}>
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  if (!cItem.name.trim()) return;
                  set("certifications", [...(p.certifications || []), cItem]);
                  setCItem({ name: "", issuer: "", year: "" });
                  setAddCert(false);
                }}
              >
                Add Cert
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════════ */
const FIXED_T = {
  id: "fixed_1",
  name: "Ms. Ritupruna Sharma",
  role: "Senior HR Manager",
  company: "TezConnect Member",
  rating: 4,
  quote:
    "Collaboration with Raj Sir was a great idea and has benefited me infinitely. I suggest you all to collaborate with him and build your career!",
  youtubeId: "bO4Uswvy-DE",
  avatarInitials: "RS",
  verified: true,
  date: "May 2025",
};

function VideoCard({ t }) {
  const [hov, setHov] = useState(false);
  const thumb = `https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov ? T.orange + "66" : T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "all .25s",
        transform: hov ? "translateY(-3px)" : "none",
        flexShrink: 0,
        width: 300,
      }}
    >
      <div
        onClick={() => window.open(`https://www.youtube.com/shorts/${t.youtubeId}`, "_blank")}
        style={{
          position: "relative",
          height: 170,
          overflow: "hidden",
          cursor: "pointer",
          background: "#111",
        }}
      >
        <img
          src={thumb}
          alt={t.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: hov ? 0.85 : 0.7,
            transition: "opacity .25s",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top,#07080ccc 0%,transparent 50%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#f97316,#ea6008)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 28px #f9731666",
              animation: "playPulse 2s ease infinite",
            }}
          >
            <span style={{ fontSize: 20, marginLeft: 3, color: "#fff" }}>▶</span>
          </div>
        </div>
        {t.verified && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              background: "#f9731622",
              border: "1px solid #f9731644",
              borderRadius: 20,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 700,
              color: T.orange,
            }}
          >
            ✓ Verified
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, left: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t.name}</div>
          <div style={{ fontSize: 10, color: "#ffffffaa" }}>{t.role}</div>
        </div>
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#f97316,#ea6008)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {t.avatarInitials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{t.name}</div>
              <div style={{ fontSize: 10, color: T.textMid }}>{t.role}</div>
            </div>
          </div>
          <div>
            <StarRating v={t.rating} />
            <div style={{ fontSize: 10, color: T.textLow, textAlign: "right" }}>
              {t.rating}/5
            </div>
          </div>
        </div>
        <div
          style={{
            background: T.bgInput,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "10px 12px",
            position: "relative",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: -1,
              left: 10,
              fontSize: 24,
              color: T.orange,
              lineHeight: 1,
              fontFamily: "Georgia,serif",
            }}
          >
            "
          </span>
          <p
            style={{
              color: "#c8cce0",
              fontSize: 12,
              lineHeight: 1.7,
              paddingTop: 8,
              fontStyle: "italic",
            }}
          >
            {t.quote}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR NAV
═══════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  
  { id: "profile", icon: "👤", label: "My Profile" },
  { id: "network", icon: "🌐", label: "Network" },
  { id: "leads", icon: "🎯", label: "Leads" },
  { id: "events", icon: "📅", label: "Events" },
  { id: "messages", icon: "💬", label: "Messages", badge: 3 },
  { id: "testimonials", icon: "🎬", label: "Testimonials" },
  { id: "settings", icon: "⚙", label: "Settings" },
  {id:"services", icon:"🚀", label:"Services"},
  {id:"analytics", icon:"📊", label:"Analytics"},
  {id:"refer",     icon:"🎁", label:"Refer & Earn"},
  {id:"wallet",    icon:"💳", label:"Wallet"}, 
   { id: "marketplace", icon: "🛍️", label: "Marketplace" },
  { id: "myproducts",  icon: "📦", label: "My Listings" },
   { id: "tezprints", icon: "🖨️", label: "Tez Prints" },
   { id: "appstore", icon: "📱", label: "Tez App Store" },
   { id: "orders", icon: "📦", label: "My Orders" },




];

function ProfilePct(p) {
  const checks = [
    !!p.name,
    !!p.photo,
    !!p.designation,
    !!p.bio,
    !!p.location,
    !!p.company,
    !!p.industry,
    !!p.experience,
    !!p.mobile,
    !!p.email,
    !!(p.skills?.length),
    !!(p.services?.length),
    !!(p.linkedin || p.instagram || p.facebook),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Sidebar({ active, onNav, session, profile, collapsed, onCollapse, onLogout,pendingCount=0,unreadMessages=0 }) {
  const initials = (session.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const pct = ProfilePct(profile);

  return (
    <div
      style={{
        width: collapsed ? 68 : 240,
        height: "100vh",
        background: T.sidebar,
        borderRight: `1px solid ${T.sidebarBorder}`,
        display: "flex",
        flexDirection: "column",
        transition: "width .25s ease",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 40,
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "16px 18px" : "18px 20px",
          borderBottom: `1px solid ${T.sidebarBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 70,
        }}
      >
        <Logo size="sm" collapsed={collapsed} />
        <button
          onClick={onCollapse}
          style={{
            background: "none",
            border: "none",
            color: T.textLow,
            cursor: "pointer",
            fontSize: 18,
            padding: 4,
            flexShrink: 0,
            display: "flex",
          }}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* User mini */}
      {!collapsed && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${T.sidebarBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#f97316,#ea6008)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: T.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.name}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.textLow,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {profile.designation || session.email}
              </div>
            </div>
          </div>
          {/* completeness mini bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 3,
                background: T.border,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#f97316,#fbbf24)",
                  borderRadius: 4,
                  transition: "width .5s",
                }}
              />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, flexShrink: 0 }}>
              {pct}%
            </span>
          </div>
          <div style={{ fontSize: 10, color: T.textLow, marginTop: 3 }}>Profile complete</div>
        </div>
      )}

      {/* Nav items */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "12px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? T.orangeMd : "transparent",
                border: `1px solid ${isActive ? T.orange + "44" : "transparent"}`,
                borderRadius: 9,
                color: isActive ? T.orange : T.textMid,
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all .18s",
                position: "relative",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = T.bgHover;
                  e.currentTarget.style.color = T.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = T.textMid;
                }
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>}

              {!collapsed && (
  (item.id === "network" && pendingCount > 0) ||
  (item.id === "messages" && unreadMessages > 0)
) && (
                <span
                  style={{
                    background: T.orange,
                    color: "#fff",
                    borderRadius: 20,
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 7px",
                  }}
                >
                  {item.id==="network" ?pendingCount:unreadMessages}
                </span>
              )}
              {collapsed && item.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    background: T.orange,
                    borderRadius: "50%",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${T.sidebarBorder}` }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "12px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            background: "transparent",
            border: "1px solid transparent",
            borderRadius: 9,
            color: T.error,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            transition: "all .18s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.errorLo;
            e.currentTarget.style.borderColor = T.error + "33";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <span style={{ fontSize: 17, flexShrink: 0 }}>⏏</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AIMS DATA
═══════════════════════════════════════════════════════════ */
const AIMS = [
  {
    icon: "🤝",
    title: "Build Professional Connections",
    desc: "Connect with verified B2B professionals and industry leaders across sectors.",
    color: "#f97316",
    tag: "Networking",
  },
  {
    icon: "🎯",
    title: "Generate Business Leads",
    desc: "Discover high-intent prospects and turn introductions into revenue opportunities.",
    color: "#3b82f6",
    tag: "Leads",
  },
  {
    icon: "📣",
    title: "Promote Services & Products",
    desc: "Showcase your offerings to a targeted professional audience.",
    color: "#22c55e",
    tag: "Marketing",
  },
  {
    icon: "🏘️",
    title: "Join Business Communities",
    desc: "Engage in industry groups, share expertise, and grow your reputation.",
    color: "#a78bfa",
    tag: "Community",
  },
  {
    icon: "📅",
    title: "Attend Networking Events",
    desc: "RSVP to B2B conferences, workshops, and virtual meetups.",
    color: "#fbbf24",
    tag: "Events",
  },
  {
    icon: "💡",
    title: "Share Opportunities",
    desc: "Post and discover partnerships, projects, and co-founder opportunities.",
    color: "#f87171",
    tag: "Opportunities",
  },
  {
    icon: "🔗",
    title: "Conduct B2B Collaborations",
    desc: "Find strategic partners, vendors, and collaborators to scale your business.",
    color: "#06b6d4",
    tag: "Collaboration",
  },
  {
    icon: "💬",
    title: "WhatsApp Communication",
    desc: "Continue conversations on WhatsApp — fast, direct, and personal.",
    color: "#25d366",
    tag: "Messaging",
  },
  {
    icon: "🪪",
    title: "Digital Business Profiles",
    desc: "Build a rich, searchable profile that works as your digital business card.",
    color: "#f97316",
    tag: "Profile",
  },
];

/* ═══════════════════════════════════════════════════════════
   PAGE SCREENS
═══════════════════════════════════════════════════════════ */
function AimCard({ aim, i }) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? T.bgHover : T.bgCard,
        border: `1px solid ${h ? aim.color + "55" : T.border}`,
        borderRadius: 14,
        padding: "18px 16px",
        transition: "all .22s",
        transform: h ? "translateY(-2px)" : "none",
        boxShadow: h ? `0 10px 30px ${aim.color}15` : "none",
        animation: `fadeUp .4s ease ${i * 40}ms both`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: aim.color + "18", border: `1px solid ${aim.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>
          {aim.icon}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: ".09em",
          textTransform: "uppercase", color: aim.color,
          background: aim.color + "18", border: `1px solid ${aim.color}33`,
          borderRadius: 20, padding: "2px 8px",
        }}>
          {aim.tag}
        </span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 5, lineHeight: 1.3 }}>
        {aim.title}
      </div>
      <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>
        {aim.desc}
      </div>
    </div>
  );
}
function DashboardScreen({ session, profile, onGoProfile, onNav ,onUpgradeClick}) {
  const stats = useDashboardStats(session.userId);
  const pct = ProfilePct(profile);
  const firstName = session.name?.split(" ")[0] || "there";

  const statCards = [
    { icon: "👥", label: "Connections", value: stats.connections ?? "—", color: "#3b82f6", bg: "#1e3a5f", trend: "+12%", emoji: "↑" },
    { icon: "🎯", label: "Leads",        value: stats.leads       ?? "—", color: "#a855f7", bg: "#3b1f5e", trend: "+18%", emoji: "↑" },
    { icon: "👁️", label: "Profile Views", value: stats.views      ?? "—", color: "#f97316", bg: "#5f2a00", trend: "+24%", emoji: "↑" },
    { icon: "💬", label: "Messages",     value: stats.messages    ?? "—", color: "#06b6d4", bg: "#0c3a4a", trend: "+8%",  emoji: "↑" },
  ];

  const exploreItems = [
    { id: "marketplace",  label: "Marketplace",  sub: "Buy products & services",         emoji: "🛍️",  bg: "linear-gradient(135deg,#c2410c,#f97316)" },
    { id: "myproducts",   label: "My Listings",  sub: "Sell your products & services",   emoji: "📦",  bg: "linear-gradient(135deg,#15803d,#22c55e)" },
    { id: "network",      label: "Network",      sub: "Connect with professionals",       emoji: "🌐",  bg: "linear-gradient(135deg,#1d4ed8,#60a5fa)" },
    { id: "services",     label: "Promote",      sub: "Boost your business",              emoji: "📣",  bg: "linear-gradient(135deg,#7c3aed,#a78bfa)" },
    { id: "tezprints",    label: "Tez Prints",   sub: "Official merchandise & prints",    emoji: "🖨️",  bg: "linear-gradient(135deg,#b45309,#fbbf24)" },
    { id: "appstore",     label: "App Store",    sub: "CapCut, Canva & more",             emoji: "📱",  bg: "linear-gradient(135deg,#0e7490,#38bdf8)" },
    { id: "events",       label: "Events",       sub: "Browse & register for events",     emoji: "📅",  bg: "linear-gradient(135deg,#be123c,#f43f5e)" },
    { id: "leads",        label: "Leads",        sub: "Manage your business leads",       emoji: "🎯",  bg: "linear-gradient(135deg,#4f46e5,#818cf8)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp .35s ease" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        borderRadius: 24,
        padding: "28px 24px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg,#0a0f2e 0%,#0d1545 40%,#0a1628 100%)",
        border: "1px solid #1e2d6b",
        minHeight: 220,
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,#3b82f620 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle,#f9731615 0%,transparent 70%)", pointerEvents: "none" }} />

        {/* Rocket illustration — SVG inline */}
        <div style={{ position: "absolute", top: 16, right: 16, fontSize: 80, opacity: 0.9, userSelect: "none", animation: "fadeUp .6s ease" }}>🚀</div>
        <div style={{ position: "absolute", top: 60, right: 80, fontSize: 28, opacity: 0.6, animation: "pulse 2s ease infinite" }}>📊</div>
        <div style={{ position: "absolute", top: 110, right: 36, fontSize: 22, opacity: 0.5, animation: "pulse 2.5s ease infinite" }}>🎯</div>
        <div style={{ position: "absolute", top: 28, right: 140, fontSize: 20, opacity: 0.4, animation: "pulse 3s ease infinite" }}>👥</div>

        {/* Dotted trail */}
        <div style={{ position: "absolute", top: 50, right: 60, width: 120, height: 120, background: "radial-gradient(ellipse,#f9731610 0%,transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        {/* Content */}
        <div style={{ position: "relative", maxWidth: "62%" }}>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontStyle: "italic", fontSize: 15, color: "#94a3b8", marginBottom: 2, letterSpacing: ".01em" }}>
            Welcome back,
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 30, color: T.text, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 10 }}>
            {firstName} <span style={{ display: "inline-block" }}>👋</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
            Your <strong style={{ color: T.orange }}>TezConnect B2B</strong> dashboard.<br />
            Build connections, generate leads, and grow your business.
          </p>

          {/* Profile completeness */}
          <div style={{ background: "#ffffff10", backdropFilter: "blur(8px)", border: "1px solid #ffffff18", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Profile Completeness</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: T.orange }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: "#ffffff18", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#f97316,#fbbf24)", borderRadius: 4, transition: "width .8s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>Complete your profile to unlock full visibility</div>
          </div>

          {pct < 100 && (
            <button
              onClick={onGoProfile}
              style={{ background: "transparent", border: "1.5px solid #f97316", borderRadius: 10, padding: "9px 18px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              Complete Profile →
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {statCards.map((s, i) => (
          <div key={s.label} style={{ background: `linear-gradient(135deg,${s.bg}cc,#0b0d1799)`, border: `1px solid ${s.color}33`, borderRadius: 18, padding: "16px", position: "relative", overflow: "hidden", animation: `fadeUp .4s ease ${i * 60}ms both` }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle,${s.color}22 0%,transparent 70%)` }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: s.color + "28", border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
              <span style={{ fontSize: 10, color: T.success, fontWeight: 700, background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 20, padding: "2px 7px" }}>{s.emoji} {s.trend}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 26, color: T.text, letterSpacing: "-.02em", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            {/* Mini wave */}
            <div style={{ marginTop: 10, height: 24, opacity: 0.4 }}>
              <svg viewBox="0 0 80 24" width="100%" height="24" preserveAspectRatio="none">
                <polyline points="0,18 12,12 24,16 36,8 48,14 60,6 72,10 80,4" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── Explore TezConnect ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Explore TezConnect</span>
            <span style={{ fontSize: 16 }}>✨</span>
          </div>
          <button style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            See all ›
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {exploreItems.map((item, i) => (
            <div
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{ borderRadius: 18, padding: "18px 16px", cursor: "pointer", position: "relative", overflow: "hidden", background: item.bg, transition: "transform .2s, box-shadow .2s", animation: `fadeUp .4s ease ${i * 50}ms both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px #00000066"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Glow */}
              <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "#ffffff10", pointerEvents: "none" }} />

              {/* Emoji illustration */}
              <div style={{ fontSize: 36, marginBottom: 8, filter: "drop-shadow(0 4px 8px #00000044)" }}>{item.emoji}</div>

              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 4, lineHeight: 1.2 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.4, marginBottom: 12 }}>{item.sub}</div>

              {/* Arrow button */}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ffffff22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>→</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Premium Banner ── */}
      <div style={{ borderRadius: 20, padding: "20px 20px", background: "linear-gradient(135deg,#1a0a2e,#2d1854,#1a0a2e)", border: "1px solid #7c3aed44", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,#a855f720 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 44, flexShrink: 0, filter: "drop-shadow(0 4px 12px #f9731444)" }}>👑</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, lineHeight: 1.2, marginBottom: 4 }}>
            Unlock <span style={{ color: T.orange }}>Premium Benefits</span>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Get more visibility, leads & growth</div>
        </div>
        <button
          onClick={onUpgradeClick}
          style={{ flexShrink: 0, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "10px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 16px #f9731444" }}>
          Upgrade Now →
        </button>
      </div>

      {/* ── What You Can Do ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Platform Capabilities</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {AIMS.map((aim, i) => (
            <AimCard key={aim.title} aim={aim} i={i} />
          ))}
        </div>
      </div>

    </div>
  );
}


function MobileTestimonialCard({ t }) {
  const [expanded, setExpanded] = useState(false);
  const [hov, setHov] = useState(false);
  const thumb = t.youtubeId
    ? `https://img.youtube.com/vi/${t.youtubeId}/hqdefault.jpg`
    : null;

  const shortQuote = t.quote.length > 120 ? t.quote.slice(0, 120) + "…" : t.quote;

  return (
    <div
      style={{
        background: T.bgCard, border: `1px solid ${hov ? T.orange+"66" : T.border}`,
        borderRadius: 16, overflow: "hidden", transition: "all .2s",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Video thumbnail */}
      {thumb && (
        <div
          onClick={() => window.open(`https://www.youtube.com/shorts/${t.youtubeId}`, "_blank")}
          style={{ position:"relative", height:200, overflow:"hidden", cursor:"pointer", background:"#111" }}
        >
          <img src={thumb} alt={t.name} style={{ width:"100%", height:"100%", objectFit:"cover", opacity:.8 }}/>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,#07080ccc 0%,transparent 50%)" }}/>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 28px #f9731666", animation:"playPulse 2s ease infinite" }}>
              <span style={{ fontSize:22, marginLeft:3, color:"#fff" }}>▶</span>
            </div>
          </div>
          {t.verified && (
            <div style={{ position:"absolute", top:10, right:10, background:"#f9731622", border:"1px solid #f9731644", borderRadius:20, padding:"2px 9px", fontSize:10, fontWeight:700, color:T.orange }}>
              ✓ Verified
            </div>
          )}
          <div style={{ position:"absolute", bottom:10, left:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{t.name}</div>
            <div style={{ fontSize:11, color:"#ffffffaa" }}>{t.role}</div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding:"16px" }}>
        {/* Author + rating */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {t.avatarInitials}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{t.name}</div>
              <div style={{ fontSize:11, color:T.textMid }}>{t.role}</div>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <StarRating v={t.rating}/>
            <div style={{ fontSize:10, color:T.textLow, marginTop:2 }}>{t.rating}/5</div>
          </div>
        </div>

        {/* Quote */}
        <div style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 14px", position:"relative" }}>
          <span style={{ position:"absolute", top:-1, left:10, fontSize:24, color:T.orange, lineHeight:1, fontFamily:"Georgia,serif" }}>"</span>
          <p style={{ color:"#c8cce0", fontSize:13, lineHeight:1.7, paddingTop:8, fontStyle:"italic" }}>
            {expanded ? t.quote : shortQuote}
          </p>
          {t.quote.length > 120 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background:"none", border:"none", color:T.orange, fontSize:12, fontWeight:700, cursor:"pointer", padding:"4px 0 0", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function TestimonialsScreen({ session }) {
  const [list,    setList]    = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({name:"",role:"",quote:"",url:"",rating:5});
  const [addErr,  setAddErr]  = useState("");
  const [loading, setLoading] = useState(true);
  const isMobile = window.innerWidth <= 768;

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials").select("*")
      .order("created_at", { ascending: false });
    setList(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchTestimonials(); }, []);

  const extractYT = s => {
    const m = s.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.quote.trim()) { setAddErr("Name and quote are required."); return; }
    const ytId = extractYT(addForm.url.trim());
    if (addForm.url && !ytId) { setAddErr("Please enter a valid YouTube URL."); return; }
    const { error } = await supabase.from("testimonials").insert({
      user_id: session.userId,
      name: addForm.name.trim(),
      role: addForm.role.trim() || "TezConnect Member",
      quote: addForm.quote.trim(),
      youtube_id: ytId || "",
      rating: addForm.rating,
      verified: false,
    });
    if (error) { setAddErr(error.message); return; }
    setAddForm({ name:"",role:"",quote:"",url:"",rating:5 });
    setAddErr(""); setShowAdd(false); fetchTestimonials();
  };

  const mapped = list.map(t => ({
    id: t.id, name: t.name, role: t.role, rating: t.rating, quote: t.quote,
    youtubeId: t.youtube_id,
    avatarInitials: (t.name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),
    verified: t.verified,
    date: new Date(t.created_at).toLocaleDateString("en-IN", { month:"short", year:"numeric" }),
  }));

  return (
    <div style={{ animation: "fadeUp .35s ease" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:T.textLow, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>
            🎬 Video Testimonials
          </div>
          <h3 style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-.03em" }}>
            What Our Members <span style={{ color:T.orange }}>Say</span>
          </h3>
        </div>
        <Btn onClick={() => setShowAdd(true)} small icon="+">Add Testimonial</Btn>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"40px 0" }}>
          <Spinner/><span style={{ color:T.textMid, fontSize:13 }}>Loading testimonials…</span>
        </div>
      )}

      {/* Mobile — vertical stack */}
      {!loading && isMobile && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {mapped.map(t => <MobileTestimonialCard key={t.id} t={t}/>)}
          {/* Add card */}
          <div
            onClick={() => setShowAdd(true)}
            style={{ background:T.bgCard, border:`2px dashed ${T.border}`, borderRadius:16, padding:"28px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, cursor:"pointer", textAlign:"center" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.orange+"66"}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <div style={{ width:52, height:52, borderRadius:"50%", background:T.orangeLo, border:`1px solid ${T.orange}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎬</div>
            <div style={{ fontSize:13, color:T.textMid, lineHeight:1.5 }}>Share your TezConnect success story</div>
            <div style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", borderRadius:8, padding:"8px 20px", fontSize:12, fontWeight:700, color:"#fff" }}>+ Add Yours</div>
          </div>
        </div>
      )}

      {/* Desktop — horizontal scroll */}
      {!loading && !isMobile && (
        <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:8 }}>
          {mapped.map(t => <VideoCard key={t.id} t={t}/>)}
          <div
            onClick={() => setShowAdd(true)}
            style={{ flexShrink:0, width:200, background:T.bgCard, border:`2px dashed ${T.border}`, borderRadius:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:20, cursor:"pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.orange+"66"}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <div style={{ width:50, height:50, borderRadius:"50%", background:T.orangeLo, border:`1px solid ${T.orange}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🎬</div>
            <div style={{ textAlign:"center", fontSize:12, color:T.textMid, lineHeight:1.5 }}>Share your TezConnect success story</div>
            <div style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", borderRadius:8, padding:"7px 16px", fontSize:11, fontWeight:700, color:"#fff" }}>+ Add Yours</div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position:"fixed", inset:0, background:"#000c", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"24px", width:"100%", maxWidth:420, animation:"scaleIn .2s ease" }}>
            <div style={{ fontWeight:800, fontSize:17, color:T.text, marginBottom:16 }}>Add Your Testimonial</div>
            {addErr && <Alert type="error" onDismiss={() => setAddErr("")}>{addErr}</Alert>}
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:addErr?14:0 }}>
              <Field label="Your Name *" value={addForm.name} onChange={v => setAddForm(f=>({...f,name:v}))} placeholder="e.g. Priya Sharma" icon="👤"/>
              <Field label="Your Role" value={addForm.role} onChange={v => setAddForm(f=>({...f,role:v}))} placeholder="e.g. Startup Founder" icon="💼"/>
              <Field label="YouTube URL" value={addForm.url} onChange={v => setAddForm(f=>({...f,url:v}))} placeholder="https://youtu.be/..." icon="🔗"/>
              <Field label="Your Quote *" value={addForm.quote} onChange={v => setAddForm(f=>({...f,quote:v}))} placeholder="Share your experience..." multiline icon="💬"/>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em" }}>Rating</label>
                <StarRating v={addForm.rating} interactive onChange={v => setAddForm(f=>({...f,rating:v}))} size={22}/>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
              <Btn onClick={handleAdd}>Submit 🚀</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PlaceholderScreen({ icon, title, desc }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        textAlign: "center",
        gap: 16,
        animation: "fadeUp .3s ease",
      }}
    >
      <div style={{ fontSize: 60 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: T.text }}>{title}</div>
      <div style={{ color: T.textMid, fontSize: 14, maxWidth: 360, lineHeight: 1.7 }}>{desc}</div>
      <div
        style={{
          background: T.orangeLo,
          border: `1px solid ${T.orange}33`,
          borderRadius: 10,
          padding: "10px 20px",
          fontSize: 12,
          color: T.orange,
          fontWeight: 700,
        }}
      >
        Coming Soon
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH SCREENS
═══════════════════════════════════════════════════════════ */
function AuthCard({ children }) {
  return (
    <div
      style={{
        background: T.bgCard,
        border: `1px solid ${T.border}`,
        borderRadius: 20,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 420,
        animation: "fadeUp .4s ease",
        position: "relative",
        zIndex: 1,
        boxShadow: "0 40px 80px #00000077",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: 1,
          background: "linear-gradient(90deg,transparent,#f9731666,transparent)",
        }}
      />
      {children}
    </div>
  );
}

function PasswordStrength({ pwd }) {
  if (!pwd) return null;
  const c = [
    { ok: pwd.length >= 8, l: "8+ chars" },
    { ok: /[A-Z]/.test(pwd), l: "Uppercase" },
    { ok: /\d/.test(pwd), l: "Number" },
    { ok: /[^a-zA-Z0-9]/.test(pwd), l: "Symbol" },
  ];
  const score = c.filter((x) => x.ok).length;
  const cols = ["", T.error, "#f59e0b", T.orange, T.success];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 4,
              background: i <= score ? cols[score] : T.border,
              transition: "background .3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {c.map((x) => (
          <span
            key={x.l}
            style={{
              fontSize: 10,
              color: x.ok ? T.success : T.textLow,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span>{x.ok ? "✓" : "○"}</span>
            {x.l}
          </span>
        ))}
      </div>
    </div>
  );
}

function SignUpPage({ onNav }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [gErr, setGErr] = useState("");
  const [done, setDone] = useState(false);
  const setF = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrs((e) => ({ ...e, [k]: "" }));
    setGErr("");
  };

  const validate = () => {
    const e = {};
    if (!clean(form.name)) e.name = "Full name is required.";
    else if (clean(form.name).length < 2) e.name = "Min. 2 characters.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!isEmail(form.email)) e.email = "Please enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Min. 8 characters.";
    if (!form.confirm) e.confirm = "Please confirm password.";
    else if (form.password !== form.confirm) e.confirm = "Passwords do not match.";
    return e;
  };
const submit = async () => {
  const e = validate();
  if (Object.keys(e).length) {
    setErrs(e);
    return;
  }
  setLoading(true);
  const { error } = await supabase.auth.signUp({
    email: clean(form.email).toLowerCase(),
    password: form.password,
    options: {
      data: { name: clean(form.name) }
    }
  });
  if (error) {
    setGErr(error.message);
    setLoading(false);
    return;
  }
  setDone(true);
  setLoading(false);
  
};

  if (done)
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Background />
      <div style={{ textAlign: "center", zIndex: 1, animation: "scaleIn .4s ease", maxWidth: 400, padding: "0 20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.successLo, border: `2px solid ${T.success}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 16px" }}>
          ✉
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: T.text, marginBottom: 8 }}>
          Check your email!
        </div>
        <div style={{ color: T.textMid, fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
          We sent a verification link to <span style={{ color: T.orange, fontWeight: 700 }}>{form.email}</span>. Click the link in that email to activate your account.
        </div>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: T.textLow, lineHeight: 1.8 }}>
            ✅ Check your spam folder if you don't see it<br/>
            ✅ The link expires in 24 hours<br/>
            ✅ After verifying, come back and sign in
          </div>
        </div>
        <Btn onClick={() => onNav("signin")} fullWidth>
          Go to Sign In
        </Btn>
      </div>
    </div>
  );
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        position: "relative",
      }}
    >
      <Background />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Join the Network
          </h1>
          <p style={{ color: T.textMid, fontSize: 13 }}>
            Create your B2B profile and start connecting.
          </p>
        </div>
        <AuthCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {gErr && (
              <Alert type="error" onDismiss={() => setGErr("")}>
                {gErr}
              </Alert>
            )}
            <Field
              label="Full Name"
              value={form.name}
              onChange={setF("name")}
              placeholder="e.g. Arjun Mehta"
              icon="👤"
              error={errs.name}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={setF("email")}
              placeholder="you@company.com"
              icon="✉"
              error={errs.email}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={setF("password")}
                placeholder="Min. 8 characters"
                icon="🔒"
                error={errs.password}
              />
              <PasswordStrength pwd={form.password} />
            </div>
            <Field
              label="Confirm Password"
              type="password"
              value={form.confirm}
              onChange={setF("confirm")}
              placeholder="Repeat your password"
              icon="🔒"
              error={errs.confirm}
            />
            <div style={{ paddingTop: 4 }}>
              <Btn onClick={submit} loading={loading} fullWidth>
                Create Account
              </Btn>
            </div>
            <Divider label="already a member?" />
            <Btn variant="ghost" onClick={() => onNav("signin")} fullWidth>
              Sign In Instead
            </Btn>
          </div>
        </AuthCard>
        <p style={{ textAlign: "center", fontSize: 10, color: T.textLow, zIndex: 1 }}>
          Passwords hashed with SHA-256 · Never stored as plain text
        </p>
      </div>
    </div>
  );
}

function SignInPage({ onNav, onLogin, prefill = "" }) {
  const [form, setForm] = useState({ email: prefill, password: "" });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [gErr, setGErr] = useState("");
  const justReg = !!prefill;
  const setF = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrs((e) => ({ ...e, [k]: "" }));
    setGErr("");
  };

  const submit = async () => {
  const e = {};
  if (!form.email.trim()) e.email = "Email is required.";
  else if (!isEmail(form.email)) e.email = "Enter a valid email.";
  if (!form.password) e.password = "Password is required.";
  if (Object.keys(e).length) {
    setErrs(e);
    return;
  }
  setLoading(true);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: clean(form.email).toLowerCase(),
    password: form.password,
  });
  if (error) {
  if (error.message.toLowerCase().includes("email not confirmed")) {
    setGErr("Please verify your email first. Check your inbox for the confirmation link.");
  } else {
    setGErr(error.message);
  }
  setLoading(false);
  return;
}
  onLogin({
    userId: data.user.id,
    name: data.user.user_metadata.name,
    email: data.user.email,
  });
};

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        position: "relative",
      }}
    >
      <Background />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Welcome Back
          </h1>
          <p style={{ color: T.textMid, fontSize: 13 }}>Sign in to your B2B dashboard.</p>
        </div>
        <AuthCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {justReg && (
              <Alert type="success">Account created successfully — sign in to continue.</Alert>
            )}
            {gErr && (
              <Alert type="error" onDismiss={() => setGErr("")}>
                {gErr}
                {gErr.includes("sign up") && (
                  <span
                    onClick={() => onNav("signup")}
                    style={{ color: T.orangeHi, cursor: "pointer", marginLeft: 4, fontWeight: 700 }}
                  >
                    Create one →
                  </span>
                )}
                {gErr.includes("verify your email") && (
  <div style={{ textAlign: "center" }}>
    <button
      onClick={async () => {
        await supabase.auth.resend({
          type: "signup",
          email: form.email.trim().toLowerCase(),
        });
        setGErr("Verification email resent — check your inbox.");
      }}
      style={{ background: "none", border: "none", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
    >
      Resend verification email
    </button>
  </div>
)}
              </Alert>
            )}
            <div onKeyDown={(e) => e.key === "Enter" && submit()}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={setF("email")}
                  placeholder="you@company.com"
                  icon="✉"
                  error={errs.email}
                />
                <Field
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={setF("password")}
                  placeholder="Your password"
                  icon="🔒"
                  error={errs.password}
                />
              </div>
            </div>
             <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginTop: -8,
  }}
>
  <span
     onClick={()=> onNav("forgot-password")}
    style={{
      color: "#F97316",
      hover:"#EA580C",

      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
    }}
  >
    Forgot Password?
  </span>
</div>
            <div style={{ paddingTop: 4 }}>
              <Btn onClick={submit} loading={loading} fullWidth>
                Sign In
              </Btn>
            </div>
            <Divider label="new to TezConnect?" />
            <Btn variant="ghost" onClick={() => onNav("signup")} fullWidth>
              Create an Account
            </Btn>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}
{/*Forgot password*/}
/* ═══════════════════════════════════════════════════════════
   FORGOT PASSWORD PAGE
═══════════════════════════════════════════════════════════ */
function ForgotPasswordPage({ onNav }) {
  // Add the missing states to prevent the blank page crash
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (supabaseError) {
      setError(supabaseError.message);
    } else {
      setMessage("Check your email for the password reset link.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        position: "relative",
      }}
    >
      <Background />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Reset Password
          </h1>
          <p style={{ color: T.textMid, fontSize: 13 }}>
            Enter your email to receive a recovery link.
          </p>
        </div>

        <AuthCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <Alert type="error" onDismiss={() => setError("")}>
                {error}
              </Alert>
            )}
            {message && (
              <Alert type="success">
                {message}
              </Alert>
            )}

            <div onKeyDown={(e) => e.key === "Enter" && handleReset(e)}>
              <Field
                label="Email Address"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setError("");
                }}
                placeholder="you@company.com"
                icon="✉"
              />
            </div>

            <div style={{ paddingTop: 4 }}>
              <Btn onClick={handleReset} loading={loading} fullWidth>
                Send Reset Link
              </Btn>
            </div>

            <Divider label="Remembered it?" />
            
            <Btn variant="ghost" onClick={() => onNav("signin")} fullWidth>
              Back to Sign In
            </Btn>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}

{/* update password*/}
/* ═══════════════════════════════════════════════════════════
   UPDATE PASSWORD PAGE
═══════════════════════════════════════════════════════════ */
function UpdatePasswordPage({ onNav }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updatePassword = async () => {
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: supabaseError } = await supabase.auth.updateUser({ password });
    
    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        onNav("signin");
      }, 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        position: "relative",
      }}
    >
      <Background />
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif',serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 28,
              color: T.text,
              marginBottom: 6,
            }}
          >
            Create New Password
          </h1>
          <p style={{ color: T.textMid, fontSize: 13 }}>
            Please enter a strong new password for your account.
          </p>
        </div>

        <AuthCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <Alert type="error" onDismiss={() => setError("")}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert type="success">
                Password updated successfully! Redirecting to sign in...
              </Alert>
            )}

            <div onKeyDown={(e) => e.key === "Enter" && updatePassword()}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Field
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  placeholder="Minimum 8 characters"
                  icon="🔒"
                />
                <PasswordStrength pwd={password} />
              </div>
            </div>

            <div style={{ paddingTop: 4 }}>
              <Btn onClick={updatePassword} loading={loading} disabled={success} fullWidth>
                Update Password
              </Btn>
            </div>
          </div>
        </AuthCard>
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════
   MAIN APP SHELL
═══════════════════════════════════════════════════════════ */
function AppShell({ session, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [profile, setProfile] = useState({});
const [profileLoading, setProfileLoading] = useState(true);
const [viewingUserId, setViewingUserId] = useState(null);

const { pendingReceived, accepted, getStatus, sendRequest,
        acceptRequest, rejectRequest, removeConnection } = useConnections(session.userId);
const [showNotifications, setShowNotifications] = useState(false);
const { unreadCount: notifUnread } = useNotifications(session.userId);
const isMobile = useIsMobile();
const [showMoreMenu, setShowMoreMenu] = useState(false);
 const [showShare, setShowShare] = useState(false);
const [viewedProfile, setViewedProfile] = useState(null);
const [showPremiumModal, setShowPremiumModal] = useState(false);

const mapProfileRow = (data) => ({
  id: data.id,
  name: data.name || "",
  photo: data.photo || "",
  cover: data.cover || "",
  designation: data.designation || "",
  bio: data.bio || "",
  location: data.location || "",
  company: data.company || "",
  companyLogo: data.company_logo || "",
  industry: data.industry || "",
  category: data.category || "",
  experience: data.experience || "",
  teamSize: data.team_size || "",
  website: data.website || "",
  mobile: data.mobile || "",
  whatsapp: data.whatsapp || "",
  linkedin: data.linkedin || "",
  facebook: data.facebook || "",
  instagram: data.instagram || "",
  twitter: data.twitter || "",
  youtube: data.youtube || "",
  skills: data.skills || [],
  services: data.services || [],
  achievements: data.achievements || [],
  portfolio: data.portfolio || [],
  certifications: data.certifications || [],
});

const handleViewProfile = useCallback(async (contactOrId) => {
  const userId = typeof contactOrId === "string" ? contactOrId : contactOrId?.id;
  if (!userId) return;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) { console.error("handleViewProfile fetch failed:", error); return; }
  setViewedProfile(mapProfileRow(data));
  setPage("publicprofile");
}, []);

// kept as a fallback path in case anything else in the app still dispatches this event
useEffect(() => {
  const handler = (e) => {
    if (e.detail?.userId) handleViewProfile(e.detail.userId);
  };
  window.addEventListener("tez-view-profile", handler);
  return () => window.removeEventListener("tez-view-profile", handler);
}, [handleViewProfile]);

 
  


useEffect(() => {
  supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single()
    .then(({ data }) => {
      if (data) {
        setProfile({
          name: data.name || "",
          photo: data.photo || "",
          cover: data.cover || "",
          designation: data.designation || "",
          bio: data.bio || "",
          location: data.location || "",
          company: data.company || "",
          companyLogo: data.company_logo || "",
          industry: data.industry || "",
          category: data.category || "",
          experience: data.experience || "",
          teamSize: data.team_size || "",
          website: data.website || "",
          mobile: data.mobile || "",
          whatsapp: data.whatsapp || "",
          linkedin: data.linkedin || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          twitter: data.twitter || "",
          youtube: data.youtube || "",
          skills: data.skills || [],
          services: data.services || [],
          achievements: data.achievements || [],
          portfolio: data.portfolio || [],
          certifications: data.certifications || [],
        });
      }
      setProfileLoading(false);
    });
}, [session.userId]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
const [chatTarget, setChatTarget] = useState(null);
  

const handleMessageUser = useCallback((profileToMessage) => {
  setChatTarget(profileToMessage);
  setPage("messages");
}, []);
const clearChatTarget = useCallback(() => setChatTarget(null), []);
  const handleSaveProfile = async (p) => {
  const merged = { ...profile, ...p };
  setProfile(merged);
  await supabase.from("profiles").upsert({
    id: session.userId,
    name: merged.name,
    designation: merged.designation,
    bio: merged.bio,
    location: merged.location,
    photo: merged.photo,
    cover: merged.cover,
    company: merged.company,
    company_logo: merged.companyLogo,
    industry: merged.industry,
    category: merged.category,
    experience: merged.experience,
    team_size: merged.teamSize,
    website: merged.website,
    mobile: merged.mobile,
    whatsapp: merged.whatsapp,
    linkedin: merged.linkedin,
    facebook: merged.facebook,
    instagram: merged.instagram,
    twitter: merged.twitter,
    youtube: merged.youtube,
    skills: merged.skills,
    services: merged.services,
    achievements: merged.achievements,
    portfolio: merged.portfolio,
    certifications: merged.certifications,
    updated_at: new Date().toISOString(),
  });
};
const [unreadMessages, setUnreadMessages] = useState(0);

useEffect(() => {
  if (!session?.userId) return;
  supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", session.userId)
    .eq("read", false)
    .then(({ count }) => setUnreadMessages(count || 0));

  const sub = supabase
    .channel("unread_channel")
    .on("postgres_changes", {
      event: "*", schema: "public", table: "messages",
    }, () => {
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", session.userId)
        .eq("read", false)
        .then(({ count }) => setUnreadMessages(count || 0));
    })
    .subscribe();

  return () => supabase.removeChannel(sub);
}, [session?.userId]);

  const renderPage = () => {
    if (page === "profile") {
      return editingProfile ? (
        <ProfileEditor
          profile={profile}
          session={session}
          onSave={(p) => {
            handleSaveProfile(p);
          }}
          onCancel={() => setEditingProfile(false)}
        />
      ) : (
        <PublicProfilePage profile={profile} onEdit={() => setEditingProfile(true)} session={session}/>
      );
    }
     if (page === "dashboard") {
  return (
    <DashboardScreen
      session={session}
      profile={profile}
      onGoProfile={() => {
        setPage("profile");
        setEditingProfile(true);
      }}
      onNav={(p) => { setPage(p); if (p !== "profile") setEditingProfile(false); }}
       onUpgradeClick={() => setShowPremiumModal(true)}
    />
  );
}

if (page === "publicprofile") return <PublicProfilePage profile={viewedProfile} session={session} onMessage={handleMessageUser}/>;

if (page === "orders") return <OrdersPage session={session}/>;
  

    if (page === "services") {
  return <ServicesPage session={session} />;
}
if (page === "appstore") return <TezAppStorePage session={session}/>;


    if (page === "testimonials") {
      return <TestimonialsScreen session={session} />;
    }

    if (page === "network") {
      return <NetworkPage session={session} onMessage={handleMessageUser} />;
    }

    if (page === "leads") {
      return <LeadsPage session={session} />;
    }

    if (page === "events") {
      return <EventsPage session={session} />;
    }

    if (page === "messages") {
  return <MessagesPage session={session} onViewProfile={handleViewProfile} openChatWith={chatTarget} onOpened={clearChatTarget}  />;
}

     if (page==="marketplace") return <MarketplacePage session={session}/>;
if (page==="myproducts")  return <MyProductsPage session={session}/>;
if (page === "tezprints") return <TezPrintsPage session={session} onNav={setPage}/>;

    
     if (page==="analytics") return <LeadAnalyticsPage session={session}/>;
if (page==="refer")     return <ReferEarnPage session={session}/>;
if (page==="wallet")    return <WalletPage session={session}/>;


    if (page === "settings") {
      return (
        <SettingsPage
          session={session}
          profile={profile}
          onSaveProfile={handleSaveProfile}
          onLogout={onLogout}
        />
      );
    }

    return null;
  };
/*
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: T.bg,
        position: "relati
      <Background />
      {
      <Sidebar
        active={page}
        onNav={(p) => {
          setPage(p);
          if (p !== "profile") setEditingProfile(false);
        }}
        session={session}
        profile={profile}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        onLogout={() => setLogoutModal(true)}
        pendingCount={pendingReceived.length}
        unreadMessages={unreadMessages}
      />
      
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "hidden",
        }}
  
        <div
          style={{
            background: "#06070dcc",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${T.border}`,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>
            {page === "dashboard"
              ? "Dashboard"
              : page === "profile"
              ? editingProfile
                ? "Edit Profile"
                : "My Profile"
              : NAV.find((n) => n.id === page)?.label || ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
                color: T.textMid,
                padding: 4,
                display: "flex",
              }}
            >
              🔔
              {notifUnread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    background: T.orange,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "#fff",
                    border: `2px solid ${T.bg}`,
                  }}
                >
                  {notifUnread > 9 ? "9+" : notifUnread}
                </span>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: T.success,
                  boxShadow: `0 0 6px ${T.success}`,
                }}
              />
              <span style={{ fontSize: 12, color: T.textMid }}>Online</span>
            </div>
          </
        <div
          style={{
            flex: 1,
            padding: "28px 28px",
            maxWidth: 1040,
            width: "100%",
            margin: "0 auto",
            zIndex: 1,
            position: "relative",
          }}
        >
          {profileLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 24,
                  hf9731633`,
                  borderTopColor: "#f97316",
                  borderRadius: "50%",
                  animation: "spin .7s linear infinite",
                }}
              />
              <span style={{ color: "#6b7594", fontSize: 13 }}>Loading…</span>
            </div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
   {showNotifications && (
  <NotificationsPanel
    session={session}
    onClose={()=>setShowNotifications(false)}
    onNavigate={p=>{setPage(p);if(p!=="profile")setEditi
      {logoutModal && (
        <div
          onClick={() => setLogoutModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000cc",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: "28px 24px",
              maxWidth: 340,
              width: "100%",
              animation: "scaleIn .2s ease",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: T.errorLo,
                border: `1px solid ${T.error}33`,
                display: "flex",
        
        
    
              
  */return (
     <PresenceProvider session={session}>
       <CallProvider session={session}>  
  <div style={{ display: "flex", minHeight: "100vh", background: T.bg, position: "relative" }}>
    <Background />

    {/* Desktop sidebar — hidden on mobile */}
    {!isMobile && (
      <Sidebar
        active={page}
        onNav={p => { setPage(p); if (p !== "profile") setEditingProfile(false); }}
        session={session} profile={profile}
        collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)}
        onLogout={() => setLogoutModal(true)}
        pendingCount={pendingReceived.length}
        unreadMessages={unreadMessages}
      />
    )}

    {/* Main content */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>

      {/* Mobile top bar */}
    {/* Hide top bar on profile — it has its own header */}
{!(page === "profile" && !editingProfile) && (
  isMobile ? (
    <MobileTopBar
      title={page === "profile" ? (editingProfile ? "Edit Profile" : "My Profile") : NAV.find(n => n.id === page)?.label || ""}
      session={session}
      profile={profile}
      onNotifications={() => setShowNotifications(true)}
      notifUnread={notifUnread}
      showBack={editingProfile && page === "profile"}
      onBack={() => setEditingProfile(false)}
      onShare={() => setShowShare(true)}
    />
  ) : (
    <div style={{ background:"#06070dcc", backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.border}`, padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:30 }}>
      <div style={{ fontWeight:700, fontSize:15, color:T.text }}>
        {page === "dashboard" ? "Dashboard" : page === "profile" ? editingProfile ? "Edit Profile" : "My Profile" : NAV.find(n=>n.id===page)?.label||""}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={()=>setShowShare(true)} style={{ background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:8, padding:"6px 12px", color:T.orange, fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
          📤 Share
        </button>
        <button onClick={()=>setShowNotifications(true)} style={{ position:"relative", background:"none", border:"none", cursor:"pointer", fontSize:20, color:T.textMid, padding:4, display:"flex" }}>
          🔔
          {notifUnread>0 && <span style={{ position:"absolute", top:-2, right:-2, width:16, height:16, background:T.orange, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#fff", border:`2px solid ${T.bg}` }}>{notifUnread>9?"9+":notifUnread}</span>}
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.success, boxShadow:`0 0 6px ${T.success}` }}/>
          <span style={{ fontSize:12, color:T.textMid }}>Online</span>
        </div>
      </div>
    </div>
  )
)}


      {/* Page content */}
      <div style={{
  flex:1,
  padding: page==="profile" && !editingProfile ? "0" : isMobile ? "16px 16px 90px" : "28px 28px",
  maxWidth: page==="profile" && !editingProfile ? "100%" : isMobile ? "100%" : 1040,
  width:"100%", margin:"0 auto", zIndex:1, position:"relative",
}}>

        {profileLoading
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 12 }}><Spinner size={24} /><span style={{ color: T.textMid, fontSize: 13 }}>Loading…</span></div>
          : renderPage()
        }
      </div>
    </div>

    {/* Mobile bottom nav */}
    {isMobile && (
      <BottomNav
        active={page}
        onNav={p => {
           
          if (p === "more") { setShowMoreMenu(true); return; }
             if (p === "share") { setShowShare(true); return; }

          setPage(p);
          if (p !== "profile") setEditingProfile(false);
        }}
        pendingCount={pendingReceived.length}
        unreadMessages={unreadMessages}
      />
    )}

    {/* Mobile more menu */}
 {isMobile && showMoreMenu && (
  <MobileMoreMenu
    session={session}
    profile={profile}
    onNav={p => { setPage(p); if (p !== "profile") setEditingProfile(false); }}
    onLogout={() => { setLogoutModal(true); }}
    onClose={() => setShowMoreMenu(false)}
    onShare={() => { setShowMoreMenu(false); setShowShare(true); }}
  />
)}


    {/* Notifications panel */}
    {showNotifications && (
      <NotificationsPanel
        session={session}
        onClose={() => setShowNotifications(false)}
        onNavigate={p => { setPage(p); if (p !== "profile") setEditingProfile(false); }}
      />
    )}
     {showShare && <ShareApp onClose={() => setShowShare(false)} />}
{showPremiumModal && (
  <PremiumUpgradeModal
    session={session}
    onClose={() => setShowPremiumModal(false)}
    onSuccess={() => {
      // optional: refetch profile/premium status here, or just let useConnections re-check on next mount
    }}
  />
)}


    {/* Logout modal */}
    {logoutModal && (
  <div onClick={() => setLogoutModal(false)} style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "28px 24px", maxWidth: 340, width: "100%", animation: "scaleIn .2s ease", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.errorLo, border: `1px solid ${T.error}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>⏏</div>
      <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 8 }}>Sign Out?</div>
      <div style={{ color: T.textMid, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>Your session will end and you'll be returned to the sign-in page.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn onClick={onLogout} fullWidth>Yes, Sign Out</Btn>
        <Btn variant="ghost" onClick={() => setLogoutModal(false)} fullWidth>Cancel</Btn>
      </div>
    </div>
  </div>
)}

  </div>
     
  </CallProvider>   
  </PresenceProvider>
);

}
function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow]     = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("pwa_dismissed") === "true"
  );

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      if (!dismissed) setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%",
      transform: "translateX(-50%)",
      width: "calc(100% - 40px)", maxWidth: 420,
      background: "#0b0d17",
      border: "1px solid #f9731644",
      borderRadius: 16, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
      zIndex: 9999,
      boxShadow: "0 20px 60px #00000077, 0 0 0 1px #f9731622",
      animation: "fadeUp .4s ease",
    }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: "linear-gradient(145deg,#f97316,#ea6008)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, boxShadow: "0 4px 16px #f9731444",
      }}>
        ⚡
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#eef0f8", marginBottom: 2 }}>
          Install TezConnect
        </div>
        <div style={{ fontSize: 12, color: "#6b7594", lineHeight: 1.4 }}>
          Add to home screen for the best experience
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={dismiss}
          style={{
            background: "transparent", border: "1px solid #1a1f35",
            borderRadius: 8, padding: "7px 12px",
            color: "#6b7594", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Not now
        </button>
        <button
          onClick={install}
          style={{
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", borderRadius: 8, padding: "7px 14px",
            color: "#fff", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 4px 12px #f9731440",
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("loading");
  const [session, setSession] = useState(null);
  const [navData, setNavData] = useState({});
  // Detect public profile URL  ← add this block
  const path = window.location.pathname;
  const publicProfileMatch = path.match(/^\/u\/([a-z0-9_]+)$/i);
  if (publicProfileMatch) {
    return <PublicProfilePage username={publicProfileMatch[1]} />;
  }
   useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      setPage("update-password");
    }
  });
  return () => subscription.unsubscribe();
}, []);


 useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setSession({
        userId: session.user.id,
        name: session.user.user_metadata.name,
        email: session.user.email,
      });
      setPage("app");
    } else {
      setPage("signin");
    }
  });

 const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    setSession(null);
    setPage("signin");
  }
  if (event === "SIGNED_IN" && session) {
    setSession({
      userId: session.user.id,
      name: session.user.user_metadata.name,
      email: session.user.email,
    });
    setPage("app");
  }
});

  return () => subscription.unsubscribe();
}, []);

  const login = useCallback((s) => {
    setSession(s);
    setPage("app");
  }, []);

  const logout = useCallback(async () => {
  await supabase.auth.signOut();
  setSession(null);
  setNavData({});
  setPage("signin");
}, []);

  const nav = useCallback((to, data = {}) => {
    setNavData(data);
    setPage(to);
  }, []);

  if (page === "loading")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Logo size="lg" />
        <Spinner size={28} />
      </div>
    );
   

  return (
    <>
      <GlobalStyles />
      {page === "signup" && <SignUpPage onNav={nav} />}
      {page === "signin" && (
        <SignInPage onNav={nav} onLogin={login} prefill={navData.prefill || ""} />
      )}
       {page === "forgot-password" && <ForgotPasswordPage onNav={nav} />}
       {page === "update-password" && <UpdatePasswordPage onNav={nav} />}
      {page === "app" && session && <AppShell session={session} onLogout={logout} />}
       

      {page === "app" && !session && (() => { nav("signin"); return null; })()}
      <InstallPrompt/> 
  </>
  );
}
