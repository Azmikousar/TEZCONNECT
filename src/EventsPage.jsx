import { useState, useEffect, useCallback } from "react";
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

/* ── CHANGE THIS to Lekhakraj's real user ID — same as LeadsPage.jsx ── */
const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";
const ADMIN_UPI = "tezconnect@upi"; // for QR/manual payment fallback
const ADMIN_PHONE = "917396180986";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

/* ── Payment Modal ── */
function PaymentModal({ event, session, profile, onClose, onPaid }) {
  const [step, setStep]     = useState("confirm"); // confirm | processing | success | failed
  const [error, setError]   = useState("");
  const [txnRef, setTxnRef] = useState("");

  const handlePay = async () => {
    setStep("processing");
    setError("");

    try {
      // 1. Create order on backend
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: event.registration_fee,
          eventId: event.id,
          userId: session.userId,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TezConnect",
        description: event.title,
        order_id: orderData.orderId,
        prefill: {
          name: profile?.name || session.name || "",
          email: session.email || "",
          contact: profile?.mobile || "",
        },
        theme: { color: "#f97316" },
        handler: async function (response) {
          // 3. Verify payment on backend
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: event.id,
                userId: session.userId,
                amount: event.registration_fee,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

            setTxnRef(response.razorpay_payment_id);
            setStep("success");
            setTimeout(() => { onPaid(); onClose(); }, 2000);
          } catch (err) {
            setError(err.message);
            setStep("failed");
          }
        },
        modal: {
          ondismiss: function () {
            setStep("confirm");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(response.error.description || "Payment failed");
        setStep("failed");
      });
      rzp.open();

      // Reset to confirm step since modal is now controlled by Razorpay's own UI
      setStep("confirm");

    } catch (err) {
      setError(err.message);
      setStep("confirm");
    }
  };

  return (
    <div onClick={step==="confirm"?onClose:undefined} style={{ position:"fixed", inset:0, background:"#000d", zIndex:600, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, padding:"20px 20px 40px", animation:"slideUp .3s ease" }}>
        <div style={{ width:40, height:4, background:T.border, borderRadius:4, margin:"0 auto 20px" }}/>

        {(step === "confirm" || step === "failed") && (
          <>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div style={{ fontWeight:800, fontSize:18, color:T.text }}>💳 Event Registration</div>
              <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:30, height:30, color:T.textMid, fontSize:15, cursor:"pointer" }}>×</button>
            </div>

            {error && <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px 14px", fontSize:12, color:T.error, marginBottom:16 }}>⚠ {error}</div>}

            <div style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px", marginBottom:20 }}>
              <div style={{ fontWeight:700, fontSize:15, color:T.text, marginBottom:6 }}>{event.title}</div>
              <div style={{ fontSize:12, color:T.textMid, marginBottom:4 }}>📅 {formatDate(event.event_date)} · {formatTime(event.event_date)}</div>
              {event.location && <div style={{ fontSize:12, color:T.textMid }}>📍 {event.location}</div>}
            </div>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:14, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:11, color:T.textLow, textTransform:"uppercase", letterSpacing:".08em" }}>Registration Fee</div>
                <div style={{ fontWeight:800, fontSize:26, color:T.orange, marginTop:2 }}>₹{event.registration_fee}</div>
              </div>
              <div style={{ fontSize:36 }}>🎟️</div>
            </div>

            <button onClick={handlePay}
              style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"15px", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 20px #f9731440" }}>
              Pay ₹{event.registration_fee} & Register
            </button>

            <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:14 }}>
              <span style={{ fontSize:10, color:T.textLow }}>🔒 Secured by Razorpay</span>
              <span style={{ fontSize:10, color:T.textLow }}>·</span>
              <span style={{ fontSize:10, color:T.textLow }}>UPI · Cards · Net Banking</span>
            </div>
          </>
        )}

        {step === "success" && (
          <div style={{ textAlign:"center", padding:"30px 0" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:T.successLo, border:`2px solid ${T.success}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px" }}>✓</div>
            <div style={{ fontWeight:800, fontSize:18, color:T.text, marginBottom:8 }}>Registration Confirmed!</div>
            <div style={{ fontSize:13, color:T.textMid, marginBottom:4 }}>You're all set for {event.title}</div>
            <div style={{ fontSize:11, color:T.textLow, marginTop:8 }}>Payment ID: {txnRef}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Create/Edit Event Modal (admin only) ── */
function EventModal({ event, session, onClose, onSaved }) {
  const isEdit = !!event?.id;
  const [form, setForm] = useState({
    title:"", description:"", location:"", event_date:"",
    event_type:"offline", max_attendees:"", registration_fee:"0",
    ...event,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.event_date) { setError("Date & time is required"); return; }
    setSaving(true);

    const fee = parseFloat(form.registration_fee) || 0;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      event_date: form.event_date,
      event_type: form.event_type,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      registration_fee: fee,
      is_paid: fee > 0,
      creator_id:ADMIN_USER_ID,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("events").update(payload).eq("id", event.id));
    } else {
      ({ error: err } = await supabase.from("events").insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const inputStyle = {
    width:"100%", background:T.bgInput, border:`1px solid ${T.border}`,
    borderRadius:10, padding:"11px 14px", color:T.text, fontSize:13,
    outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000d", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", animation:"slideUp .3s ease" }}>
        <div style={{ width:40, height:4, background:T.border, borderRadius:4, margin:"12px auto 0" }}/>
        <div style={{ padding:"16px 20px 40px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:18, color:T.text }}>{isEdit?"Edit Event":"Create Event"}</div>
            <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:32, height:32, color:T.textMid, fontSize:16, cursor:"pointer" }}>×</button>
          </div>

          {error && <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px 14px", fontSize:12, color:T.error, marginBottom:14 }}>⚠ {error}</div>}

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Event Title *</label>
              <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. B2B Networking Summit 2026" style={inputStyle}/>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Description</label>
              <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="What's this event about?" rows={3} style={{ ...inputStyle, resize:"vertical" }}/>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Date & Time *</label>
              <input type="datetime-local" value={form.event_date} onChange={e=>set("event_date",e.target.value)} style={inputStyle}/>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Location</label>
              <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Hyderabad / Zoom Link" style={inputStyle}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Event Type</label>
                <select value={form.event_type} onChange={e=>set("event_type",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Max Attendees</label>
                <input type="number" value={form.max_attendees} onChange={e=>set("max_attendees",e.target.value)} placeholder="e.g. 100" style={inputStyle}/>
              </div>
            </div>

            {/* Registration Fee */}
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Registration Fee (₹)</label>
              <input type="number" value={form.registration_fee} onChange={e=>set("registration_fee",e.target.value)} placeholder="0 for free event" style={inputStyle}/>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {[0, 499, 999, 1999].map(amt => (
                  <button key={amt} onClick={()=>set("registration_fee", amt.toString())}
                    style={{ flex:1, background:form.registration_fee===amt.toString()?T.orangeMd:T.bgInput, border:`1px solid ${form.registration_fee===amt.toString()?T.orange+"55":T.border}`, borderRadius:8, padding:"7px 0", color:form.registration_fee===amt.toString()?T.orange:T.textMid, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {amt === 0 ? "Free" : `₹${amt}`}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color:T.textLow, marginTop:6 }}>Set 0 for a free event. Non-admins will need to pay this amount to register for paid events.</div>
            </div>

            <button onClick={save} disabled={saving}
              style={{ width:"100%", background:saving?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"14px", color:saving?T.textMid:"#fff", fontSize:15, fontWeight:700, cursor:saving?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:saving?"none":"0 4px 20px #f9731440" }}>
              {saving?"Saving…":isEdit?"Update Event":"Create Event 📅"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Event Card ── */
function EventCard({ event, session, isAdmin, attendeeCount, isRsvped, rsvpData, onRsvp, onCancelRsvp, onPay, onEdit, onDelete, onViewAttendees, rsvpingId, rsvpError }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const isPast = new Date(event.event_date) < new Date();
  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const isPaid = event.registration_fee > 0;
  const isRsvping = rsvpingId === event.id;

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
      {/* Header bar */}
      <div style={{ height:4, background: isPaid ? `linear-gradient(90deg,${T.amber},${T.orange})` : `linear-gradient(90deg,${T.success},${T.info})` }}/>

      <div style={{ padding:"18px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ background:isPaid?T.amberLo:T.successLo, border:`1px solid ${isPaid?T.amber:T.success}44`, color:isPaid?T.amber:T.success, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
                {isPaid ? `₹${event.registration_fee}` : "Free"}
              </span>
              <span style={{ background:T.bgInput, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, textTransform:"capitalize" }}>
                {event.event_type}
              </span>
              {isPast && <span style={{ background:T.errorLo, border:`1px solid ${T.error}44`, color:T.error, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>Past</span>}
            </div>
            <div style={{ fontWeight:800, fontSize:16, color:T.text, lineHeight:1.3 }}>{event.title}</div>
          </div>
          {isAdmin && (
            <div style={{ position:"relative", flexShrink:0 }}>
              <button onClick={()=>onEdit(event)} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", color:T.textMid, fontSize:12, cursor:"pointer", marginRight:6 }}>✏️</button>
              <button onClick={()=>setConfirmDel(true)} style={{ background:T.errorLo, border:`1px solid ${T.error}33`, borderRadius:8, padding:"6px 10px", color:T.error, fontSize:12, cursor:"pointer" }}>🗑</button>
            </div>
          )}
        </div>

        {event.description && <p style={{ fontSize:13, color:T.textMid, lineHeight:1.6, marginBottom:14 }}>{event.description}</p>}

        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}>
            <span>📅</span>{formatDate(event.event_date)} · {formatTime(event.event_date)}
          </div>
          {event.location && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}>
              <span>📍</span>{event.location}
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}>
            <span>👥</span>{attendeeCount} registered{event.max_attendees ? ` / ${event.max_attendees}` : ""}
          </div>
        </div>

        {/* Capacity bar */}
        {event.max_attendees && (
          <div style={{ height:6, background:T.bgInput, borderRadius:4, overflow:"hidden", marginBottom:14 }}>
            <div style={{ height:"100%", width:`${Math.min(100,(attendeeCount/event.max_attendees)*100)}%`, background: isFull ? T.error : "linear-gradient(90deg,#f97316,#ea6008)", borderRadius:4, transition:"width .5s" }}/>
          </div>
        )}

        {/* RSVP error, shown right above the action button */}
        {!isRsvping && rsvpError && rsvpError.eventId === event.id && (
          <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"9px 12px", fontSize:12, color:T.error, marginBottom:10 }}>
            ⚠ {rsvpError.message}
          </div>
        )}

       {/* Action button */}
{isAdmin ? (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background:T.orangeMd, border:`1px solid ${T.orange}33`, borderRadius:10 }}>
    <div style={{ fontSize:12, color:T.orange, fontWeight:700 }}>
      👤 You're the organizer
    </div>
    <div style={{ fontSize:13, fontWeight:800, color:T.orange }}>
      {attendeeCount} registered
    </div>
  </div>
) : isPast ? (
  <div style={{ textAlign:"center", padding:"10px", background:T.bgInput, borderRadius:10, color:T.textLow, fontSize:12, fontWeight:600 }}>Event has ended</div>
) : isRsvped ? (
  <div style={{ display:"flex", gap:8 }}>
    <div style={{ flex:1, background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:10, padding:"11px", color:T.success, fontSize:13, fontWeight:700, textAlign:"center" }}>
      ✓ {rsvpData?.payment_status === "paid" ? "Registered & Paid" : "Registered"}
    </div>
    <button onClick={()=>onCancelRsvp(event.id)}
      style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"11px 16px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      Cancel
    </button>
  </div>
) : isFull ? (
  <div style={{ textAlign:"center", padding:"11px", background:T.errorLo, borderRadius:10, color:T.error, fontSize:13, fontWeight:700 }}>Event Full</div>
) : isPaid ? (
  <button onClick={()=>onPay(event)}
    style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"12px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440" }}>
    💳 Pay ₹{event.registration_fee} & Register
  </button>
) : (
  <button onClick={()=>onRsvp(event.id)} disabled={isRsvping}
    style={{ width:"100%", background:isRsvping?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"12px", color:isRsvping?T.textMid:"#fff", fontSize:14, fontWeight:700, cursor:isRsvping?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:isRsvping?"none":"0 4px 16px #f9731440" }}>
    {isRsvping ? "Registering…" : "Register"}
  </button>
)}
{isAdmin && attendeeCount > 0 && (
  <button onClick={()=>onViewAttendees(event)}
    style={{ width:"100%", marginTop:8, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", color:T.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
    👥 View {attendeeCount} Attendee{attendeeCount!==1?"s":""}
  </button>
)}
      </div>

      {/* Confirm delete */}
      {confirmDel && (
        <div onClick={()=>setConfirmDel(false)} style={{ position:"fixed", inset:0, background:"#000d", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"24px", maxWidth:300, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:8 }}>Delete Event?</div>
            <div style={{ fontSize:13, color:T.textMid, marginBottom:20 }}>This cannot be undone. All RSVPs will be removed.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setConfirmDel(false)} style={{ flex:1, background:"transparent", border:`1px solid ${T.border}`, borderRadius:9, padding:"10px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
              <button onClick={()=>{setConfirmDel(false);onDelete(event.id);}} style={{ flex:1, background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px", color:T.error, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main EventsPage ── */
export default function EventsPage({ session, profile}) {
  const isAdmin = session.userId === ADMIN_USER_ID;

  const [events, setEvents]       = useState([]);
  const [rsvps, setRsvps]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("upcoming");
  const [search, setSearch]       = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [payEvent, setPayEvent]   = useState(null);
  const [rsvpingId, setRsvpingId] = useState(null);
  const [rsvpError, setRsvpError] = useState(null); // { eventId, message }

  const fetchData = useCallback(async () => {
    const [{ data: evts }, { data: rsvpData }] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("event_rsvps").select("*"),
    ]);
    setEvents(evts || []);
    setRsvps(rsvpData || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRsvp = async (eventId) => {
    setRsvpError(null);
    setRsvpingId(eventId);
    console.log("[TezConnect Events] RSVP attempt", { eventId, userId: session.userId });

    const { error, data } = await supabase.from("event_rsvps").insert({
      event_id: eventId, user_id: session.userId, payment_status: "free", amount_paid: 0,
    }).select();

    setRsvpingId(null);

    if (error) {
      console.error("[TezConnect Events] RSVP FAILED:", error);
      let message = error.message;
      if (error.code === "42501" || error.message?.toLowerCase().includes("row-level security")) {
        message = "You don't have permission to register (RLS policy blocking insert on event_rsvps).";
      } else if (error.code === "23505") {
        message = "You're already registered for this event.";
      }
      setRsvpError({ eventId, message });
      return;
    }

    console.log("[TezConnect Events] RSVP success:", data);
    fetchData();
  };

  const handleCancelRsvp = async (eventId) => {
    const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", session.userId);
    if (error) {
      console.error("[TezConnect Events] cancel RSVP failed:", error);
      setRsvpError({ eventId, message: "Couldn't cancel registration: " + error.message });
      return;
    }
    fetchData();
  };

  const handleDelete = async (id) => {
    await supabase.from("events").delete().eq("id", id);
    fetchData();
  };

  const getAttendeeCount = (eventId) => rsvps.filter(r => r.event_id === eventId).length;
  const getMyRsvp = (eventId) => rsvps.find(r => r.event_id === eventId && r.user_id === session.userId);

  const now = new Date();
  const filtered = events.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (tab === "upcoming") return new Date(e.event_date) >= now;
    if (tab === "past") return new Date(e.event_date) < now;
    if (tab === "myevents") return !!getMyRsvp(e.id);
    return true;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:T.textLow, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>📅 Events</div>
          <h2 style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-.03em" }}>
            TezConnect <span style={{ color:T.orange }}>Events</span>
          </h2>
          {!isAdmin && (
            <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>👁️ Browse and register — only admin can create events</div>
          )}
        </div>
        {isAdmin && (
          <button onClick={()=>setShowCreate(true)}
            style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"11px 20px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440", display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:16 }}>+</span> Create Event
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
        {[["upcoming","Upcoming"],["past","Past"],["myevents","My Events"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ background:tab===id?T.orangeMd:"transparent", border:`1px solid ${tab===id?T.orange+"55":T.border}`, borderRadius:9, padding:"8px 16px", color:tab===id?T.orange:T.textMid, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:T.textLow, pointerEvents:"none" }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events…"
          style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px 10px 36px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:12 }}>
          <div style={{ width:24, height:24, border:"2px solid #f9731633", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
          <span style={{ color:T.textMid, fontSize:13 }}>Loading events…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📅</div>
          <div style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:8 }}>
            {tab==="myevents" ? "You haven't registered for any events" : "No events found"}
          </div>
          {isAdmin && tab!=="myevents" && (
            <button onClick={()=>setShowCreate(true)}
              style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"12px 28px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:10 }}>
              + Create First Event
            </button>
          )}
        </div>
      )}

      {/* Events grid */}
      {!loading && filtered.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              session={session}
              isAdmin={isAdmin}
              attendeeCount={getAttendeeCount(event.id)}
              isRsvped={!!getMyRsvp(event.id)}
              rsvpData={getMyRsvp(event.id)}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              onPay={setPayEvent}
              onEdit={setEditEvent}
              onDelete={handleDelete}
              onViewAttendees={()=>{}}
              rsvpingId={rsvpingId}
              rsvpError={rsvpError}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {isAdmin && showCreate && <EventModal session={session} onClose={()=>setShowCreate(false)} onSaved={fetchData}/>}
      {isAdmin && editEvent && <EventModal event={editEvent} session={session} onClose={()=>setEditEvent(null)} onSaved={fetchData}/>}
      {payEvent && <PaymentModal event={payEvent} session={session} profile={profile} onClose={()=>setPayEvent(null)} onPaid={fetchData}/>}

    </div>
  );
}
