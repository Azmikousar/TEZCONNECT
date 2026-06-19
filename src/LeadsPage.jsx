 import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", bgHover: "#141726",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  info: "#38bdf8", infoLo: "#38bdf812",
  amber: "#fbbf24", amberLo: "#fbbf2412",
  purple: "#a78bfa", purpleLo: "#a78bfa12",
};

/* ── CHANGE THIS to Lekhakraj's real user ID ── */
const ADMIN_USER_ID = "⁠3f1ec55b-a33f-462c-8d10-0197fea18e69";

const STATUS_CONFIG = {
  new:       { label: "New",       color: T.info,    bg: T.infoLo,    icon: "🆕" },
  contacted: { label: "Contacted", color: T.orange,  bg: T.orangeLo,  icon: "📞" },
  qualified: { label: "Qualified", color: T.amber,   bg: T.amberLo,   icon: "⭐" },
  converted: { label: "Converted", color: T.success, bg: T.successLo, icon: "✅" },
  lost:      { label: "Lost",      color: T.error,   bg: T.errorLo,   icon: "❌" },
};

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Real Estate","Manufacturing","Retail","Media","Consulting","Construction","Hospitality","Agriculture","Other"];
const SOURCES = ["WhatsApp","LinkedIn","Referral","Website","Event","Cold Call","Instagram","Email","Other"];

/* ── Live indicator ── */
function LiveBadge() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, background:T.successLo, border:`1px solid ${T.success}44`, borderRadius:20, padding:"4px 12px" }}>
      <div style={{ width:8, height:8, borderRadius:"50%", background:T.success, boxShadow:`0 0 8px ${T.success}`, animation:"pulse 1.5s ease infinite" }}/>
      <span style={{ fontSize:11, fontWeight:700, color:T.success }}>LIVE</span>
    </div>
  );
}

/* ── New lead toast notification ── */
function LeadToast({ lead, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position:"fixed", top:70, right:16, zIndex:999,
      background:T.bgCard, border:`1px solid ${T.success}55`,
      borderRadius:14, padding:"12px 16px", maxWidth:300,
      boxShadow:"0 8px 32px #00000066",
      animation:"slideR .3s ease",
      display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#22c55e,#16a34a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
        🎯
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.success, marginBottom:2 }}>NEW LEAD</div>
        <div style={{ fontSize:13, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.name}</div>
        <div style={{ fontSize:11, color:T.textLow }}>{lead.company||lead.industry||"New inquiry"}</div>
      </div>
      <button onClick={onClose} style={{ background:"none", border:"none", color:T.textLow, fontSize:16, cursor:"pointer", flexShrink:0 }}>×</button>
    </div>
  );
}

