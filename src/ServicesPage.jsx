import { useState } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  info: "#38bdf8", amber: "#fbbf24",
};
const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";


const SERVICES = [
  {
    icon: "📊",
    title: "Digital Marketing & Lead Generation",
    desc: "Drive targeted traffic and convert prospects into paying customers through data-driven digital marketing strategies tailored for B2B businesses.",
    features: ["Meta & Google Ads", "Lead funnel creation", "CRM integration", "ROI tracking & reporting"],
    color: "#f97316", tag: "Marketing",
  },
  {
    icon: "📱",
    title: "Social Media Marketing",
    desc: "Build a powerful social media presence that engages your audience, grows your brand, and generates consistent business opportunities.",
    features: ["Content strategy", "Instagram & LinkedIn management", "Reels & short video creation", "Community growth"],
    color: "#3b82f6", tag: "Social",
  },
  {
    icon: "🔍",
    title: "Google Business Ads & SEO Services",
    desc: "Dominate search results and local listings. Get found by the right customers at the right time with expert SEO and Google Ads management.",
    features: ["Google Ads campaigns", "Local SEO optimization", "Google Business Profile setup", "Keyword research & ranking"],
    color: "#22c55e", tag: "SEO",
  },
  {
    icon: "💬",
    title: "WhatsApp Marketing & Business Automations",
    desc: "Leverage WhatsApp — India's #1 messaging platform — to automate customer communication, send bulk campaigns, and close more deals.",
    features: ["WhatsApp Business API", "Bulk broadcast campaigns", "Chatbot automation", "Order & follow-up flows"],
    color: "#25d366", tag: "Automation",
  },
  {
    icon: "🌐",
    title: "Custom Websites & Mobile App Development",
    desc: "Professional, fast, and mobile-first websites and apps built to convert visitors into customers and scale your business online.",
    features: ["Business websites", "E-commerce stores", "Android & iOS apps", "PWA development"],
    color: "#a78bfa", tag: "Development",
  },
  {
    icon: "⚙️",
    title: "Custom ERP Software Implementations",
    desc: "Streamline your operations with custom ERP systems that automate workflows, manage inventory, track finances, and boost team productivity.",
    features: ["Inventory management", "HR & payroll systems", "Finance & billing", "Custom dashboards"],
    color: "#38bdf8", tag: "ERP",
  },
  {
    icon: "🔌",
    title: "IOT Systems for Monitoring of Utilities",
    desc: "Smart IoT solutions to monitor electricity, water, and other utilities in real time — reduce waste, cut costs, and get instant alerts.",
    features: ["Real-time monitoring", "Smart sensors & devices", "Mobile alerts & reports", "Energy optimization"],
    color: "#fbbf24", tag: "IoT",
  },
  {
    icon: "🎨",
    title: "Content Creation & Branding Services",
    desc: "Stand out with a strong brand identity and compelling content that tells your story, builds trust, and attracts your ideal customers.",
    features: ["Logo & brand design", "Video production", "Copywriting & blogs", "Brand strategy"],
    color: "#f87171", tag: "Branding",
  },
];

