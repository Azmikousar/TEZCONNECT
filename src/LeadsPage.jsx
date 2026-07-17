import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  info: "#38bdf8", infoLo: "#38bdf812",
  amber: "#fbbf24", amberLo: "#fbbf2412",
};

const STATUS_CONFIG = {
  new:       { label: "New",       color: T.info,    bg: T.infoLo },
  contacted: { label: "Contacted", color: T.orange,  bg: T.orangeLo },
  qualified: { label: "Qualified", color: T.amber,   bg: T.amberLo },
  converted: { label: "Converted", color: T.success, bg: T.successLo },
  lost:      { label: "Lost",      color: T.error,   bg: T.errorLo },
};
const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69"; // same UUID as in LeadsPage.jsx

function StatCard({ icon, label, value, color, change }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", border: `1px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
        {change !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: change >= 0 ? T.success : T.error }}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: 26, color, letterSpacing: "-.03em" }}>{value}</div>
      <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function FunnelBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
          <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
          <span style={{ fontSize: 11, color: T.textLow }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 8, background: T.bgInput, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width .6s ease" }} />
      </div>
    </div>
  );
}

function WeeklyChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 }}>
        {data.map((d, i) => {
          const h = Math.max(4, (d.count / max) * 100);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: T.orange, fontWeight: 700 }}>{d.count > 0 ? d.count : ""}</span>
              <div style={{ width: "100%", height: `${h}%`, background: d.count > 0 ? `linear-gradient(180deg,${T.orange},#ea6008)` : T.bgInput, borderRadius: "4px 4px 0 0", transition: "height .5s ease", minHeight: 4 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {days.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: T.textLow }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

export default function LeadAnalyticsPage({ session }) {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState("all");
useEffect(() => {
  supabase.from("leads").select("*").eq("user_id", ADMIN_USER_ID)
    .order("created_at", { ascending: false })
    .then(({ data }) => { setLeads(data || []); setLoading(false); });
}, []);


  const total     = leads.length;
  const converted = leads.filter(l => l.status === "converted").length;
  const active    = leads.filter(l => !["converted","lost"].includes(l.status)).length;
  const convRate  = total > 0 ? Math.round((converted / total) * 100) : 0;

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  // Weekly data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split("T")[0];
    return {
      day: dayStr,
      count: leads.filter(l => l.created_at?.startsWith(dayStr)).length,
    };
  });

  // Industry breakdown
  const industries = leads.reduce((acc, l) => {
    if (l.industry) acc[l.industry] = (acc[l.industry] || 0) + 1;
    return acc;
  }, {});
  const topIndustries = Object.entries(industries).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const industryColors = [T.orange, T.info, T.success, T.amber, "#a78bfa"];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
      <span style={{ color: T.textMid, fontSize: 13 }}>Loading analytics…</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
{/* Header */}
<div>
  <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>📊 Lead Analytics</div>
  <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, letterSpacing: "-.03em" }}>
    Lead <span style={{ color: T.orange }}>Insights</span>
  </h2>
  {session.userId !== ADMIN_USER_ID && (
    <div style={{ fontSize: 11, color: T.textLow, marginTop: 6 }}>
      👁️ Showing TezConnect team-wide lead insights
    </div>
  )}
</div>


      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        <StatCard icon="🎯" label="Total Leads"   value={total}     color={T.orange}  change={12} />
        <StatCard icon="✅" label="Converted"     value={converted} color={T.success} change={8}  />
        <StatCard icon="🔥" label="Active Leads"  value={active}    color={T.info}    change={-3} />
        <StatCard icon="📈" label="Conv. Rate"    value={`${convRate}%`} color={T.amber} />
      </div>

      {/* Weekly chart */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>📅 Leads This Week</div>
        <WeeklyChart data={weeklyData} />
      </div>

      {/* Funnel */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>🔻 Lead Funnel</div>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <FunnelBar key={key} label={cfg.label} value={statusCounts[key]} total={total} color={cfg.color} />
        ))}
        {total === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: T.textLow, fontSize: 13 }}>
            No leads yet — add leads to see your funnel
          </div>
        )}
      </div>

      {/* Industry breakdown */}
      {topIndustries.length > 0 && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>🏭 Top Industries</div>
          {topIndustries.map(([industry, count], i) => (
            <div key={industry} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: industryColors[i], flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: T.text }}>{industry}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: industryColors[i] }}>{count}</div>
              <div style={{ width: 80, height: 6, background: T.bgInput, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / total) * 100}%`, background: industryColors[i], borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent activity */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 16 }}>🕐 Recent Leads</div>
        {leads.slice(0, 5).length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: T.textLow, fontSize: 13 }}>No leads yet</div>
        ) : (
          leads.slice(0, 5).map(lead => {
            const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            return (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {(lead.name||"?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: T.textLow }}>{lead.company || lead.industry || "—"}</div>
                </div>
                <span style={{ background: cfg.bg, border: `1px solid ${cfg.color}44`, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {cfg.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
