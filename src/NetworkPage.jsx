import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeHi: "#fb923c", orangeLo: "#f9731612",
  orangeMd: "#f9731625", amber: "#fbbf24", text: "#eef0f8", textMid: "#6b7594",
  textLow: "#343c58", info: "#38bdf8", success: "#22c55e",
};

function Tag({ children, color = T.orange }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: color + "18", border: `1px solid ${color}33`,
      color, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function MemberCard({ member, currentUserId }) {
  const [hov, setHov] = useState(false);
  const initials = (member.name || "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const isMe = member.id === currentUserId;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov ? T.orange + "55" : T.border}`,
        borderRadius: 16, overflow: "hidden",
        transition: "all .22s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 12px 40px #f9731615" : "none",
        animation: "fadeUp .35s ease",
      }}
    >
      {/* Cover strip */}
      <div style={{
        height: 70,
        background: member.cover
          ? `url(${member.cover}) center/cover`
          : "linear-gradient(135deg,#0d1020,#1a0a05)",
        position: "relative",
      }}>
        {isMe && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: T.orange + "22", border: `1px solid ${T.orange}44`,
            borderRadius: 20, padding: "2px 10px",
            fontSize: 10, fontWeight: 700, color: T.orange,
          }}>
            You
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ padding: "0 16px", transform: "translateY(-28px)", marginBottom: -12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          border: `3px solid ${T.bgCard}`,
          background: "linear-gradient(135deg,#f97316,#ea6008)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "#fff",
          overflow: "hidden", flexShrink: 0,
          boxShadow: "0 4px 16px #00000055",
        }}>
          {member.photo
            ? <img src={member.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials
          }
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.text, letterSpacing: "-.02em" }}>
          {member.name || "—"}
        </div>
        {member.designation && (
          <div style={{ fontSize: 12, color: T.orange, fontWeight: 600, marginTop: 2 }}>
            {member.designation}
          </div>
        )}
        {member.company && (
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>
            {member.company}{member.industry ? " · " + member.industry : ""}
          </div>
        )}
        {member.location && (
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>
            📍 {member.location}
          </div>
        )}

        {/* Skills */}
        {member.skills?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {member.skills.slice(0, 3).map(s => <Tag key={s}>{s}</Tag>)}
            {member.skills.length > 3 && (
              <Tag color={T.textMid}>+{member.skills.length - 3}</Tag>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          {member.whatsapp && (
            <a
              href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, background: "#25d36618", border: "1px solid #25d36633",
                borderRadius: 8, padding: "8px 0",
                color: "#25d366", fontSize: 12, fontWeight: 700,
                textDecoration: "none", textAlign: "center",
                transition: "all .2s",
              }}
            >
              💬 WhatsApp
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin.startsWith("http") ? member.linkedin : "https://" + member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, background: T.bgInput, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: "8px 0",
                color: T.textMid, fontSize: 12, fontWeight: 700,
                textDecoration: "none", textAlign: "center",
                transition: "all .2s",
              }}
            >
              🔗 LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NetworkPage({ session }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .not("name", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, []);

  const industries = [...new Set(members.map(m => m.industry).filter(Boolean))];
  const categories = [...new Set(members.map(m => m.category).filter(Boolean))];

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      m.name?.toLowerCase().includes(q) ||
      m.designation?.toLowerCase().includes(q) ||
      m.company?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.skills?.some(s => s.toLowerCase().includes(q));
    const matchIndustry = !filterIndustry || m.industry === filterIndustry;
    const matchCategory = !filterCategory || m.category === filterCategory;
    return matchSearch && matchIndustry && matchCategory;
  });

  const inputStyle = {
    background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: "10px 14px",
    color: T.text, fontSize: 13, outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp .35s ease" }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
          🌐 Member Directory
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em" }}>
          The <span style={{ color: T.orange }}>Network</span>
        </h2>
        <p style={{ color: T.textMid, fontSize: 13, marginTop: 4 }}>
          {loading ? "Loading members…" : `${filtered.length} of ${members.length} members`}
        </p>
      </div>

      {/* Search + Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name, skill, company, location…"
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        <select
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
          style={{ ...inputStyle, minWidth: 150 }}
        >
          <option value="">All Industries</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          style={{ ...inputStyle, minWidth: 150 }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || filterIndustry || filterCategory) && (
          <button
            onClick={() => { setSearch(""); setFilterIndustry(""); setFilterCategory(""); }}
            style={{
              background: T.orangeLo, border: `1px solid ${T.orange}33`,
              borderRadius: 9, padding: "10px 16px",
              color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 16, height: 260,
              animation: "fadeUp .4s ease",
              opacity: 0.5,
            }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>
            No members found
          </div>
          <div style={{ color: T.textMid, fontSize: 13 }}>
            Try a different search term or clear your filters
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {filtered.map(member => (
            <MemberCard key={member.id} member={member} currentUserId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  );
}