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

const TYPE_CONFIG = {
  online:  { label: "Online",    icon: "💻", color: T.info },
  offline: { label: "In-Person", icon: "📍", color: T.orange },
  hybrid:  { label: "Hybrid",    icon: "🔀", color: T.amber },
};

const inputStyle = {
  width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
  borderRadius: 9, padding: "10px 14px", color: T.text,
  fontSize: 13, outline: "none", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "border-color .2s",
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: T.textMid,
  textTransform: "uppercase", letterSpacing: ".08em",
  display: "block", marginBottom: 6,
};

/* ── Delete Confirm Modal ── */
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, background: "#000d",
        zIndex: 500, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: "28px 24px",
          maxWidth: 340, width: "100%", textAlign: "center",
          animation: "scaleIn .2s ease",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 24 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: "transparent",
              border: `1px solid ${T.border}`, borderRadius: 9,
              padding: "10px", color: T.textMid, fontSize: 13,
              fontWeight: 700, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, background: T.errorLo,
              border: `1px solid ${T.error}44`, borderRadius: 9,
              padding: "10px", color: T.error, fontSize: 13,
              fontWeight: 700, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create / Edit Event Modal ── */
function EventModal({ event, session, onClose, onSave }) {
  const isNew = !event?.id;
  const [form, setForm] = useState({
    title: "", description: "", location: "",
    event_date: "", event_type: "offline", max_attendees: "",
    ...(event || {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!form.title.trim()) { setError("Event title is required."); return; }
    if (!form.event_date)   { setError("Date and time is required."); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#000d",
        zIndex: 400, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.bgCard, border: `1px solid ${T.border}`,
          borderRadius: 20, padding: "28px", width: "100%",
          maxWidth: 520, maxHeight: "92vh", overflowY: "auto",
          animation: "scaleIn .2s ease",
        }}
      >
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: T.text, letterSpacing: "-.02em" }}>
              {isNew ? "📅 Create Event" : "✏️ Edit Event"}
            </div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>
              {isNew ? "Host a B2B networking event" : "Update event details"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Event Title *</label>
            <input
              value={form.title}
              onChange={e => { set("title", e.target.value); setError(""); }}
              placeholder="e.g. B2B Networking Meetup Mumbai"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="What is this event about? Who should attend?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Date + Max attendees */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Date & Time *</label>
              <input
                type="datetime-local"
                value={form.event_date}
                onChange={e => { set("event_date", e.target.value); setError(""); }}
                style={{ ...inputStyle, colorScheme: "dark" }}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            <div>
              <label style={labelStyle}>Max Attendees</label>
              <input
                type="number"
                value={form.max_attendees}
                onChange={e => set("max_attendees", e.target.value)}
                placeholder="Unlimited"
                min="1"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = T.orange}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location / Link</label>
            <input
              value={form.location}
              onChange={e => set("location", e.target.value)}
              placeholder="Venue address or meeting link"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = T.orange}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* Event type */}
          <div>
            <label style={labelStyle}>Event Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => set("event_type", key)}
                  style={{
                    background: form.event_type === key ? cfg.color + "18" : T.bgInput,
                    border: `1.5px solid ${form.event_type === key ? cfg.color : T.border}`,
                    borderRadius: 9, padding: "10px 8px",
                    color: form.event_type === key ? cfg.color : T.textMid,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    transition: "all .2s", textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.icon}</div>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <button
            onClick={onClose}
            style={{ flex: 1, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 9, padding: "12px", color: T.textMid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "12px", color: saving ? T.textMid : "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: saving ? "none" : "0 4px 20px #f9731440" }}
          >
            {saving ? "Saving…" : isNew ? "🚀 Create Event" : "💾 Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single Event Card ── */
function EventCard({ event, session, onEdit, onRefresh }) {
  const [rsvpd, setRsvpd]           = useState(false);
  const [attendees, setAttendees]   = useState(0);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isCreator = event.creator_id === session.userId;
  const cfg = TYPE_CONFIG[event.event_type] || TYPE_CONFIG.offline;
  const isPast = new Date(event.event_date) < new Date();
  const isFull = event.max_attendees && attendees >= event.max_attendees && !rsvpd;

  useEffect(() => {
    supabase
      .from("event_rsvps")
      .select("*", { count: "exact" })
      .eq("event_id", event.id)
      .then(({ count, data }) => {
        setAttendees(count || 0);
        setRsvpd(!!(data || []).find(r => r.user_id === session.userId));
      });
  }, [event.id, session.userId]);

  const toggleRsvp = async (e) => {
    e.stopPropagation();
    setRsvpLoading(true);
    if (rsvpd) {
      await supabase.from("event_rsvps").delete()
        .eq("event_id", event.id).eq("user_id", session.userId);
      setRsvpd(false);
      setAttendees(a => Math.max(0, a - 1));
    } else {
      await supabase.from("event_rsvps").insert({
        event_id: event.id, user_id: session.userId,
      });
      setRsvpd(true);
      setAttendees(a => a + 1);
    }
    setRsvpLoading(false);
    onRefresh();
  };

  const handleDelete = async () => {
    await supabase.from("events").delete().eq("id", event.id);
    setConfirmDelete(false);
    onRefresh();
  };

  const formatted = new Date(event.event_date).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const daysUntil = Math.ceil(
    (new Date(event.event_date) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <div style={{
        background: T.bgCard, border: `1px solid ${T.border}`,
        borderRadius: 16, overflow: "hidden",
        transition: "all .22s", display: "flex", flexDirection: "column",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color + "44"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${cfg.color}10`; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        {/* Color bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg,${cfg.color},${cfg.color}33)`, flexShrink: 0 }} />

        <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Top row — badges + actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span style={{ background: cfg.color + "18", border: `1px solid ${cfg.color}33`, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                {cfg.icon} {cfg.label}
              </span>
              {isPast && (
                <span style={{ background: T.bgInput, border: `1px solid ${T.border}`, color: T.textLow, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  Ended
                </span>
              )}
              {!isPast && daysUntil <= 7 && daysUntil >= 0 && (
                <span style={{ background: T.amberLo, border: `1px solid ${T.amber}33`, color: T.amber, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  🔥 {daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                </span>
              )}
              {isCreator && (
                <span style={{ background: T.orangeMd, border: `1px solid ${T.orange}33`, color: T.orange, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  ⭐ Yours
                </span>
              )}
              {rsvpd && !isPast && (
                <span style={{ background: T.successLo, border: `1px solid ${T.success}33`, color: T.success, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  ✓ Going
                </span>
              )}
            </div>

            {isCreator && (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={e => { e.stopPropagation(); onEdit(event); }}
                  style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 10px", color: T.textMid, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  ✏️
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                  style={{ background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 8, padding: "5px 10px", color: T.error, fontSize: 12, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  🗑
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ fontWeight: 800, fontSize: 16, color: T.text, letterSpacing: "-.02em", marginBottom: 8, lineHeight: 1.3 }}>
            {event.title}
          </div>

          {/* Description */}
          {event.description && (
            <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 14, flex: 1 }}>
              {event.description.length > 120
                ? event.description.slice(0, 120) + "…"
                : event.description}
            </p>
          )}

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18, marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>🗓</span>
              <span style={{ fontSize: 12, color: T.textMid }}>{formatted}</span>
            </div>
            {event.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>📍</span>
                <span style={{ fontSize: 12, color: T.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {event.location}
                </span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>👥</span>
              <span style={{ fontSize: 12, color: T.textMid }}>
                {attendees} attending
                {event.max_attendees ? ` · ${event.max_attendees - attendees} spots left` : ""}
              </span>
              {event.max_attendees && (
                <div style={{ flex: 1, height: 3, background: T.bgInput, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (attendees / event.max_attendees) * 100)}%`, background: isFull ? T.error : T.success, borderRadius: 4, transition: "width .4s" }} />
                </div>
              )}
            </div>
          </div>

          {/* RSVP Button */}
          {!isPast ? (
            <button
              onClick={toggleRsvp}
              disabled={rsvpLoading || isFull}
              style={{
                width: "100%",
                background: isFull
                  ? T.bgInput
                  : rsvpd
                  ? T.errorLo
                  : "linear-gradient(135deg,#f97316,#ea6008)",
                border: isFull
                  ? `1px solid ${T.border}`
                  : rsvpd
                  ? `1px solid ${T.error}44`
                  : "none",
                borderRadius: 10, padding: "11px 0",
                color: isFull ? T.textLow : rsvpd ? T.error : "#fff",
                fontSize: 13, fontWeight: 700,
                cursor: rsvpLoading || isFull ? "not-allowed" : "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all .2s",
                boxShadow: !isFull && !rsvpd ? "0 4px 16px #f9731430" : "none",
                opacity: rsvpLoading ? 0.7 : 1,
              }}
            >
              {rsvpLoading ? "…"
                : isFull ? "🚫 Event Full"
                : rsvpd ? "✕ Cancel RSVP"
                : "✓ RSVP Now — It's Free"}
            </button>
          ) : (
            <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 0", textAlign: "center", fontSize: 13, color: T.textLow, fontWeight: 600 }}>
              This event has ended
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Event?"
          message={`This will permanently delete "${event.title}" and all RSVPs.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}

/* ── Stats Bar ── */
function StatsBar({ events, session }) {
  const total    = events.length;
  const upcoming = events.filter(e => new Date(e.event_date) >= new Date()).length;
  const mine     = events.filter(e => e.creator_id === session.userId).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {[
        { label: "Total Events", val: total,    icon: "📅", color: T.orange },
        { label: "Upcoming",     val: upcoming, icon: "⏳", color: T.info },
        { label: "My Events",    val: mine,     icon: "⭐", color: T.amber },
      ].map(s => (
        <div key={s.label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 24, color: s.color, letterSpacing: "-.03em" }}>{s.val}</div>
          <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export default function EventsPage({ session }) {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [tab, setTab]         = useState("upcoming");
  const [search, setSearch]   = useState("");

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    if (!error) setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const saveEvent = async (form) => {
    if (form.id) {
      await supabase.from("events").update({
        title: form.title,
        description: form.description,
        location: form.location,
        event_date: form.event_date,
        event_type: form.event_type,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      }).eq("id", form.id);
    } else {
      await supabase.from("events").insert({
        creator_id: session.userId,
        title: form.title,
        description: form.description,
        location: form.location,
        event_date: form.event_date,
        event_type: form.event_type,
        max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      });
    }
    fetchEvents();
  };

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.event_date) >= now);
  const past     = events.filter(e => new Date(e.event_date) <  now);
  const mine     = events.filter(e => e.creator_id === session.userId);

  const applySearch = (list) => !search
    ? list
    : list.filter(e =>
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.location?.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase())
      );

  const tabs = [
    { id: "upcoming", label: "⏳ Upcoming", count: upcoming.length },
    { id: "past",     label: "🕐 Past",     count: past.length },
    { id: "mine",     label: "⭐ My Events", count: mine.length },
  ];

  const displayed = applySearch(
    tab === "upcoming" ? upcoming : tab === "past" ? past : mine
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0d1020,#0c0e1a)",
        border: `1px solid ${T.orange}33`, borderRadius: 20,
        padding: "28px 32px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: T.orange + "06" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.orange, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>
              📅 B2B Events
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 26, color: T.text, letterSpacing: "-.03em", marginBottom: 6 }}>
              Networking <span style={{ color: T.orange }}>Events</span>
            </h2>
            <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6, maxWidth: 400 }}>
              Attend or host B2B events. RSVP to connect with professionals in person or online.
            </p>
          </div>
          <button
            onClick={() => setModal({})}
            style={{
              background: "linear-gradient(135deg,#f97316,#ea6008)",
              border: "none", borderRadius: 12, padding: "12px 24px",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: "0 6px 24px #f9731450",
              position: "relative", zIndex: 2,
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Create Event
          </button>
        </div>
      </div>

      {/* Stats */}
      {!loading && <StatsBar events={events} session={session} />}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍  Search events by title, location, or description…"
        style={{
          ...inputStyle,
          padding: "12px 16px",
          borderRadius: 12,
          fontSize: 13,
        }}
        onFocus={e => e.target.style.borderColor = T.orange}
        onBlur={e => e.target.style.borderColor = T.border}
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: tab === t.id ? T.orangeMd : T.bgCard,
              border: `1px solid ${tab === t.id ? T.orange + "55" : T.border}`,
              borderRadius: 10, padding: "9px 18px",
              color: tab === t.id ? T.orange : T.textMid,
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all .2s",
            }}
          >
            {t.label}
            <span style={{
              background: tab === t.id ? T.orange : T.bgInput,
              color: tab === t.id ? "#fff" : T.textLow,
              borderRadius: 20, fontSize: 10, fontWeight: 800,
              padding: "1px 7px", minWidth: 20, textAlign: "center",
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading events…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: "70px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8 }}>
            {tab === "upcoming" ? "No upcoming events" : tab === "past" ? "No past events yet" : "You haven't created any events"}
          </div>
          <div style={{ color: T.textMid, fontSize: 14, marginBottom: 24, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 24px" }}>
            {tab === "mine"
              ? "Host your first B2B event and start building your community"
              : "Check back soon — or be the first to create one!"}
          </div>
          <button
            onClick={() => setModal({})}
            style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 4px 20px #f9731440" }}
          >
            + Create First Event
          </button>
        </div>
      )}

      {/* Events grid */}
      {!loading && displayed.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
          {displayed.map(event => (
            <EventCard
              key={event.id}
              event={event}
              session={session}
              onEdit={ev => setModal(ev)}
              onRefresh={fetchEvents}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal !== null && (
        <EventModal
          event={modal}
          session={session}
          onClose={() => setModal(null)}
          onSave={saveEvent}
        />
      )}
    </div>
  );
}