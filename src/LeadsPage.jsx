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

const INDUSTRIES = [
  "Technology","Finance","Healthcare","Education","Real Estate",
  "Manufacturing","Retail","Media","Consulting","Other",
];

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.color}44`,
      color: c.color, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {c.label}
    </span>
  );
}

function LeadModal({ lead, onClose, onSave, onDelete }) {
  const isNew = !lead.id;
  const [form, setForm] = useState({
    name: "", company: "", email: "", mobile: "",
    whatsapp: "", industry: "", status: "new", notes: "",
    ...lead,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: "10px 14px", color: T.text,
    fontSize: 13, outline: "none", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: T.textMid,
    textTransform: "uppercase", letterSpacing: ".08em",
    display: "block", marginBottom: 5,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#000c",
        zIndex: 300, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: "24px", width: "100%",
          maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 20 }}>
          {isNew ? "➕ Add New Lead" : "✏️ Edit Lead"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Full name" style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <input value={form.company} onChange={e => set("company", e.target.value)}
                placeholder="Company name" style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@company.com" type="email" style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div>
              <label style={labelStyle}>Mobile</label>
              <input value={form.mobile} onChange={e => set("mobile", e.target.value)}
                placeholder="+91 98765 43210" style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div>
              <label style={labelStyle}>WhatsApp</label>
              <input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)}
                placeholder="+91 98765 43210" style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border} />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <select value={form.industry} onChange={e => set("industry", e.target.value)}
                style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Select Industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => set("status", key)}
                  style={{
                    background: form.status === key ? cfg.bg : "transparent",
                    border: `1px solid ${form.status === key ? cfg.color + "66" : T.border}`,
                    borderRadius: 20, padding: "6px 14px",
                    color: form.status === key ? cfg.color : T.textMid,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all .2s",
                  }}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Any notes about this lead…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {!isNew && (
            <button
              onClick={() => onDelete(lead.id)}
              style={{
                background: T.errorLo, border: `1px solid ${T.error}44`,
                borderRadius: 9, padding: "10px 16px",
                color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1, background: "transparent", border: `1px solid ${T.border}`,
              borderRadius: 9, padding: "10px 16px",
              color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (!form.name.trim()) return;
              setSaving(true);
              await onSave(form);
              setSaving(false);
              onClose();
            }}
            style={{
              flex: 2,
              background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
              border: "none", borderRadius: 9, padding: "10px 16px",
              color: saving ? T.textMid : "#fff",
              fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {saving ? "Saving…" : isNew ? "Add Lead" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage({ session }) {
  const [leads, setLeads]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch]         = useState("");

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, [session.userId]);

  const saveLead = async (form) => {
    if (form.id) {
      await supabase.from("leads").update({
        name: form.name, company: form.company, email: form.email,
        mobile: form.mobile, whatsapp: form.whatsapp, industry: form.industry,
        status: form.status, notes: form.notes,
        updated_at: new Date().toISOString(),
      }).eq("id", form.id);
    } else {
      await supabase.from("leads").insert({
        user_id: session.userId,
        name: form.name, company: form.company, email: form.email,
        mobile: form.mobile, whatsapp: form.whatsapp, industry: form.industry,
        status: form.status, notes: form.notes, source: "manual",
      });
    }
    fetchLeads();
  };

  const deleteLead = async (id) => {
    await supabase.from("leads").delete().eq("id", id);
    setModal(null);
    fetchLeads();
  };

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || l.name?.toLowerCase().includes(q)
      || l.company?.toLowerCase().includes(q)
      || l.email?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats per status
  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  const inputStyle = {
    background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: "10px 14px", color: T.text,
    fontSize: 13, outline: "none",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>
            🎯 Lead Management
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em" }}>
            My <span style={{ color: T.orange }}>Leads</span>
          </h2>
          <p style={{ color: T.textMid, fontSize: 13, marginTop: 4 }}>
            {loading ? "Loading…" : `${leads.length} total leads`}
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          style={{
            background: "linear-gradient(135deg,#f97316,#ea6008)",
            border: "none", borderRadius: 9, padding: "10px 20px",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 4px 20px #f9731440",
          }}
        >
          + Add Lead
        </button>
      </div>

      {/* Status summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            style={{
              background: filterStatus === key ? cfg.bg : T.bgCard,
              border: `1px solid ${filterStatus === key ? cfg.color + "55" : T.border}`,
              borderRadius: 12, padding: "14px 12px",
              cursor: "pointer", transition: "all .2s", textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 22, color: cfg.color }}>
              {counts[key]}
            </div>
            <div style={{ fontSize: 11, color: T.textLow, fontWeight: 600, marginTop: 2 }}>
              {cfg.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search leads…"
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        {(search || filterStatus) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); }}
            style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 9, padding: "10px 16px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, gap: 12 }}>
          <div style={{ width: 20, height: 20, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading leads…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>
            {leads.length === 0 ? "No leads yet" : "No leads match your filter"}
          </div>
          <div style={{ color: T.textMid, fontSize: 13, marginBottom: 20 }}>
            {leads.length === 0 ? "Add your first lead to get started" : "Try clearing your search or filter"}
          </div>
          {leads.length === 0 && (
            <button
              onClick={() => setModal({})}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              + Add First Lead
            </button>
          )}
        </div>
      )}

      {/* Leads list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(lead => (
            <div
              key={lead.id}
              onClick={() => setModal(lead)}
              style={{
                background: T.bgCard, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "16px 20px",
                display: "flex", alignItems: "center", gap: 16,
                cursor: "pointer", transition: "all .2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.orange + "44";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg,#f97316,#ea6008)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0,
              }}>
                {(lead.name || "?")[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>
                  {lead.name}
                </div>
                <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>
                  {[lead.company, lead.industry].filter(Boolean).join(" · ")}
                </div>
                {lead.notes && (
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lead.notes}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                {lead.whatsapp && (
                  <a
                    href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ background: "#25d36618", border: "1px solid #25d36633", borderRadius: 8, padding: "6px 10px", color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                  >
                    💬
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={e => e.stopPropagation()}
                    style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", color: T.textMid, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                  >
                    ✉
                  </a>
                )}
              </div>

              {/* Status */}
              <StatusBadge status={lead.status} />

              {/* Date */}
              <div style={{ fontSize: 11, color: T.textLow, flexShrink: 0, minWidth: 70, textAlign: "right" }}>
                {new Date(lead.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <LeadModal
          lead={modal}
          onClose={() => setModal(null)}
          onSave={saveLead}
          onDelete={deleteLead}
        />
      )}
    </div>
  );
}