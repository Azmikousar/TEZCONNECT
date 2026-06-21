import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";
const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#25d366", "#a78bfa", "#38bdf8", "#fbbf24", "#f87171"];

/* ── Inquiry Modal (non-admin) ── */
function InquiryModal({ service, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9+\s-]{8,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Please describe your requirement";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSending(true);

    try {
      await supabase.from("leads").insert({
        user_id: ADMIN_USER_ID,
        name: form.name.trim(),
        mobile: form.phone.trim(),
        email: form.email.trim(),
        source: "Website",
        status: "new",
        notes: `Service: ${service.title}\n\nMessage: ${form.message.trim()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Lead save failed:", err);
    }

    const msg = `🚀 *New Service Inquiry — TezConnect*\n\n*Service:* ${service.title}\n\n*Name:* ${form.name}\n*Phone:* ${form.phone}\n*Email:* ${form.email}\n\n*Message:*\n${form.message}\n\n_Sent from TezConnect App_`;
    const whatsappUrl = `https://wa.me/917396180986?text=${encodeURIComponent(msg)}`;

    setSending(false);
    setSent(true);
    setTimeout(() => onClose(), 3000);
    setTimeout(() => window.open(whatsappUrl, "_blank"), 800);
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 14,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>
        <div style={{ padding: "16px 20px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: service.color + "18", border: `1px solid ${service.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{service.icon}</div>
                <span style={{ background: service.color + "18", border: `1px solid ${service.color}33`, color: service.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{service.tag}</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text, lineHeight: 1.3 }}>Inquire: {service.title}</div>
              <div style={{ fontSize: 12, color: T.textLow, marginTop: 4 }}>Fill in your details and we'll get back to you within 24 hours</div>
            </div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>×</button>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.successLo, border: `2px solid ${T.success}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>✓</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>Inquiry Sent!</div>
              <div style={{ fontSize: 13, color: T.textMid }}>Opening WhatsApp to send your inquiry…</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Full Name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Arjun Mehta" style={{ ...inputStyle, borderColor: errors.name ? T.error : T.border }} />
                {errors.name && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.name}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Phone Number *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" type="tel" style={{ ...inputStyle, borderColor: errors.phone ? T.error : T.border }} />
                {errors.phone && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.phone}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Email Address *</label>
                <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@company.com" type="email" style={{ ...inputStyle, borderColor: errors.email ? T.error : T.border }} />
                {errors.email && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.email}</div>}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Your Requirement *</label>
                <textarea value={form.message} onChange={e => set("message", e.target.value)} placeholder="Tell us about your requirement…" rows={4} style={{ ...inputStyle, resize: "vertical", borderColor: errors.message ? T.error : T.border }} />
                {errors.message && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.message}</div>}
              </div>
              <button onClick={handleSubmit} disabled={sending}
                style={{ width: "100%", background: sending ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: sending ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: sending ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {sending ? "Sending…" : "🚀 Submit Inquiry"}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <a href="https://wa.me/917396180986" target="_blank" rel="noopener noreferrer" style={{ flex: 1, background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "10px", color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>💬 Chat on WhatsApp</a>
                <a href="tel:+917396180986" style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px", color: T.textMid, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>📞 Call Us</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Add/Edit Service Modal (admin only) ── */
function ServiceFormModal({ service, onClose, onSaved }) {
  const isEdit = !!service?.id;
  const [form, setForm] = useState({
    icon: "🚀", title: "", description: "", tag: "General", color: COLORS[0],
    features: [""],
    ...service,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setFeature = (i, v) => {
    const next = [...form.features];
    next[i] = v;
    set("features", next);
  };
  const addFeature = () => set("features", [...form.features, ""]);
  const removeFeature = (i) => set("features", form.features.filter((_, j) => j !== i));

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);

    const payload = {
      icon: form.icon || "🚀",
      title: form.title.trim(),
      description: form.description.trim(),
      tag: form.tag.trim() || "General",
      color: form.color,
      features: form.features.map(f => f.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("company_services").update(payload).eq("id", service.id));
    } else {
      ({ error: err } = await supabase.from("company_services").insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const deleteService = async () => {
    await supabase.from("company_services").delete().eq("id", service.id);
    onSaved(); onClose();
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>
        <div style={{ padding: "16px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit Service" : "Add New Service"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Icon</label>
                <input value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="🚀" style={{ ...inputStyle, textAlign: "center", fontSize: 20 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Tag / Category</label>
                <input value={form.tag} onChange={e => set("tag", e.target.value)} placeholder="e.g. Marketing" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Service Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Digital Marketing & Lead Generation" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the service…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 8 }}>Color Theme</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => set("color", c)}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: form.color === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer", boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none" }} />
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em" }}>Features</label>
                <button onClick={addFeature} style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 8, padding: "4px 10px", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <input value={f} onChange={e => setFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`} style={inputStyle} />
                    <button onClick={() => removeFeature(i)} style={{ background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 8, padding: "0 12px", color: T.error, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving}
              style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {saving ? "Saving…" : isEdit ? "Update Service" : "Publish Service 🚀"}
            </button>

            {isEdit && (
              <button onClick={deleteService}
                style={{ width: "100%", background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 12, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                🗑 Delete Service
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Service Card ── */
function ServiceCard({ service, index, isAdmin, onInquire, onEdit }) {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard, border: `1px solid ${hov ? service.color + "55" : T.border}`,
        borderRadius: 16, overflow: "hidden", transition: "all .22s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 12px 40px ${service.color}15` : "none",
        animation: `fadeUp .4s ease ${index * 60}ms both`,
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg,${service.color},${service.color}44)`, flexShrink: 0 }} />
      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: service.color + "18", border: `1px solid ${service.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{service.icon}</div>
          <span style={{ background: service.color + "18", border: `1px solid ${service.color}33`, color: service.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{service.tag}</span>
        </div>

        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 8, lineHeight: 1.3 }}>{service.title}</div>
        <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 14 }}>{service.description}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16, flex: 1 }}>
          {(expanded ? service.features : service.features.slice(0, 2)).map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: service.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textMid }}>{f}</span>
            </div>
          ))}
          {service.features.length > 2 && (
            <button onClick={() => setExpanded(e => !e)}
              style={{ background: "none", border: "none", color: service.color, fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {expanded ? "Show less ↑" : `+${service.features.length - 2} more features`}
            </button>
          )}
        </div>

        {isAdmin ? (
          <button onClick={() => onEdit(service)}
            style={{ width: "100%", background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "11px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", marginTop: "auto" }}>
            ✏️ Edit Service
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <button onClick={() => onInquire(service)}
              style={{ flex: 2, background: `linear-gradient(135deg,${service.color},${service.color}cc)`, border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: `0 4px 16px ${service.color}40` }}>
              🚀 Get Started
            </button>
           
              
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Contact Banner ── */
function ContactBanner({ isAdmin, onInquire, onAddService }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8, letterSpacing: "-.02em" }}>
        {isAdmin ? "Manage your service catalog" : "Ready to grow your business?"}
      </div>
      <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
        {isAdmin
          ? "Add, edit, or remove services that appear to all TezConnect members."
          : "Talk to Lekhakraj K R — Founder & CEO of TezConnect. Get a free consultation for any of our services."}
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {isAdmin ? (
          <button onClick={onAddService}
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            + Add New Service
          </button>
        ) : (
          <>
            <button onClick={() => onInquire({ icon: "⚡", title: "General Inquiry", description: "", features: [], color: T.orange, tag: "General" })}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              🚀 Get Free Consultation
            </button>
            <a href="https://wa.me/917396180986" target="_blank" rel="noopener noreferrer"
              style={{ background: "#25d366", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>💬 WhatsApp</a>
            <a href="tel:+917396180986" style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 24px", color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>📞 Call</a>
          </>
        )}
      </div>
      <div style={{ fontSize: 12, color: T.textLow, marginTop: 16 }}>📍 Kokapet, Hyderabad · hello@tezconnect.com · +91 73961 80986</div>
    </div>
  );
}

/* ── Main Page ── */
export default function ServicesPage({ session }) {
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [inquiryService, setInquiryService] = useState(null);
  const [editService, setEditService] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchServices = async () => {
    const { data } = await supabase.from("company_services").select("*").order("created_at", { ascending: true });
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const filters = ["All", ...new Set(services.map(s => s.tag))];
  const filtered = filter === "All" ? services : services.filter(s => s.tag === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: T.orange + "06" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: T.orange, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>🚀 Our Services</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em", marginBottom: 8, lineHeight: 1.2 }}>
            Grow Your Business with <span style={{ color: T.orange }}>TezConnect</span>
          </h2>
          <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.7, maxWidth: 500, marginBottom: 16 }}>
            From digital marketing to custom software — end-to-end solutions to help Indian businesses connect faster and grow smarter.
          </p>
          {isAdmin ? (
            <button onClick={() => setShowAdd(true)}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              + Add Service
            </button>
          ) : (
            <button onClick={() => setInquiryService({ icon: "⚡", title: "General Inquiry", description: "", features: [], color: T.orange, tag: "General" })}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              🚀 Get Free Consultation
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {services.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? T.orangeMd : T.bgCard, border: `1px solid ${filter === f ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 16px", color: filter === f ? T.orange : T.textMid, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading services…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && services.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>No services listed yet</div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
              + Add First Service
            </button>
          )}
        </div>
      )}

      {/* Services grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} isAdmin={isAdmin} onInquire={setInquiryService} onEdit={setEditService} />
          ))}
        </div>
      )}

      {/* Contact banner */}
      <ContactBanner isAdmin={isAdmin} onInquire={setInquiryService} onAddService={() => setShowAdd(true)} />

      {/* Modals */}
      {inquiryService && <InquiryModal service={inquiryService} onClose={() => setInquiryService(null)} />}
      {isAdmin && showAdd && <ServiceFormModal onClose={() => setShowAdd(false)} onSaved={fetchServices} />}
      {isAdmin && editService && <ServiceFormModal service={editService} onClose={() => setEditService(null)} onSaved={fetchServices} />}
    </div>
  );
}
