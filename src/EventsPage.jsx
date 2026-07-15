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

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
}

/* Fire-and-forget WhatsApp trigger. Safe to call for both free & paid events —
   the server no-ops if the event has no zoom_link. */
async function triggerWhatsAppInvite(eventId, userId) {
  try {
    await fetch("/api/send-event-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, userId }),
    });
  } catch (err) {
    console.error("[TezConnect Events] WhatsApp trigger failed:", err);
  }
}

/* Uploads an image file to the 'event-media' storage bucket and returns its public URL. */
async function uploadEventImage(file, folder = "banners") {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from("event-media").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("event-media").getPublicUrl(path);
  return data.publicUrl;
}

/* ── Reusable: image field with URL input + gallery upload + preview ── */
function ImageUploadField({ label, url, setUrl, folder, hint }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const inputId = `upload-${folder}-${label.replace(/\s+/g,"")}`;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const publicUrl = await uploadEventImage(file, folder);
      setUrl(publicUrl);
    } catch (ex) {
      console.error("[TezConnect Events] image upload failed:", ex);
      setErr(ex.message || "Upload failed — check the event-media storage bucket & policies.");
    }
    setUploading(false);
  };

  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>{label}</label>
      {url && (
        <div style={{ position:"relative", marginBottom:8, borderRadius:10, overflow:"hidden", border:`1px solid ${T.border}` }}>
          <img src={url} alt="" style={{ width:"100%", maxHeight:140, objectFit:"cover", display:"block" }}/>
          <button onClick={()=>setUrl("")} type="button" style={{ position:"absolute", top:6, right:6, background:"#000a", border:"none", borderRadius:"50%", width:26, height:26, color:"#fff", fontSize:14, cursor:"pointer" }}>×</button>
        </div>
      )}
      <div style={{ display:"flex", gap:8 }}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://… or upload from gallery" style={{ flex:1, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
        <label htmlFor={inputId} style={{ background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:10, padding:"0 14px", color:T.orange, fontWeight:700, cursor:uploading?"wait":"pointer", fontSize:12, display:"flex", alignItems:"center", whiteSpace:"nowrap" }}>
          {uploading ? "Uploading…" : "📁 Upload"}
        </label>
        <input id={inputId} type="file" accept="image/*" onChange={handleFile} disabled={uploading} style={{ display:"none" }}/>
      </div>
      {hint && <div style={{ fontSize:11, color:T.textLow, marginTop:6 }}>{hint}</div>}
      {err && <div style={{ fontSize:11, color:T.error, marginTop:6 }}>⚠ {err}</div>}
    </div>
  );
}