/* ── Inquiry Modal ── */
function InquiryModal({ service, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name    = "Name is required";
    if (!form.phone.trim())  e.phone   = "Phone number is required";
    else if (!/^[0-9+\s-]{8,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.email.trim())  e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Please describe your requirement";
    return e;
  };
const handleSubmit = async () => {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setSending(true);

  // Save as lead in Supabase
  try {
    await supabase.from("leads").insert({
      user_id: "3f1ec55b-a33f-462c-8d10-0197fea18e69", // paste real UUID here
      name: form.name.trim(),
      mobile: form.phone.trim(),
      email: form.email.trim(),
      notes: `Service: ${service.title}\n\nMessage: ${form.message}`,
      source: "Website",
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Lead save failed:", err);
    // Don't block the user — still send WhatsApp
  }

  // Build WhatsApp message
  const msg = `🚀 *New Service Inquiry — TezConnect*

*Service:* ${service.title}

*Name:* ${form.name}
*Phone:* ${form.phone}
*Email:* ${form.email}

*Message:*
${form.message}

_Sent from TezConnect App_`;

  setSending(false);
  setSent(true);
// Auto close after 3 seconds
setTimeout(() => {
  onClose();
}, 3000);
  // Open WhatsApp after short delay
  setTimeout(() => {
    window.open(
      `https://wa.me/917396180986?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  }, 800);
};

  
  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "12px 14px", color: T.text,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color .2s",
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560,
          maxHeight: "92vh", overflowY: "auto",
          animation: "slideUp .3s ease",
        }}
      >
        {/* Handle */}
        <div style={{ padding: "12px 0 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4 }} />
        </div>

        <div style={{ padding: "16px 20px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: service.color + "18", border: `1px solid ${service.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {service.icon}
                </div>
                <span style={{ background: service.color + "18", border: `1px solid ${service.color}33`, color: service.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                  {service.tag}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text, lineHeight: 1.3 }}>
                Inquire: {service.title}
              </div>
              <div style={{ fontSize: 12, color: T.textLow, marginTop: 4 }}>
                Fill in your details and we'll get back to you within 24 hours
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              ×
            </button>
          </div>
          {/* Success state */}
          {sent ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.successLo, border: `2px solid ${T.success}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>
                ✓
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>Inquiry Sent!</div>
              <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 4 }}>
                Opening WhatsApp to send your inquiry to our team…
              </div>
              <div style={{ fontSize: 12, color: T.textLow }}>
                We'll respond within 24 hours.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            


              {/* Name */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>
                  Full Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  style={{ ...inputStyle, borderColor: errors.name ? T.error : T.border }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = errors.name ? T.error : T.border}
                />
                {errors.name && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.name}</div>}
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>
                  Phone Number *
                </label>
                <input
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  type="tel"
                  style={{ ...inputStyle, borderColor: errors.phone ? T.error : T.border }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = errors.phone ? T.error : T.border}
                />
                {errors.phone && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.phone}</div>}
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>
                  Email Address *
                </label>
                <input
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  style={{ ...inputStyle, borderColor: errors.email ? T.error : T.border }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = errors.email ? T.error : T.border}
                />
                {errors.email && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.email}</div>}
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>
                  Your Requirement *
                </label>
                <textarea
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder={`Tell us about your requirement for ${service.title}…\n\nE.g. Business size, budget, timeline, specific goals`}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", borderColor: errors.message ? T.error : T.border }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = errors.message ? T.error : T.border}
                />
                {errors.message && <div style={{ fontSize: 11, color: T.error, marginTop: 4 }}>⚠ {errors.message}</div>}
              </div>

              {/* Info note */}
              <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: T.textLow, lineHeight: 1.6 }}>
                ℹ️ Your inquiry will be sent directly to our team via WhatsApp. We typically respond within 24 hours.
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={sending}
                style={{
                  width: "100%",
                  background: sending ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
                  border: "none", borderRadius: 12, padding: "14px",
                  color: sending ? T.textMid : "#fff",
                  fontSize: 15, fontWeight: 700,
                  cursor: sending ? "wait" : "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: sending ? "none" : "0 4px 20px #f9731440",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {sending ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid #ffffff44", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                    Sending…
                  </>
                ) : (
                  "🚀 Submit Inquiry"
                )}
              </button>

              {/* Alternative contact */}
              <div style={{ display: "flex", gap: 10 }}>
                <a
                  href="https://wa.me/917396180986"
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "10px", color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
                >
                  💬 Chat on WhatsApp
                </a>
                <a
                  href="tel:+917396180986"
                  style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px", color: T.textMid, fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center" }}
                >
                  📞 Call Us
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Service Card ── */
function ServiceCard({ service, index, onInquire }) {
  const [hov, setHov]           = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hov ? service.color + "55" : T.border}`,
        borderRadius: 16, overflow: "hidden",
        transition: "all .22s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 12px 40px ${service.color}15` : "none",
        animation: `fadeUp .4s ease ${index * 60}ms both`,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg,${service.color},${service.color}44)`, flexShrink: 0 }} />

      <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: service.color + "18", border: `1px solid ${service.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {service.icon}
          </div>
          <span style={{ background: service.color + "18", border: `1px solid ${service.color}33`, color: service.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
            {service.tag}
          </span>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 8, lineHeight: 1.3 }}>
          {service.title}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 14 }}>
          {service.desc}
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16, flex: 1 }}>
          {(expanded ? service.features : service.features.slice(0, 2)).map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: service.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: T.textMid }}>{f}</span>
            </div>
          ))}
          {service.features.length > 2 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background: "none", border: "none", color: service.color, fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "left", padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {expanded ? "Show less ↑" : `+${service.features.length - 2} more features`}
            </button>
          )}
        </div>

        {/* CTA Buttons */}
        {isAdmin ? (
  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
    <button onClick={() => onEditService(service)}
      style={{ flex: 1, background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "11px", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
      ✏️ Edit Service
    </button>
  </div>
) : (
  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
    <button onClick={() => onInquire(service)}
      style={{ flex: 2, background: `linear-gradient(135deg,${service.color},${service.color}cc)`, border: "none", borderRadius: 10, padding: "11px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
      🚀 Get Started
    </button>
    <a href={`https://wa.me/917396180986?text=${encodeURIComponent(`Hi! I'm interested in your ${service.title} service.`)}`} target="_blank" rel="noopener noreferrer"
      style={{ flex: 1, background: "#25d36618", border: "1px solid #25d36633", borderRadius: 10, padding: "11px", color: "#25d366", fontSize: 13, fontWeight: 700, textDecoration: "none", textAlign: "center" }}>💬</a>
  </div>
)}


/* ── Contact Banner ── */
function ContactBanner({ onInquire }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#0d1020,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden", textAlign: "center" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8, letterSpacing: "-.02em" }}>
        Ready to grow your business?
      </div>
      <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
        Talk to Lekhakraj K R — Founder & CEO of TezConnect. Get a free consultation for any of our services.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={() => onInquire({ icon: "⚡", title: "General Inquiry", desc: "", features: [], color: T.orange, tag: "General" })}
          style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 20px #f9731440" }}
        >
          🚀 Get Free Consultation
        </button>
        <a href="https://wa.me/917396180986" target="_blank" rel="noopener noreferrer"
          style={{ background: "#25d366", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          💬 WhatsApp
        </a>
        <a href="tel:+917396180986"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 24px", color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
          📞 Call
        </a>
      </div>
      <div style={{ fontSize: 12, color: T.textLow, marginTop: 16 }}>
        📍 Kokapet, Hyderabad · hello@tezconnect.com · +91 73961 80986
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function ServicesPage({session}) {
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const [filter, setFilter]       = useState("All");
  const [inquiryService, setInquiryService] = useState(null);
  const [showAddService, setShowAddService] = useState(false);

  const filters = ["All", "Marketing", "Social", "SEO", "Automation", "Development", "ERP", "IoT", "Branding"];
  const filtered = filter === "All" ? SERVICES : SERVICES.filter(s => s.tag === filter);

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
  <button onClick={() => setShowAddService(true)}
    style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
    + Add Service
  </button>
) : (
          <button
            onClick={() => setInquiryService({ icon: "⚡", title: "General Inquiry", desc: "", features: [], color: T.orange, tag: "General" })}
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 20px #f9731440" }}
          >
            🚀 Get Free Consultation
          </button>
      )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ background: filter === f ? T.orangeMd : T.bgCard, border: `1px solid ${filter === f ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 16px", color: filter === f ? T.orange : T.textMid, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map((service, i) => (
          <ServiceCard key={service.title} service={service} index={i} onInquire={setInquiryService} />
        ))}
      </div>

      {/* Contact banner */}
      <ContactBanner onInquire={setInquiryService} />

      {/* Inquiry modal */}
      {inquiryService && (
        <InquiryModal service={inquiryService} onClose={() => setInquiryService(null)} />
      )}
    </div>
  );
}
