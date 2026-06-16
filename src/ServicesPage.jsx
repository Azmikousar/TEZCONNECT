const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", info: "#38bdf8", amber: "#fbbf24",
  error: "#f87171",
};

const SERVICES = [
  {
    icon: "📊",
    title: "Digital Marketing & Lead Generation",
    desc: "Drive targeted traffic and convert prospects into paying customers through data-driven digital marketing strategies tailored for B2B businesses.",
    features: ["Meta & Google Ads", "Lead funnel creation", "CRM integration", "ROI tracking & reporting"],
    color: "#f97316",
    tag: "Marketing",
  },
  {
    icon: "📱",
    title: "Social Media Marketing",
    desc: "Build a powerful social media presence that engages your audience, grows your brand, and generates consistent business opportunities.",
    features: ["Content strategy", "Instagram & LinkedIn management", "Reels & short video creation", "Community growth"],
    color: "#3b82f6",
    tag: "Social",
  },
  {
    icon: "🔍",
    title: "Google Business Ads & SEO Services",
    desc: "Dominate search results and local listings. Get found by the right customers at the right time with expert SEO and Google Ads management.",
    features: ["Google Ads campaigns", "Local SEO optimization", "Google Business Profile setup", "Keyword research & ranking"],
    color: "#22c55e",
    tag: "SEO",
  },
  {
    icon: "💬",
    title: "WhatsApp Marketing & Business Automations",
    desc: "Leverage WhatsApp — India's #1 messaging platform — to automate customer communication, send bulk campaigns, and close more deals.",
    features: ["WhatsApp Business API", "Bulk broadcast campaigns", "Chatbot automation", "Order & follow-up flows"],
    color: "#25d366",
    tag: "Automation",
  },
  {
    icon: "🌐",
    title: "Custom Websites & Mobile App Development",
    desc: "Professional, fast, and mobile-first websites and apps built to convert visitors into customers and scale your business online.",
    features: ["Business websites", "E-commerce stores", "Android & iOS apps", "PWA development"],
    color: "#a78bfa",
    tag: "Development",
  },
  {
    icon: "⚙️",
    title: "Custom ERP Software Implementations",
    desc: "Streamline your operations with custom ERP systems that automate workflows, manage inventory, track finances, and boost team productivity.",
    features: ["Inventory management", "HR & payroll systems", "Finance & billing", "Custom dashboards"],
    color: "#38bdf8",
    tag: "ERP",
  },
  {
    icon: "🔌",
    title: "IOT Systems for Monitoring of Utilities",
    desc: "Smart IoT solutions to monitor electricity, water, and other utilities in real time — reduce waste, cut costs, and get instant alerts.",
    features: ["Real-time monitoring", "Smart sensors & devices", "Mobile alerts & reports", "Energy optimization"],
    color: "#fbbf24",
    tag: "IoT",
  },
  {
    icon: "🎨",
    title: "Content Creation & Branding Services",
    desc: "Stand out with a strong brand identity and compelling content that tells your story, builds trust, and attracts your ideal customers.",
    features: ["Logo & brand design", "Video production", "Copywriting & blogs", "Brand strategy"],
    color: "#f87171",
    tag: "Branding",
  },
];

function ServiceCard({ service, index }) {
  const [hov, setHov] = useState(false);
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
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: `linear-gradient(90deg,${service.color},${service.color}44)` }} />

      <div style={{ padding: "20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: service.color + "18",
              border: `1px solid ${service.color}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {service.icon}
            </div>
            <span style={{
              background: service.color + "18",
              border: `1px solid ${service.color}33`,
              color: service.color, borderRadius: 20,
              padding: "3px 10px", fontSize: 10,
              fontWeight: 700, letterSpacing: ".08em",
              textTransform: "uppercase",
            }}>
              {service.tag}
            </span>
          </div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
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

        {/* CTA */}
        <a
          href="https://wa.me/917396180986?text=Hi! I'm interested in your " + encodeURIComponent(service.title) + " service."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#25d36618", border: "1px solid #25d36633",
            borderRadius: 10, padding: "10px",
            color: "#25d366", fontSize: 13, fontWeight: 700,
            textDecoration: "none", transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#25d36630"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#25d36618"; }}
        >
          💬 Enquire on WhatsApp
        </a>
      </div>
    </div>
  );
}

function ContactBanner() {
  return (
    <div style={{
      background: "linear-gradient(135deg,#0d1020,#0c0e1a)",
      border: `1px solid ${T.orange}33`,
      borderRadius: 20, padding: "28px 24px",
      position: "relative", overflow: "hidden",
      textAlign: "center",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8, letterSpacing: "-.02em" }}>
        Ready to grow your business?
      </div>
      <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
        Talk to Lekhakraj K R — Founder & CEO of TezConnect. Get a free consultation for any of our services.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href="https://wa.me/917396180986?text=Hi! I'd like a free consultation about TezConnect services."
          target="_blank" rel="noopener noreferrer"
          style={{ background: "#25d366", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
        >
          💬 WhatsApp Us
        </a>
        <a
          href="mailto:hello@tezconnect.com"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 24px", color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
        >
          ✉️ Email Us
        </a>
        <a
          href="tel:+917396180986"
          style={{ background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 10, padding: "12px 24px", color: T.orange, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}
        >
          📞 Call Now
        </a>
      </div>
      <div style={{ fontSize: 12, color: T.textLow, marginTop: 16 }}>
        📍 Kokapet, Hyderabad · hello@tezconnect.com · +91 73961 80986 / +91 97031 80986
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Marketing", "Social", "SEO", "Automation", "Development", "ERP", "IoT", "Branding"];

  const filtered = filter === "All"
    ? SERVICES
    : SERVICES.filter(s => s.tag === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#0d1020,#0c0e1a)",
        border: `1px solid ${T.orange}33`,
        borderRadius: 20, padding: "28px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: T.orange + "06" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: T.orange, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
            🚀 Our Services
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, letterSpacing: "-.03em", marginBottom: 8, lineHeight: 1.2 }}>
            Grow Your Business with <span style={{ color: T.orange }}>TezConnect</span>
          </h2>
          <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.7, maxWidth: 500 }}>
            From digital marketing to custom software — we provide end-to-end solutions to help Indian businesses connect faster and grow smarter.
          </p>
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              ["8+", "Services"],
              ["500+", "Clients"],
              ["5+", "Years"],
            ].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontWeight: 800, fontSize: 20, color: T.orange }}>{v}</div>
                <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? T.orangeMd : T.bgCard,
              border: `1px solid ${filter === f ? T.orange + "55" : T.border}`,
              borderRadius: 20, padding: "7px 16px",
              color: filter === f ? T.orange : T.textMid,
              fontWeight: 700, fontSize: 12, cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all .2s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}>
        {filtered.map((service, i) => (
          <ServiceCard key={service.title} service={service} index={i} />
        ))}
      </div>

      {/* Contact banner */}
      <ContactBanner />
    </div>
  );
}