/* ── Add/Edit Lead Modal ── */
function LeadModal({ lead, session, onClose, onSaved }) {
  const isEdit = !!lead?.id;
  const [form, setForm] = useState({
    name:"", company:"", email:"", mobile:"", whatsapp:"",
    industry:"", status:"new", source:"", notes:"",
    ...lead,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async() => {
    if(!form.name.trim()){setError("Name is required");return;}
    setSaving(true);
    const payload = { ...form, user_id:session.userId, updated_at:new Date().toISOString() };
    let err;
    if(isEdit){
      ({error:err}=await supabase.from("leads").update(payload).eq("id",lead.id));
    } else {
      ({error:err}=await supabase.from("leads").insert({...payload,created_at:new Date().toISOString()}));
    }
    setSaving(false);
    if(err){setError(err.message);return;}
    onSaved();onClose();
  };

  const inputStyle = {
    width:"100%", background:T.bgInput, border:`1px solid ${T.border}`,
    borderRadius:10, padding:"11px 14px", color:T.text, fontSize:13,
    outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif",
    transition:"border-color .2s",
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#000d", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"92vh", overflowY:"auto", animation:"slideUp .3s ease" }}>
        <div style={{ padding:"12px 0 0", display:"flex", justifyContent:"center" }}>
          <div style={{ width:40, height:4, background:T.border, borderRadius:4 }}/>
        </div>
        <div style={{ padding:"16px 20px 40px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:18, color:T.text }}>{isEdit?"Edit Lead":"Add New Lead"}</div>
            <button onClick={onClose} style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:"50%", width:32, height:32, color:T.textMid, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
          </div>

          {error && <div style={{ background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px 14px", fontSize:12, color:T.error, marginBottom:14 }}>⚠ {error}</div>}

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Full Name *</label>
              <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Rajesh Kumar" style={inputStyle} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Company</label>
              <input value={form.company} onChange={e=>set("company",e.target.value)} placeholder="e.g. ABC Technologies" style={inputStyle} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Mobile</label>
                <input value={form.mobile} onChange={e=>set("mobile",e.target.value)} placeholder="+91 9876543210" type="tel" style={inputStyle} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>WhatsApp</label>
                <input value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} placeholder="+91 9876543210" type="tel" style={inputStyle} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Email</label>
              <input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="contact@company.com" type="email" style={inputStyle} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Industry</label>
                <select value={form.industry} onChange={e=>set("industry",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                  <option value="">Select</option>
                  {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Source</label>
                <select value={form.source} onChange={e=>set("source",e.target.value)} style={{ ...inputStyle, appearance:"none" }}>
                  <option value="">Select</option>
                  {SOURCES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:8 }}>Status</label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {Object.entries(STATUS_CONFIG).map(([key,cfg])=>(
                  <button key={key} onClick={()=>set("status",key)}
                    style={{ background:form.status===key?cfg.bg:"transparent", border:`1.5px solid ${form.status===key?cfg.color+"55":T.border}`, borderRadius:20, padding:"6px 14px", color:form.status===key?cfg.color:T.textMid, fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .15s" }}>
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:T.textMid, textTransform:"uppercase", letterSpacing:".08em", display:"block", marginBottom:6 }}>Notes</label>
              <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Add notes about this lead…" rows={3} style={{ ...inputStyle, resize:"vertical" }} onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}/>
            </div>

            <button onClick={save} disabled={saving}
              style={{ width:"100%", background:saving?"#1a1f35":"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"14px", color:saving?T.textMid:"#fff", fontSize:15, fontWeight:700, cursor:saving?"wait":"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:saving?"none":"0 4px 20px #f9731440" }}>
              {saving?"Saving…":isEdit?"Update Lead":"Add Lead 🎯"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Lead Card ── */
function LeadCard({ lead, onEdit, onDelete, onStatusChange, isNew, isAdmin }) {
  const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
  const [showActions, setShowActions] = useState(false);
  const [confirmDel, setConfirmDel]   = useState(false);

  const timeAgo = (ts) => {
    const d = (Date.now()-new Date(ts))/1000;
    if(d<60) return "just now";
    if(d<3600) return `${Math.floor(d/60)}m ago`;
    if(d<86400) return `${Math.floor(d/3600)}h ago`;
    return new Date(ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
  };

  return (
    <div style={{
      background:T.bgCard, border:`1px solid ${isNew?T.success+"66":T.border}`,
      borderRadius:14, overflow:"hidden", position:"relative",
      transition:"all .3s",
      animation: isNew?"fadeUp .4s ease":"none",
      boxShadow: isNew?`0 0 20px ${T.success}22`:"none",
    }}>
      {isNew && (
        <div style={{ position:"absolute", top:10, right:10, background:T.success, color:"#fff", borderRadius:20, fontSize:9, fontWeight:800, padding:"2px 8px", letterSpacing:".05em" }}>NEW</div>
      )}

      <div style={{ height:3, background:`linear-gradient(90deg,${cfg.color},${cfg.color}44)` }}/>

      <div style={{ padding:"14px 16px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${cfg.color},${cfg.color}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", flexShrink:0 }}>
              {(lead.name||"?")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{lead.name}</div>
              {lead.company && <div style={{ fontSize:12, color:T.textMid, marginTop:1 }}>{lead.company}</div>}
            </div>
          </div>
          {isAdmin && (
            <button onClick={()=>setShowActions(s=>!s)} style={{ background:"none", border:"none", color:T.textLow, fontSize:18, cursor:"pointer", padding:4, flexShrink:0 }}>⋯</button>
          )}
        </div>

        {/* Info pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
          <span style={{ background:cfg.bg, border:`1px solid ${cfg.color}33`, color:cfg.color, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
            {cfg.icon} {cfg.label}
          </span>
          {lead.industry && <span style={{ background:T.bgInput, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:600 }}>🏭 {lead.industry}</span>}
          {lead.source && <span style={{ background:T.bgInput, border:`1px solid ${T.border}`, color:T.textMid, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:600 }}>📍 {lead.source}</span>}
        </div>

        {/* Contact info */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:12 }}>
          {lead.mobile && (
            <a href={`tel:${lead.mobile}`} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textMid, textDecoration:"none" }}>
              <span>📱</span>{lead.mobile}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.textMid, textDecoration:"none" }}>
              <span>✉️</span>{lead.email}
            </a>
          )}
        </div>

        {/* Notes */}
        {lead.notes && (
          <div style={{ fontSize:12, color:T.textLow, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", marginBottom:12, lineHeight:1.5, overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", whiteSpace:"pre-line" }}>
            {lead.notes}
          </div>
        )}

        {/* Status: editable for admin, badge-only for others */}
        {isAdmin ? (
          <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
            {Object.entries(STATUS_CONFIG).map(([key,cfg2])=>(
              <button key={key} onClick={()=>onStatusChange(lead.id,key)}
                style={{ background:lead.status===key?cfg2.bg:"transparent", border:`1px solid ${lead.status===key?cfg2.color+"55":T.border}`, borderRadius:20, padding:"5px 10px", color:lead.status===key?cfg2.color:T.textLow, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .15s", flexShrink:0 }}>
                {cfg2.icon}
              </button>
            ))}
          </div>
        ) : null}

        {/* Time */}
        <div style={{ fontSize:10, color:T.textLow, marginTop:10 }}>
          Added {timeAgo(lead.created_at)}
        </div>
      </div>

      {/* Action menu — admin only */}
      {isAdmin && showActions && (
        <>
          <div onClick={()=>setShowActions(false)} style={{ position:"fixed", inset:0, zIndex:10 }}/>
          <div style={{ position:"absolute", top:40, right:16, background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, zIndex:11, minWidth:160, boxShadow:"0 8px 24px #00000066", overflow:"hidden" }}>
            {lead.whatsapp && (
              <a href={`https://wa.me/${lead.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                onClick={()=>setShowActions(false)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", color:"#25d366", fontSize:13, fontWeight:600, textDecoration:"none", borderBottom:`1px solid ${T.border}` }}>
                💬 WhatsApp
              </a>
            )}
            <button onClick={()=>{setShowActions(false);onEdit(lead);}}
              style={{ width:"100%", textAlign:"left", padding:"11px 14px", background:"none", border:"none", color:T.text, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", borderBottom:`1px solid ${T.border}` }}>
              ✏️ Edit Lead
            </button>
            <button onClick={()=>{setShowActions(false);setConfirmDel(true);}}
              style={{ width:"100%", textAlign:"left", padding:"11px 14px", background:"none", border:"none", color:T.error, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              🗑 Delete
            </button>
          </div>
        </>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <div onClick={()=>setConfirmDel(false)} style={{ position:"fixed", inset:0, background:"#000d", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:16, padding:"24px", maxWidth:300, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
            <div style={{ fontWeight:800, fontSize:16, color:T.text, marginBottom:8 }}>Delete Lead?</div>
            <div style={{ fontSize:13, color:T.textMid, marginBottom:20 }}>{lead.name} will be permanently removed.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setConfirmDel(false)} style={{ flex:1, background:"transparent", border:`1px solid ${T.border}`, borderRadius:9, padding:"10px", color:T.textMid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Cancel</button>
              <button onClick={()=>{setConfirmDel(false);onDelete(lead.id);}} style={{ flex:1, background:T.errorLo, border:`1px solid ${T.error}44`, borderRadius:9, padding:"10px", color:T.error, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main LeadsPage ── */
export default function LeadsPage({ session }) {
  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newLeadIds, setNewLeadIds] = useState(new Set());
  const [toast, setToast]         = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [editLead, setEditLead]   = useState(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy]       = useState("newest");
  const [totalToday, setTotalToday] = useState(0);
  const channelRef = useRef(null);

  const isAdmin = session.userId === ADMIN_USER_ID;

  const fetchLeads = useCallback(async() => {
    // Admin sees all their leads; non-admins see everything too (read-only view)
    const { data } = await supabase
      .from("leads").select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
    const today = new Date().toISOString().split("T")[0];
    setTotalToday((data||[]).filter(l=>l.created_at?.startsWith(today)).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();

    channelRef.current = supabase
      .channel("leads_realtime_global")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "leads",
      }, (payload) => {
        const newLead = payload.new;
        setLeads(prev => [newLead, ...prev]);
        setNewLeadIds(prev => new Set([...prev, newLead.id]));
        setToast(newLead);
        setTotalToday(c => c + 1);
        setTimeout(() => {
          setNewLeadIds(prev => {
            const next = new Set(prev);
            next.delete(newLead.id);
            return next;
          });
        }, 8000);
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "leads",
      }, (payload) => {
        setLeads(prev => prev.map(l => l.id === payload.new.id ? payload.new : l));
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "leads",
      }, (payload) => {
        setLeads(prev => prev.filter(l => l.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchLeads]);

  const handleStatusChange = async(id, status) => {
    if (!isAdmin) return;
    await supabase.from("leads").update({ status, updated_at:new Date().toISOString() }).eq("id", id);
  };

  const handleDelete = async(id) => {
    if (!isAdmin) return;
    await supabase.from("leads").delete().eq("id", id);
  };

  const filtered = leads
    .filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.name?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.mobile?.includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "name") return (a.name||"").localeCompare(b.name||"");
      return 0;
    });

  const stats = Object.keys(STATUS_CONFIG).reduce((acc,s)=>{ acc[s]=leads.filter(l=>l.status===s).length; return acc; },{});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {toast && <LeadToast lead={toast} onClose={()=>setToast(null)}/>}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <div style={{ fontSize:11, color:T.textLow, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase" }}>🎯 Lead Manager</div>
            <LiveBadge/>
          </div>
          <h2 style={{ fontWeight:800, fontSize:22, color:T.text, letterSpacing:"-.03em" }}>
            {isAdmin ? "My" : "All"} <span style={{ color:T.orange }}>Leads</span>
            <span style={{ marginLeft:10, fontSize:14, color:T.textMid, fontWeight:500 }}>({leads.length})</span>
          </h2>
          {totalToday > 0 && (
            <div style={{ fontSize:12, color:T.success, fontWeight:600, marginTop:4 }}>
              🎉 {totalToday} new lead{totalToday!==1?"s":""} today!
            </div>
          )}
          {!isAdmin && (
            <div style={{ fontSize:11, color:T.textLow, marginTop:4 }}>
              👁️ View only — only the admin can add or edit leads
            </div>
          )}
        </div>
        {isAdmin && (
          <button onClick={()=>setShowAdd(true)}
            style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"11px 20px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", boxShadow:"0 4px 16px #f9731440", display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ fontSize:16 }}>+</span> Add Lead
          </button>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
        {Object.entries(STATUS_CONFIG).map(([key,cfg])=>(
          <div key={key} onClick={()=>setStatusFilter(statusFilter===key?"all":key)}
            style={{ background:statusFilter===key?cfg.bg:T.bgCard, border:`1px solid ${statusFilter===key?cfg.color+"55":T.border}`, borderRadius:12, padding:"10px 8px", textAlign:"center", cursor:"pointer", transition:"all .2s" }}>
            <div style={{ fontWeight:800, fontSize:20, color:cfg.color }}>{stats[key]||0}</div>
            <div style={{ fontSize:9, color:T.textLow, textTransform:"uppercase", letterSpacing:".05em", marginTop:2 }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1, position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:T.textLow, pointerEvents:"none" }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search leads…"
            style={{ width:"100%", background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 14px 10px 36px", color:T.text, fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif" }}
            onFocus={e=>e.target.style.borderColor=T.orange} onBlur={e=>e.target.style.borderColor=T.border}
          />
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
          style={{ background:T.bgInput, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", color:T.textMid, fontSize:12, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:"pointer" }}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Real-time info banner */}
      <div style={{ background:"linear-gradient(135deg,#22c55e0a,#06070d)", border:`1px solid ${T.success}33`, borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:T.success, boxShadow:`0 0 8px ${T.success}`, flexShrink:0 }}/>
        <div style={{ fontSize:12, color:T.textMid }}>
          <strong style={{ color:T.success }}>Live mode active</strong> — New leads appear instantly without refreshing.
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:12 }}>
          <div style={{ width:24, height:24, border:"2px solid #f9731633", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>
          <span style={{ color:T.textMid, fontSize:13 }}>Loading leads…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && leads.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎯</div>
          <div style={{ fontWeight:800, fontSize:20, color:T.text, marginBottom:8 }}>No leads yet</div>
          <div style={{ fontSize:13, color:T.textMid, lineHeight:1.7, marginBottom:24, maxWidth:320, margin:"0 auto 24px" }}>
            {isAdmin ? "Add leads manually or share your Services page to receive inquiries automatically" : "Leads will appear here once they come in"}
          </div>
          {isAdmin && (
            <button onClick={()=>setShowAdd(true)}
              style={{ background:"linear-gradient(135deg,#f97316,#ea6008)", border:"none", borderRadius:12, padding:"12px 28px", color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              + Add First Lead
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && leads.length>0 && filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:T.textLow, fontSize:13 }}>
          No leads match your search
          <button onClick={()=>{setSearch("");setStatusFilter("all");}} style={{ display:"block", margin:"10px auto 0", background:"none", border:"none", color:T.orange, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Lead cards */}
      {!loading && filtered.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {filtered.map(lead=>(
            <LeadCard
              key={lead.id}
              lead={lead}
              onEdit={setEditLead}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              isNew={newLeadIds.has(lead.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {isAdmin && showAdd && (
        <LeadModal session={session} onClose={()=>setShowAdd(false)} onSaved={fetchLeads}/>
      )}

      {isAdmin && editLead && (
        <LeadModal lead={editLead} session={session} onClose={()=>setEditLead(null)} onSaved={fetchLeads}/>
      )}
    </div>
  );
}