/* ── Reusable: editable string-list (objectives / activities / benefits / what-to-bring) ── */
function TagListEditor({ label, items, setItems, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setItems([...items, v]);
    setDraft("");
  };
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>{label}</label>
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <input
          value={draft}
          onChange={e=>setDraft(e.target.value)}
          onKeyDown={e=>{ if (e.key==="Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ flex:1, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.text, fontSize:13, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
        />
        <button onClick={add} type="button" style={{ background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:10, padding:"0 16px", color:T.orange, fontWeight:700, cursor:"pointer" }}>Add</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:9, padding:"8px 12px" }}>
            <span style={{ fontSize:12, color:T.text }}>{it}</span>
            <button onClick={()=>setItems(items.filter((_,idx)=>idx!==i))} type="button" style={{ background:"transparent", border:"none", color:T.textLow, fontSize:14, cursor:"pointer" }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable: editable agenda timeline ── */
function AgendaEditor({ agenda, setAgenda }) {
  const [draft, setDraft] = useState({ time:"", title:"", bullets:"" });
  const add = () => {
    if (!draft.time.trim() || !draft.title.trim()) return;
    setAgenda([...agenda, {
      time: draft.time.trim(),
      title: draft.title.trim(),
      bullets: draft.bullets.split("\n").map(b=>b.trim()).filter(Boolean),
    }]);
    setDraft({ time:"", title:"", bullets:"" });
  };
  const inputStyle = { width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 12px", color:T.text, fontSize:12, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" };
  return (
    <div>
      <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Agenda</label>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {agenda.map((a, i) => (
          <div key={i} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:9, padding:"10px 12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color:T.orange, fontWeight:700 }}>{a.time}</div>
                <div style={{ fontSize:13, color:T.text, fontWeight:700, marginTop:2 }}>{a.title}</div>
                {a.bullets?.length > 0 && (
                  <ul style={{ margin:"4px 0 0", paddingLeft:16 }}>
                    {a.bullets.map((b,bi)=><li key={bi} style={{ fontSize:11, color:T.textMid }}>{b}</li>)}
                  </ul>
                )}
              </div>
              <button onClick={()=>setAgenda(agenda.filter((_,idx)=>idx!==i))} type="button" style={{ background:"transparent", border:"none", color:T.textLow, fontSize:14, cursor:"pointer" }}>×</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:10, background:T.bg, border:`1px dashed ${T.border}`, borderRadius:10, padding:10 }}>
        <div style={{ display:"flex", gap:6 }}>
          <input value={draft.time} onChange={e=>setDraft({...draft,time:e.target.value})} placeholder="10:00 AM – 10:30 AM" style={inputStyle}/>
          <input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="Session title" style={inputStyle}/>
        </div>
        <textarea value={draft.bullets} onChange={e=>setDraft({...draft,bullets:e.target.value})} placeholder="One bullet per line" rows={2} style={{ ...inputStyle, resize:"vertical" }}/>
        <button onClick={add} type="button" style={{ background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:9, padding:"8px", color:T.orange, fontWeight:700, cursor:"pointer", fontSize:12 }}>+ Add Agenda Item</button>
      </div>
    </div>
  );
}

/* ── Payment Modal ── */
function PaymentModal({ event, session, profile, onClose, onPaid }) {
  const [step, setStep]     = useState("confirm");
  const [error, setError]   = useState("");
  const [txnRef, setTxnRef] = useState("");

  const handlePay = async () => {
    setStep("processing");
    setError("");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: event.registration_fee, eventId: event.id, userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TezConnect",
        description: event.title,
        order_id: orderData.orderId,
        prefill: { name: profile?.name || session.name || "", email: session.email || "", contact: profile?.mobile || "" },
        theme: { color: "#f97316" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: event.id, userId: session.userId, amount: event.registration_fee,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

            setTxnRef(response.razorpay_payment_id);
            setStep("success");
            triggerWhatsAppInvite(event.id, session.userId); // fire-and-forget
            setTimeout(() => { onPaid(); onClose(); }, 2000);
          } catch (err) {
            setError(err.message);
            setStep("failed");
          }
        },
        modal: { ondismiss: function () { setStep("confirm"); } },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(response.error.description || "Payment failed");
        setStep("failed");
      });
      rzp.open();
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
            <button onClick={handlePay} style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"15px", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 20px #f9731440" }}>
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
            {event.zoom_link && <div style={{ fontSize:11, color:T.success, marginTop:8 }}>📲 Zoom link sent to your WhatsApp</div>}
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
    theme:"", tagline:"", banner_url:"", duration_text:"", zoom_link:"",
    organizer_name:"Tez Connect Ecosystem", organizer_photo_url:"", organizer_link:"",
    ...event,
  });
  const [objectives, setObjectives]     = useState(event?.objectives || []);
  const [activities, setActivities]     = useState(event?.activities || []);
  const [benefits, setBenefits]         = useState(event?.benefits || []);
  const [whatToBring, setWhatToBring]   = useState(event?.what_to_bring || []);
  const [agenda, setAgenda]             = useState(event?.agenda || []);
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
      creator_id: ADMIN_USER_ID,
      theme: form.theme.trim(),
      tagline: form.tagline.trim(),
      banner_url: form.banner_url.trim(),
      duration_text: form.duration_text.trim(),
      zoom_link: form.zoom_link.trim(),
      organizer_name: form.organizer_name.trim() || "Tez Connect Ecosystem",
      organizer_photo_url: form.organizer_photo_url.trim(),
      organizer_link: form.organizer_link.trim(),
      objectives, activities, benefits,
      what_to_bring: whatToBring,
      agenda,
    };

    try {
      let err;
      if (isEdit) {
        ({ error: err } = await supabase.from("events").update(payload).eq("id", event.id));
      } else {
        ({ error: err } = await supabase.from("events").insert(payload));
      }
      if (err) { setSaving(false); setError(err.message); return; }
      setSaving(false);
      onSaved(); onClose();
    } catch (err) {
      console.error("[TezConnect Events] save failed:", err);
      setSaving(false);
      setError(err.message || "Save failed — likely blocked by a row-level security policy on the events table.");
    }
  };

  const inputStyle = { width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"11px 14px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" };
  const labelStyle = { fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000d", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto", animation:"slideUp .3s ease" }}>
        <div style={{ width:40, height:4, background:T.border, borderRadius:4, margin:"12px auto 0" }}/>
        <div style={{ padding:"16px 20px 40px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:18, color:T.text }}>{isEdit?"Edit Event":"Create Event"}</div>
            <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:32, height:32, color:T.textMid, fontSize:16, cursor:"pointer" }}>×</button>
          </div>

          {error && <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px 14px", fontSize:12, color:T.error, marginBottom:14 }}>⚠ {error}</div>}

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Bangalore Business Networking Meet 2026" style={inputStyle}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelStyle}>Theme</label>
                <input value={form.theme} onChange={e=>set("theme",e.target.value)} placeholder="Tez Connect Ecosystem" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Tagline</label>
                <input value={form.tagline} onChange={e=>set("tagline",e.target.value)} placeholder="Connect • Collaborate • Grow" style={inputStyle}/>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="What's this event about?" rows={3} style={{ ...inputStyle, resize:"vertical" }}/>
            </div>

            <ImageUploadField
              label="Banner Image"
              url={form.banner_url}
              setUrl={(v)=>set("banner_url",v)}
              folder="banners"
              hint="Shown at the top of the event page. Upload from your gallery or paste a URL."
            />

            <div>
              <label style={labelStyle}>Date & Time *</label>
              <input type="datetime-local" value={form.event_date} onChange={e=>set("event_date",e.target.value)} style={inputStyle}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="e.g. Bangalore" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Duration</label>
                <input value={form.duration_text} onChange={e=>set("duration_text",e.target.value)} placeholder="3 Hours" style={inputStyle}/>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={labelStyle}>Event Type</label>
                <select value={form.event_type} onChange={e=>set("event_type",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Max Attendees</label>
                <input type="number" value={form.max_attendees} onChange={e=>set("max_attendees",e.target.value)} placeholder="e.g. 60" style={inputStyle}/>
              </div>
            </div>

            {(form.event_type === "online" || form.event_type === "hybrid") && (
              <div>
                <label style={labelStyle}>Zoom Link</label>
                <input value={form.zoom_link} onChange={e=>set("zoom_link",e.target.value)} placeholder="https://zoom.us/j/…" style={inputStyle}/>
                <div style={{ fontSize:11, color:T.textLow, marginTop:6 }}>Sent automatically over WhatsApp when someone registers.</div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Registration Fee (₹)</label>
              <input type="number" value={form.registration_fee} onChange={e=>set("registration_fee",e.target.value)} placeholder="0 for free event" style={inputStyle}/>
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                {[0, 499, 999, 1999].map(amt => (
                  <button key={amt} onClick={()=>set("registration_fee", amt.toString())} type="button"
                    style={{ flex:1, background:form.registration_fee===amt.toString()?T.orangeMd:T.bgInput, border:`1px solid ${form.registration_fee===amt.toString()?T.orange+"55":T.border}`, borderRadius:8, padding:"7px 0", color:form.registration_fee===amt.toString()?T.orange:T.textMid, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {amt === 0 ? "Free" : `₹${amt}`}
                  </button>
                ))}
              </div>
            </div>

            <TagListEditor label="Objectives" items={objectives} setItems={setObjectives} placeholder="Build meaningful business connections"/>
            <AgendaEditor agenda={agenda} setAgenda={setAgenda}/>
            <TagListEditor label="Activities" items={activities} setItems={setActivities} placeholder="Business Card Exchange"/>
            <TagListEditor label="Participant Benefits" items={benefits} setItems={setBenefits} placeholder="High-quality business networking"/>
            <TagListEditor label="What Participants Should Bring" items={whatToBring} setItems={setWhatToBring} placeholder="Business Cards"/>

            <div>
              <label style={labelStyle}>Organizer Name</label>
              <input value={form.organizer_name} onChange={e=>set("organizer_name",e.target.value)} style={inputStyle}/>
            </div>

            <ImageUploadField
              label="Organizer Profile Photo"
              url={form.organizer_photo_url}
              setUrl={(v)=>set("organizer_photo_url",v)}
              folder="organizers"
              hint="Shown as the organizer's avatar on the event page."
            />

            <div>
              <label style={labelStyle}>Organizer Register / Contact Link</label>
              <input value={form.organizer_link} onChange={e=>set("organizer_link",e.target.value)} placeholder="https://wa.me/91… or your website" style={inputStyle}/>
              <div style={{ fontSize:11, color:T.textLow, marginTop:6 }}>Optional — shown as a button under the organizer's name.</div>
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

/* ── Attendees Modal (admin only) ── */
function AttendeesModal({ event, session, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rsvpRows, error: rsvpErr } = await supabase
        .from("event_rsvps").select("*").eq("event_id", event.id).order("created_at", { ascending: true });
      if (rsvpErr) { console.error("[TezConnect Events] fetch attendees failed:", rsvpErr); if (!cancelled) setLoading(false); return; }

      const userIds = (rsvpRows || []).map(r => r.user_id);
      let profileMap = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, name, photo, mobile, email, company, designation").in("id", userIds);
        (profiles || []).forEach(p => { profileMap[p.id] = p; });
      }
      const merged = (rsvpRows || []).map(r => ({ ...r, profile: profileMap[r.user_id] || null }));
      if (!cancelled) { setAttendees(merged); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [event.id]);

  const exportCsv = () => {
    const header = ["Name", "Mobile", "Email", "Company", "Payment Status", "Amount Paid", "Registered At"];
    const rows = attendees.map(a => [
      a.profile?.name || "Unknown", a.profile?.mobile || "", a.profile?.email || "", a.profile?.company || "",
      a.payment_status || "", a.amount_paid ?? 0, a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : "",
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}_attendees.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000d", zIndex:600, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"85vh", display:"flex", flexDirection:"column", animation:"slideUp .3s ease" }}>
        <div style={{ width:40, height:4, background:T.border, borderRadius:4, margin:"12px auto 0", flexShrink:0 }}/>
        <div style={{ padding:"16px 20px 12px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ fontWeight:800, fontSize:17, color:T.text }}>👥 Attendees</div>
            <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:30, height:30, color:T.textMid, fontSize:15, cursor:"pointer" }}>×</button>
          </div>
          <div style={{ fontSize:12, color:T.textMid }}>{event.title} · {attendees.length} registered</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 20px" }}>
          {loading && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 0", gap:12 }}>
              <div style={{ width:20, height:20, border:"2px solid #f9731633", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
              <span style={{ color:T.textMid, fontSize:13 }}>Loading attendees…</span>
            </div>
          )}
          {!loading && attendees.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.textLow, fontSize:13 }}>No one has registered yet.</div>
          )}
          {!loading && attendees.map(a => {
            const p = a.profile || {};
            const initials = (p.name || "?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
            return (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#f97316,#ea6008)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", overflow:"hidden", flexShrink:0 }}>
                  {p.photo ? <img src={p.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{p.name || "Unknown member"}</div>
                  <div style={{ fontSize:11, color:T.textMid, marginTop:2 }}>{p.designation || p.company || "—"}</div>
                  {p.mobile && <div style={{ fontSize:11, color:T.textLow, marginTop:1 }}>📱 {p.mobile}</div>}
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <span style={{ fontSize:10, fontWeight:700, color: a.payment_status === "paid" ? T.success : T.info, background: a.payment_status === "paid" ? T.successLo : T.infoLo, border:`1px solid ${a.payment_status === "paid" ? T.success : T.info}44`, borderRadius:20, padding:"3px 9px" }}>
                    {a.payment_status === "paid" ? `Paid ₹${a.amount_paid}` : "Free"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {!loading && attendees.length > 0 && (
          <div style={{ padding:"14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
            <button onClick={exportCsv} style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px", color:T.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              📥 Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Event Detail Page (full-screen, matches the reference design) ── */
function EventDetailPage({ event, session, isAdmin, attendeeCount, isRsvped, rsvpData, onBack, onEdit, onPay, onRsvp, onCancelRsvp, rsvpingId, rsvpError }) {
  const isPast = new Date(event.event_date) < new Date();
  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const isPaid = event.registration_fee > 0;
  const isRsvping = rsvpingId === event.id;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}?event=${event.id}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false), 2000); } catch {}
  };

  const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:18, marginBottom:16 };
  const sectionTitle = { fontWeight:800, fontSize:14, color:T.text, marginBottom:14, display:"flex", alignItems:"center", gap:8 };
  const checkRow = { display:"flex", alignItems:"flex-start", gap:8, fontSize:13, color:T.text, marginBottom:10, lineHeight:1.4 };

  const overviewRows = [
    ["Event Name", event.title],
    ["Organizer", event.organizer_name || "Tez Connect Ecosystem"],
    ["Date", formatDate(event.event_date)],
    ["Time", formatTime(event.event_date)],
    ["Venue", event.location || "—"],
    ["Participants", event.max_attendees ? `Up to ${event.max_attendees}` : "Open"],
    ["Status", isPast ? "Past" : "Upcoming"],
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <style>{`@media (max-width:860px){ .evtd-grid{ grid-template-columns:1fr !important; } }`}</style>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <button onClick={onBack} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 16px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>← Back to Events</button>
        <div style={{ display:"flex", gap:8 }}>
          {isAdmin && (
            <button onClick={()=>onEdit(event)} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 16px", color:T.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>✏️ Edit Event</button>
          )}
          <button onClick={share} style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"9px 16px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {copied ? "✓ Link Copied" : "🔗 Share Event"}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ borderRadius:18, overflow:"hidden", border:`1px solid ${T.border}` }}>
        <div style={{ position:"relative", width:"100%", aspectRatio:"16/7", minHeight:160, background: event.banner_url ? `url(${event.banner_url}) center/cover no-repeat` : "radial-gradient(circle at 30% 20%, #f9731633, transparent 60%), linear-gradient(135deg,#0b0d17,#06070d)" }}>
          <span style={{ position:"absolute", top:14, left:14, background:"#000000aa", backdropFilter:"blur(4px)", border:`1px solid ${isPast?T.error:T.orange}55`, color:isPast?T.error:T.orange, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20 }}>
            {isPast ? "Past Event" : "Upcoming Event"}
          </span>
          {!event.banner_url && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", padding:"20px" }}>
              <div style={{ fontSize:12, color:T.orange, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:10 }}>{event.theme || event.organizer_name || "Tez Connect Ecosystem"}</div>
              <div style={{ fontWeight:800, fontSize:24, color:"#fff", lineHeight:1.25, maxWidth:480 }}>{event.title}</div>
            </div>
          )}
        </div>
        <div style={{ padding:"18px 20px", background:T.bgCard, textAlign:"center" }}>
          {event.banner_url && (
            <>
              <div style={{ fontSize:12, color:T.orange, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>{event.theme || event.organizer_name || "Tez Connect Ecosystem"}</div>
              <div style={{ fontWeight:800, fontSize:22, color:T.text, lineHeight:1.3 }}>{event.title}</div>
            </>
          )}
          {event.tagline && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginTop:14, color:T.textMid, fontSize:12, fontWeight:600 }}>
                <span style={{ width:24, height:1, background:T.textLow }}/>Theme<span style={{ width:24, height:1, background:T.textLow }}/>
              </div>
              <div style={{ marginTop:6, fontSize:14, fontWeight:700, color:T.text }}>{event.tagline}</div>
            </>
          )}
        </div>
      </div>

      <div className="evtd-grid" style={{ display:"grid", gridTemplateColumns:"minmax(0,2fr) minmax(280px,1fr)", gap:16 }}>

        {/* Main column */}
        <div>
          {event.objectives?.length > 0 && (
            <div style={card}>
              <div style={sectionTitle}>🎯 Objective</div>
              {event.objectives.map((o,i)=>(
                <div key={i} style={checkRow}><span style={{ color:T.orange }}>✓</span>{o}</div>
              ))}
            </div>
          )}

          <div style={card}>
            <div style={sectionTitle}>📋 Event Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14 }}>
              <div>
                <div style={{ fontSize:11, color:T.textLow, marginBottom:4 }}>📅 Duration</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{event.duration_text || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:T.textLow, marginBottom:4 }}>📍 Venue</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{event.location || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:T.textLow, marginBottom:4 }}>👥 Expected Participants</div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{attendeeCount}{event.max_attendees ? ` / ${event.max_attendees}` : ""}</div>
              </div>
            </div>
          </div>

          {event.agenda?.length > 0 && (
            <div style={card}>
              <div style={sectionTitle}>🕐 Agenda</div>
              <div style={{ position:"relative", paddingLeft:18, borderLeft:`2px solid ${T.border}` }}>
                {event.agenda.map((a,i)=>(
                  <div key={i} style={{ position:"relative", marginBottom:20 }}>
                    <div style={{ position:"absolute", left:-24, top:2, width:10, height:10, borderRadius:"50%", background:T.orange, border:`2px solid ${T.bgCard}` }}/>
                    <div style={{ fontSize:11, color:T.orange, fontWeight:700 }}>{a.time}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text, marginTop:2 }}>{a.title}</div>
                    {a.bullets?.length > 0 && (
                      <ul style={{ margin:"6px 0 0", paddingLeft:16 }}>
                        {a.bullets.map((b,bi)=><li key={bi} style={{ fontSize:12, color:T.textMid, marginBottom:2 }}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card, textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:T.orangeMd, border:`1px solid ${T.orange}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, margin:"0 auto 10px", overflow:"hidden" }}>
              {event.organizer_photo_url ? <img src={event.organizer_photo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : "🏢"}
            </div>
            <div style={{ fontWeight:800, fontSize:15, color:T.text }}>{event.organizer_name || "Tez Connect Ecosystem"}</div>
            <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>Organizer</div>
            {event.organizer_link && (
              <a href={event.organizer_link} target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:12, background:T.orangeMd, border:`1px solid ${T.orange}44`, borderRadius:20, padding:"7px 16px", color:T.orange, fontSize:12, fontWeight:700, textDecoration:"none" }}>
                🔗 Contact Organizer
              </a>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={card}>
            <div style={sectionTitle}>📅 Event Overview</div>
            {overviewRows.map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", gap:10, fontSize:12, marginBottom:10 }}>
                <span style={{ color:T.textLow }}>{k}</span>
                <span style={{ color:T.text, fontWeight:600, textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </div>

          {event.activities?.length > 0 && (
            <div style={card}>
              <div style={sectionTitle}>⭐ Activities</div>
              {event.activities.map((a,i)=>(
                <div key={i} style={checkRow}><span style={{ color:T.orange }}>•</span>{a}</div>
              ))}
            </div>
          )}

          {event.benefits?.length > 0 && (
            <div style={card}>
              <div style={sectionTitle}>🏅 Participant Benefits</div>
              {event.benefits.map((b,i)=>(
                <div key={i} style={checkRow}><span style={{ color:T.success }}>✓</span>{b}</div>
              ))}
            </div>
          )}

          {event.what_to_bring?.length > 0 && (
            <div style={card}>
              <div style={sectionTitle}>🎒 What to Bring</div>
              {event.what_to_bring.map((w,i)=>(
                <div key={i} style={checkRow}><span style={{ color:T.info }}>▪</span>{w}</div>
              ))}
            </div>
          )}

          <div style={{ ...card, textAlign:"center" }}>
            <div style={{ fontWeight:800, fontSize:14, color:T.text, marginBottom:14 }}>Join. Connect. Collaborate. Grow.</div>

            {!isRsvping && rsvpError && rsvpError.eventId === event.id && (
              <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"9px 12px", fontSize:12, color:T.error, marginBottom:10, textAlign:"left" }}>⚠ {rsvpError.message}</div>
            )}

            {isAdmin ? (
              <div style={{ padding:"11px 14px", background:T.orangeMd, border:`1px solid ${T.orange}33`, borderRadius:10, color:T.orange, fontWeight:700, fontSize:13 }}>👤 You're the organizer</div>
            ) : isPast ? (
              <div style={{ textAlign:"center", padding:"10px", background:T.bgInput, borderRadius:10, color:T.textLow, fontSize:12, fontWeight:600 }}>Event has ended</div>
            ) : isRsvped ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <div style={{ background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:10, padding:"11px", color:T.success, fontSize:13, fontWeight:700 }}>
                  ✓ {rsvpData?.payment_status === "paid" ? "Registered & Paid" : "Registered"}
                </div>
                {event.zoom_link && <a href={event.zoom_link} target="_blank" rel="noreferrer" style={{ background:T.infoLo, border:`1px solid ${T.info}44`, borderRadius:10, padding:"11px", color:T.info, fontSize:13, fontWeight:700, textDecoration:"none" }}>🔗 Join Zoom Meeting</a>}
                <button onClick={()=>onCancelRsvp(event.id)} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel Registration</button>
              </div>
            ) : isFull ? (
              <div style={{ padding:"11px", background:T.errorLo, borderRadius:10, color:T.error, fontSize:13, fontWeight:700 }}>Event Full</div>
            ) : isPaid ? (
              <button onClick={()=>onPay(event)} style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"14px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440" }}>
                Register Now — ₹{event.registration_fee} →
              </button>
            ) : (
              <button onClick={()=>onRsvp(event.id)} disabled={isRsvping} style={{ width:"100%", background:isRsvping?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"14px", color:isRsvping?T.textMid:"#fff", fontSize:14, fontWeight:700, cursor:isRsvping?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:isRsvping?"none":"0 4px 16px #f9731440" }}>
                {isRsvping ? "Registering…" : "Register Now →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Event Card ── */
function EventCard({ event, isAdmin, attendeeCount, isRsvped, rsvpData, onRsvp, onCancelRsvp, onPay, onEdit, onDelete, onViewAttendees, onOpenDetail, rsvpingId, rsvpError }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const isPast = new Date(event.event_date) < new Date();
  const isFull = event.max_attendees && attendeeCount >= event.max_attendees;
  const isPaid = event.registration_fee > 0;
  const isRsvping = rsvpingId === event.id;

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ height:4, background: isPaid ? `linear-gradient(90deg,${T.amber},${T.orange})` : `linear-gradient(90deg,${T.success},${T.info})` }}/>
      <div style={{ padding:"18px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
          <div style={{ flex:1, cursor:"pointer" }} onClick={()=>onOpenDetail(event)}>
            <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
              <span style={{ background:isPaid?T.amberLo:T.successLo, border:`1px solid ${isPaid?T.amber:T.success}44`, color:isPaid?T.amber:T.success, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
                {isPaid ? `₹${event.registration_fee}` : "Free"}
              </span>
              <span style={{ background:T.bgInput, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, textTransform:"capitalize" }}>{event.event_type}</span>
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

        {event.description && <p onClick={()=>onOpenDetail(event)} style={{ fontSize:13, color:T.textMid, lineHeight:1.6, marginBottom:14, cursor:"pointer" }}>{event.description}</p>}

        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}><span>📅</span>{formatDate(event.event_date)} · {formatTime(event.event_date)}</div>
          {event.location && <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}><span>📍</span>{event.location}</div>}
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:T.text }}><span>👥</span>{attendeeCount} registered{event.max_attendees ? ` / ${event.max_attendees}` : ""}</div>
        </div>

        {event.max_attendees && (
          <div style={{ height:6, background:T.bgInput, borderRadius:4, overflow:"hidden", marginBottom:14 }}>
            <div style={{ height:"100%", width:`${Math.min(100,(attendeeCount/event.max_attendees)*100)}%`, background: isFull ? T.error : "linear-gradient(90deg,#f97316,#ea6008)", borderRadius:4, transition:"width .5s" }}/>
          </div>
        )}

        <button onClick={()=>onOpenDetail(event)} style={{ width:"100%", marginBottom:10, background:"transparent", border:`1px solid ${T.border}`, borderRadius:10, padding:"9px", color:T.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          View Full Details →
        </button>

        {!isRsvping && rsvpError && rsvpError.eventId === event.id && (
          <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"9px 12px", fontSize:12, color:T.error, marginBottom:10 }}>⚠ {rsvpError.message}</div>
        )}

        {isAdmin ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", background:T.orangeMd, border:`1px solid ${T.orange}33`, borderRadius:10 }}>
            <div style={{ fontSize:12, color:T.orange, fontWeight:700 }}>👤 You're the organizer</div>
            <div style={{ fontSize:13, fontWeight:800, color:T.orange }}>{attendeeCount} registered</div>
          </div>
        ) : isPast ? (
          <div style={{ textAlign:"center", padding:"10px", background:T.bgInput, borderRadius:10, color:T.textLow, fontSize:12, fontWeight:600 }}>Event has ended</div>
        ) : isRsvped ? (
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1, background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:10, padding:"11px", color:T.success, fontSize:13, fontWeight:700, textAlign:"center" }}>
              ✓ {rsvpData?.payment_status === "paid" ? "Registered & Paid" : "Registered"}
            </div>
            <button onClick={()=>onCancelRsvp(event.id)} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"11px 16px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
          </div>
        ) : isFull ? (
          <div style={{ textAlign:"center", padding:"11px", background:T.errorLo, borderRadius:10, color:T.error, fontSize:13, fontWeight:700 }}>Event Full</div>
        ) : isPaid ? (
          <button onClick={()=>onPay(event)} style={{ width:"100%", background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"12px", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440" }}>
            💳 Pay ₹{event.registration_fee} & Register
          </button>
        ) : (
          <button onClick={()=>onRsvp(event.id)} disabled={isRsvping} style={{ width:"100%", background:isRsvping?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:10, padding:"12px", color:isRsvping?T.textMid:"#fff", fontSize:14, fontWeight:700, cursor:isRsvping?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:isRsvping?"none":"0 4px 16px #f9731440" }}>
            {isRsvping ? "Registering…" : "Register"}
          </button>
        )}
        {isAdmin && attendeeCount > 0 && (
          <button onClick={()=>onViewAttendees(event)} style={{ width:"100%", marginTop:8, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px", color:T.textMid, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            👥 View {attendeeCount} Attendee{attendeeCount!==1?"s":""}
          </button>
        )}
      </div>

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
export default function EventsPage({ session, profile }) {
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
  const [rsvpError, setRsvpError] = useState(null);
  const [attendeesEvent, setAttendeesEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const fetchData = useCallback(async () => {
    const [{ data: evts }, { data: rsvpData }] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      supabase.from("event_rsvps").select("*"),
    ]);
    setEvents(evts || []);
    setRsvps(rsvpData || []);
    setLoading(false);
    // keep the open detail view's event object fresh (e.g. after RSVP/payment)
    setDetailEvent(prev => prev ? (evts || []).find(e => e.id === prev.id) || prev : prev);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRsvp = async (eventId) => {
    setRsvpError(null);
    setRsvpingId(eventId);

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

    const evt = events.find(e => e.id === eventId);
    if (evt?.zoom_link) triggerWhatsAppInvite(eventId, session.userId); // free events with an online link too
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
    if (detailEvent?.id === id) setDetailEvent(null);
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

  if (detailEvent) {
    return (
      <>
        <EventDetailPage
          event={detailEvent}
          session={session}
          isAdmin={isAdmin}
          attendeeCount={getAttendeeCount(detailEvent.id)}
          isRsvped={!!getMyRsvp(detailEvent.id)}
          rsvpData={getMyRsvp(detailEvent.id)}
          onBack={()=>setDetailEvent(null)}
          onEdit={setEditEvent}
          onPay={setPayEvent}
          onRsvp={handleRsvp}
          onCancelRsvp={handleCancelRsvp}
          rsvpingId={rsvpingId}
          rsvpError={rsvpError}
        />
        {isAdmin && editEvent && <EventModal event={editEvent} session={session} onClose={()=>setEditEvent(null)} onSaved={fetchData}/>}
        {payEvent && <PaymentModal event={payEvent} session={session} profile={profile} onClose={()=>setPayEvent(null)} onPaid={fetchData}/>}
      </>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:T.textLow, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", marginBottom:6 }}>📅 Events</div>
          <h2 style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-.03em" }}>TezConnect <span style={{ color:T.orange }}>Events</span></h2>
          {!isAdmin && <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>👁️ Browse and register — only admin can create events</div>}
        </div>
        {isAdmin && (
          <button onClick={()=>setShowCreate(true)} style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"11px 20px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440", display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:16 }}>+</span> Create Event
          </button>
        )}
      </div>

      <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
        {[["upcoming","Upcoming"],["past","Past"],["myevents","My Events"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ background:tab===id?T.orangeMd:"transparent", border:`1px solid ${tab===id?T.orange+"55":T.border}`, borderRadius:9, padding:"8px 16px", color:tab===id?T.orange:T.textMid, fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .2s" }}>{label}</button>
        ))}
      </div>

      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:T.textLow, pointerEvents:"none" }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events…" style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px 10px 36px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
      </div>

      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:12 }}>
          <div style={{ width:24, height:24, border:"2px solid #f9731633", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
          <span style={{ color:T.textMid, fontSize:13 }}>Loading events…</span>
        </div>
      )}

      {!loading && filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>📅</div>
          <div style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:8 }}>{tab==="myevents" ? "You haven't registered for any events" : "No events found"}</div>
          {isAdmin && tab!=="myevents" && (
            <button onClick={()=>setShowCreate(true)} style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"12px 28px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:10 }}>+ Create First Event</button>
          )}
        </div>
      )}

      {!loading && filtered.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              attendeeCount={getAttendeeCount(event.id)}
              isRsvped={!!getMyRsvp(event.id)}
              rsvpData={getMyRsvp(event.id)}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              onPay={setPayEvent}
              onEdit={setEditEvent}
              onDelete={handleDelete}
              onViewAttendees={setAttendeesEvent}
              onOpenDetail={setDetailEvent}
              rsvpingId={rsvpingId}
              rsvpError={rsvpError}
            />
          ))}
        </div>
      )}

      {isAdmin && showCreate && <EventModal session={session} onClose={()=>setShowCreate(false)} onSaved={fetchData}/>}
      {isAdmin && editEvent && <EventModal event={editEvent} session={session} onClose={()=>setEditEvent(null)} onSaved={fetchData}/>}
      {payEvent && <PaymentModal event={payEvent} session={session} profile={profile} onClose={()=>setPayEvent(null)} onPaid={fetchData}/>}
      {isAdmin && attendeesEvent && <AttendeesModal event={attendeesEvent} session={session} onClose={()=>setAttendeesEvent(null)}/>}
    </div>
  );
}
