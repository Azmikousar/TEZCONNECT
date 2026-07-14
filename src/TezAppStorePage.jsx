import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112", amber: "#fbbf24",
  purple: "#a78bfa", purpleLo: "#a78bfa12",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

const CATEGORIES = [
  { id: "All",          icon: "⊞",  label: "All" },
  { id: "Design",       icon: "🎨",  label: "Design" },
  { id: "Editing",      icon: "✂️",  label: "Editing" },
  { id: "Productivity", icon: "⚡",  label: "Productivity" },
  { id: "Finance",      icon: "💰",  label: "Finance" },
  { id: "Marketing",    icon: "📣",  label: "Marketing" },
  { id: "Education",    icon: "📚",  label: "Education" },
  { id: "Software",     icon: "💻",  label: "Software" },
  { id: "Utilities",    icon: "🔧",  label: "Utilities" },
];

/* ── App Form Modal (admin only) ── */
function AppFormModal({ app, onClose, onSaved }) {
  const isEdit = !!app?.id;
  const [form, setForm] = useState({
    title: "", description: "", price: "", compare_price: "",
    drive_link: "", category: "Software", version: "", size_info: "",
    ...app,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(app?.icon_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError("Enter a valid price"); return; }
    if (!form.drive_link.trim()) { setError("Google Drive link is required"); return; }
    if (!form.drive_link.includes("drive.google.com")) { setError("Please enter a valid Google Drive link"); return; }
    setSaving(true);

    let iconUrl = form.icon_url || "";
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("appstore").upload(path, file, { contentType: file.type });
      if (upErr) { setError(upErr.message); setSaving(false); return; }
      const { data } = supabase.storage.from("appstore").getPublicUrl(path);
      iconUrl = data.publicUrl;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      drive_link: form.drive_link.trim(),
      category: form.category || "Software",
      version: form.version?.trim() || "",
      size_info: form.size_info?.trim() || "",
      icon_url: iconUrl,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("tez_appstore").update(payload).eq("id", app.id));
    } else {
      ({ error: err } = await supabase.from("tez_appstore").insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const deleteApp = async () => {
    await supabase.from("tez_appstore").delete().eq("id", app.id);
    onSaved(); onClose();
  };

  const toggleActive = async () => {
    await supabase.from("tez_appstore").update({ is_active: !app.is_active }).eq("id", app.id);
    onSaved(); onClose();
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 99999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 20px 0", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit App" : "Add to Tez App Store"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 80, height: 80, borderRadius: 18, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 28, textAlign: "center" }}>📱<div style={{ fontSize: 9, color: T.textLow, marginTop: 4 }}>Add Icon</div></div>}
              </div>
              <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6 }}>Upload app icon<br /><span style={{ color: T.textLow, fontSize: 11 }}>Square, min 80×80px</span></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>App Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Canva Pro, CapCut Premium" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="What does this software do…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Google Drive Link *</label>
              <input value={form.drive_link} onChange={e => set("drive_link", e.target.value)} placeholder="https://drive.google.com/file/d/..." style={inputStyle} />
              <div style={{ fontSize: 11, color: T.textLow, marginTop: 4 }}>🔒 Hidden until buyer pays</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="299" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Original Price (₹)</label>
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="699" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  {CATEGORIES.filter(c => c.id !== "All").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Version</label>
                <input value={form.version} onChange={e => set("version", e.target.value)} placeholder="v2.1" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Size</label>
                <input value={form.size_info} onChange={e => set("size_info", e.target.value)} placeholder="450 MB" style={inputStyle} />
              </div>
            </div>

            {isEdit && (
              <button onClick={deleteApp} style={{ width: "100%", background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 12, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🗑 Delete App
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={save} disabled={saving} style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Update App" : "Publish to Store 🚀"}
          </button>
          {isEdit && (
            <button onClick={toggleActive} style={{ width: "100%", background: app.is_active ? T.errorLo : T.successLo, border: `1px solid ${app.is_active ? T.error + "44" : T.success + "44"}`, borderRadius: 12, padding: "11px", color: app.is_active ? T.error : T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {app.is_active ? "Hide from Store" : "Show in Store"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── App Detail / Purchase Modal ── */
function AppDetailModal({ app, session, owned, onClose, onPurchased, isAdmin, onEdit }) {
  const [step, setStep] = useState("view");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setStep("processing");
    setError("");
    try {
      if (!window.Razorpay) {
        setError("Payment system not loaded. Please refresh the page.");
        setStep("view"); return;
      }
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: app.price, eventId: app.id, userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError("Order failed: " + (orderData.error || "Check Vercel env vars."));
        setStep("view"); return;
      }
      if (!orderData.keyId) {
        setError("Razorpay key missing — add RAZORPAY_KEY_ID to Vercel and redeploy.");
        setStep("view"); return;
      }
      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency || "INR",
        name: "Tez App Store", description: app.title, order_id: orderData.orderId,
        prefill: { name: session.name || "", email: session.email || "" },
        theme: { color: "#f97316" },
        handler: async (response) => {
          try {
            const { error: insErr } = await supabase.from("appstore_purchases").insert({
              app_id: app.id, user_id: session.userId,
              amount_paid: app.price, payment_id: response.razorpay_payment_id, status: "paid",
            });
            if (insErr && !insErr.message.includes("unique")) {
              setError(insErr.message); setStep("view"); return;
            }
            await supabase.from("tez_appstore").update({ download_count: (app.download_count || 0) + 1 }).eq("id", app.id);
            setStep("success");
            setTimeout(() => { onPurchased(); }, 2000);
          } catch (err) { setError("Save failed: " + err.message); setStep("view"); }
        },
        modal: { ondismiss: () => setStep("view") },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => { setError("Payment failed: " + (r.error?.description || "Try again.")); setStep("view"); });
      rzp.open();
      setStep("view");
    } catch (err) { setError("Error: " + err.message); setStep("view"); }
  };

  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100) : 0;
  const savings = app.compare_price && app.compare_price > app.price ? (app.compare_price - app.price) : 0;

  const showFooter = !owned && !isAdmin && step !== "success";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 99999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/*
        Modal shell: fixed height, column flex.
        Header (flexShrink:0) -> Scrollable body (flex:1, min-height:0) -> Footer (flexShrink:0).
        Footer is a normal flex item, never position:fixed, so it can't float over content or
        hide behind a bottom nav bar — it always sits directly under the scroll area.
      */}
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 520, height: "min(92vh,680px)", maxHeight: "calc(100vh - env(safe-area-inset-top) - 12px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden", border: `1px solid ${T.border}` }}>

        {/* Slim sticky top bar — icon-only controls, no floating pills over content */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <button onClick={onClose} aria-label="Close" style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, color: T.text, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ width: 34, height: 4, background: T.border, borderRadius: 4 }} />
          {isAdmin ? (
            <button onClick={() => { onClose(); onEdit(app); }} aria-label="Edit" style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 34, height: 34, color: T.orange, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
          ) : (
            <div style={{ width: 34 }} />
          )}
        </div>

        {/* Scrollable body — flex:1 + minHeight:0 makes this scroll smoothly inside a
            fixed-height flex column; scrollBehavior/overscroll keeps it feeling native */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", scrollBehavior: "smooth", minHeight: 0 }}>

          {/* Banner — full-width, category-tinted, like a store product header */}
          <div style={{ position: "relative", padding: "28px 20px 20px", background: `linear-gradient(160deg, ${T.orange}14, ${T.bg} 70%)`, borderBottom: `1px solid ${T.border}` }}>
            {discount > 0 && (
              <div style={{ position: "absolute", top: 16, right: 20, background: T.error, color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, letterSpacing: ".02em" }}>-{discount}% OFF</div>
            )}
            {owned && (
              <div style={{ position: "absolute", top: 16, right: 20, background: T.successLo, border: `1px solid ${T.success}55`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: T.success }}>✓ OWNED</div>
            )}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 76, height: 76, borderRadius: 18, background: T.bgInput, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}`, boxShadow: "0 6px 20px #00000055" }}>
                {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>📱</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 19, color: T.text, lineHeight: 1.25 }}>{app.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.orange, background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase", letterSpacing: ".04em" }}>{app.category}</span>
                  {app.version && <span style={{ fontSize: 10, fontWeight: 600, color: T.textMid, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px" }}>v{app.version}</span>}
                  {app.size_info && <span style={{ fontSize: 10, fontWeight: 600, color: T.textMid, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px" }}>{app.size_info}</span>}
                </div>
                <div style={{ fontSize: 11, color: T.textLow, marginTop: 8 }}>📥 {app.download_count || 0} downloads</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "18px 20px 0" }}>
            {error && (
              <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 10, padding: "12px 14px", fontSize: 12, color: T.error, marginBottom: 16, lineHeight: 1.5 }}>⚠ {error}</div>
            )}

            {owned ? (
              <div style={{ background: "linear-gradient(135deg,#052e16,#0f1120)", border: `1px solid ${T.success}44`, borderRadius: 16, padding: "22px 18px", marginBottom: 22, textAlign: "center" }}>
                <div style={{ fontSize: 38, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.success, marginBottom: 4 }}>You own this app!</div>
                <div style={{ fontSize: 12, color: T.textMid, marginBottom: 16 }}>Tap below to access your download link</div>
                <a href={app.drive_link} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 16px #22c55e44" }}>
                  📥 Open Download Link
                </a>
              </div>
            ) : (
              /* Buy-box, Amazon-style: label / big price / MRP strike / savings line */
              <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>One-time price</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 30, color: T.text }}>₹{app.price}</span>
                  {app.compare_price && <span style={{ fontSize: 14, color: T.textLow, textDecoration: "line-through" }}>₹{app.compare_price}</span>}
                  {discount > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: T.error }}>-{discount}%</span>}
                </div>
                {savings > 0 && (
                  <div style={{ fontSize: 11, color: T.success, fontWeight: 600, marginTop: 6 }}>You save ₹{savings} on this deal</div>
                )}
              </div>
            )}

            {app.description && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>About this App</div>
                <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.8 }}>{app.description}</p>
              </div>
            )}

            {/* Trust strip — compact horizontal row with dividers, like a store's
                "secure transaction / easy returns" strip, instead of a bulky 2x2 card grid */}
            <div style={{ display: "flex", alignItems: "stretch", marginBottom: 22, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              {[
                { icon: "🔒", label: "Safe & Secure" },
                { icon: "⚡", label: "Instant Access" },
                { icon: "♾️", label: "Lifetime" },
                { icon: "🎧", label: "Support" },
              ].map((item, i) => (
                <div key={item.label} style={{ flex: 1, padding: "12px 6px", textAlign: "center", borderLeft: i > 0 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ fontSize: 16 }}>{item.icon}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: T.textMid, marginTop: 4, lineHeight: 1.3 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {step === "success" && (
              <div style={{ textAlign: "center", padding: "16px 0", marginBottom: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                <div style={{ fontWeight: 700, color: T.success, fontSize: 14 }}>Purchase successful! Unlocking…</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — normal flex item, flexShrink:0, split price+button like a checkout
            bar (Flipkart/Meesho pattern), always visible right under the scroll area */}
        {showFooter && (
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.bgCard, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: T.textLow, textTransform: "uppercase", letterSpacing: ".06em" }}>Total</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 18, color: T.text }}>₹{app.price}</span>
                  {app.compare_price && <span style={{ fontSize: 11, color: T.textLow, textDecoration: "line-through" }}>₹{app.compare_price}</span>}
                </div>
              </div>
              <button onClick={handlePay} disabled={step === "processing"}
                style={{ flex: 1, background: step === "processing" ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: step === "processing" ? T.textMid : "#fff", fontSize: 14, fontWeight: 700, cursor: step === "processing" ? "wait" : "pointer", boxShadow: step === "processing" ? "none" : "0 4px 20px #f9731440" }}>
                {step === "processing" ? "⏳ Opening Payment…" : "🛒 Buy Now"}
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 9.5, color: T.textLow }}>
              🔒 Secured by Razorpay · UPI · Cards · Net Banking · Wallets
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Featured App Card (horizontal scroll) ── */
function FeaturedCard({ app, owned, onView }) {
  const [hov, setHov] = useState(false);
  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100) : 0;

  return (
    <div
      onClick={() => onView(app)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ flexShrink: 0, width: 160, background: T.bgCard, border: `1px solid ${hov ? T.orange + "55" : T.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all .2s", transform: hov ? "translateY(-3px)" : "none", position: "relative" }}
    >
      {discount > 0 && <div style={{ position: "absolute", top: 8, right: 8, background: T.error, color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 800, zIndex: 1 }}>-{discount}%</div>}
      {owned && <div style={{ position: "absolute", top: 8, left: 8, background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 800, color: T.success, zIndex: 1 }}>✓ OWNED</div>}

      <div style={{ width: "100%", height: 120, background: T.bgInput, overflow: "hidden" }}>
        {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>📱</div>}
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.title}</div>
        <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>{app.category}</div>
        <div style={{ fontWeight: 800, fontSize: 14, color: T.orange, marginTop: 6 }}>₹{app.price}</div>
      </div>
    </div>
  );
}

/* ── List Row App Card ── */
function AppListCard({ app, owned, isAdmin, onView, onEdit }) {
  const [hov, setHov] = useState(false);
  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100) : 0;

  return (
    <div
      onClick={() => onView(app)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: T.bgCard, border: `1px solid ${hov ? T.orange + "44" : T.border}`, borderRadius: 14, padding: "14px", cursor: "pointer", transition: "all .2s", display: "flex", gap: 14, alignItems: "center" }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 14, background: T.bgInput, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
        {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📱</div>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.title}</div>
        <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{app.category}{app.version ? ` · v${app.version}` : ""}</div>
        {app.description && <div style={{ fontSize: 11, color: T.textMid, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.description}</div>}
      </div>

      <div style={{ flexShrink: 0, textAlign: "right" }}>
        {isAdmin ? (
          <button onClick={e => { e.stopPropagation(); onEdit(app); }} style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 8, padding: "6px 12px", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer", marginBottom: 4, display: "block" }}>✏️ Edit</button>
        ) : owned ? (
          <div style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 8, padding: "6px 12px", color: T.success, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✓ Owned</div>
        ) : (
          <div style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 8, padding: "6px 12px", color: T.orange, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Get</div>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, justifyContent: "flex-end" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: T.orange }}>₹{app.price}</span>
          {app.compare_price && <span style={{ fontSize: 10, color: T.textLow, textDecoration: "line-through" }}>₹{app.compare_price}</span>}
        </div>
        {discount > 0 && <div style={{ fontSize: 9, color: T.error, fontWeight: 700 }}>-{discount}% off</div>}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function TezAppStorePage({ session }) {
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const [apps, setApps] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editApp, setEditApp] = useState(null);
  const [viewApp, setViewApp] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const fetchData = async () => {
    const [{ data: appsData }, { data: purchData }] = await Promise.all([
      supabase.from("tez_appstore").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("appstore_purchases").select("app_id").eq("user_id", session.userId),
    ]);
    setApps(appsData || []);
    setPurchases((purchData || []).map(p => p.app_id));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [session.userId]);

  const featured = apps.slice(0, 6);
  const filtered = apps.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg,#1a0533,#0c0e1a,#001a33)", borderRadius: 20, padding: "28px 24px 24px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: T.purple + "15" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: T.orange + "10" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, color: T.purple, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 10 }}>📱 Tez App Store</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, lineHeight: 1.25, marginBottom: 8, letterSpacing: "-.03em" }}>
            Premium Software.<br /><span style={{ color: T.orange }}>One-Time Price.</span>
          </h2>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20, maxWidth: 300 }}>
            Buy CapCut, Canva, and other professional tools at the lowest prices. Instant Google Drive delivery.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isAdmin ? (
              <button onClick={() => setShowAdd(true)}
                style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Add App
              </button>
            ) : (
              <>
                <div style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "8px 16px", color: T.orange, fontSize: 12, fontWeight: 700 }}>
                  ⚡ Instant Download
                </div>
                <div style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 10, padding: "8px 16px", color: T.success, fontSize: 12, fontWeight: 700 }}>
                  🔒 Secure Payment
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textLow, pointerEvents: "none" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search apps & software…"
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4, marginBottom: 24 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: category === c.id ? T.orangeMd : T.bgCard, border: `1px solid ${category === c.id ? T.orange + "55" : T.border}`, borderRadius: 14, padding: "10px 14px", cursor: "pointer", transition: "all .2s", minWidth: 64 }}>
            <span style={{ fontSize: 20 }}>{c.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: category === c.id ? T.orange : T.textMid, whiteSpace: "nowrap" }}>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading apps…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* My Purchases strip */}
          {!isAdmin && purchases.length > 0 && (
            <div style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <div style={{ fontSize: 13, color: T.success, fontWeight: 600 }}>
                You own {purchases.length} app{purchases.length !== 1 ? "s" : ""} — tap to re-download anytime
              </div>
            </div>
          )}

          {/* Featured Apps — horizontal scroll (shown when no search/filter active) */}
          {!search && category === "All" && featured.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>⭐ Featured Apps</div>
                <span style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>{apps.length} total</span>
              </div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 8 }}>
                {featured.map(app => (
                  <FeaturedCard key={app.id} app={app} owned={purchases.includes(app.id)} onView={setViewApp} />
                ))}
              </div>
            </div>
          )}

          {/* All Apps / filtered list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>
                {apps.length === 0 ? "No apps listed yet" : "No apps match your search"}
              </div>
              <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20 }}>
                {apps.length === 0
                  ? isAdmin ? "Add your first software product" : "Check back soon for premium software deals"
                  : "Try a different search or category"}
              </div>
              {apps.length === 0 && isAdmin && (
                <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  + Add First App
                </button>
              )}
              {apps.length > 0 && (
                <button onClick={() => { setSearch(""); setCategory("All"); }} style={{ background: "none", border: "none", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 14 }}>
                {search ? `Results for "${search}"` : category !== "All" ? `${category} Apps` : "🎯 All Apps"}
                <span style={{ fontSize: 12, color: T.textMid, fontWeight: 500, marginLeft: 8 }}>({filtered.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(app => (
                  <AppListCard key={app.id} app={app} owned={purchases.includes(app.id)} isAdmin={isAdmin} onView={setViewApp} onEdit={setEditApp} />
                ))}
              </div>
            </div>
          )}

          {/* Trust badges — shown at bottom */}
          {!search && apps.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "🛡️", title: "Safe & Secure", sub: "All apps verified by TezConnect" },
                { icon: "⚡", title: "Instant Download", sub: "Get access immediately after payment" },
                { icon: "🔄", title: "Always Updated", sub: "Links refreshed with latest versions" },
                { icon: "🎧", title: "Dedicated Support", sub: "We're here to help anytime" },
              ].map(item => (
                <div key={item.title} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: T.textLow, marginTop: 3, lineHeight: 1.4 }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAdd && <AppFormModal onClose={() => setShowAdd(false)} onSaved={fetchData} />}
      {editApp && <AppFormModal app={editApp} onClose={() => setEditApp(null)} onSaved={fetchData} />}
      {viewApp && (
        <AppDetailModal
          app={viewApp}
          session={session}
          owned={purchases.includes(viewApp.id)}
          isAdmin={isAdmin}
          onClose={() => setViewApp(null)}
          onEdit={(app) => { setViewApp(null); setEditApp(app); }}
          onPurchased={() => { fetchData(); setViewApp(null); }}
        />
      )}
    </div>
  );
}
