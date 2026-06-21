import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112", amber: "#fbbf24",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

/* ── Add/Edit App Modal (admin only) ── */
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
      version: form.version.trim(),
      size_info: form.size_info.trim(),
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

  const toggleActive = async () => {
    await supabase.from("tez_appstore").update({ is_active: !app.is_active }).eq("id", app.id);
    onSaved(); onClose();
  };

  const deleteApp = async () => {
    await supabase.from("tez_appstore").delete().eq("id", app.id);
    onSaved(); onClose();
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ padding: "16px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit App" : "Add to App Store"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Icon upload */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 80, height: 80, borderRadius: 18, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 24 }}>📱</div>}
              </div>
              <div style={{ fontSize: 12, color: T.textMid }}>App icon<br/><span style={{ color: T.textLow, fontSize: 11 }}>Square image recommended</span></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>App / Software Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. CapCut Pro" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="What does this software do…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Google Drive Link *</label>
              <input value={form.drive_link} onChange={e => set("drive_link", e.target.value)} placeholder="https://drive.google.com/file/d/..." style={inputStyle} />
              <div style={{ fontSize: 11, color: T.textLow, marginTop: 6 }}>🔒 This link only unlocks for buyers after payment</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="299" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Compare at (₹)</label>
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="499 (optional)" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Editing" style={inputStyle} />
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

            <button onClick={save} disabled={saving}
              style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {saving ? "Saving…" : isEdit ? "Update App" : "Publish to Store 🚀"}
            </button>

            {isEdit && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={toggleActive}
                  style={{ flex: 1, background: app.is_active ? T.errorLo : T.successLo, border: `1px solid ${app.is_active ? T.error + "44" : T.success + "44"}`, borderRadius: 12, padding: "12px", color: app.is_active ? T.error : T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {app.is_active ? "Hide from Store" : "Show in Store"}
                </button>
                <button onClick={deleteApp}
                  style={{ flex: 1, background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 12, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── App Detail / Purchase Modal ── */
function AppDetailModal({ app, session, owned, onClose, onPurchased }) {
  const [step, setStep] = useState("view");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setStep("processing");
    setError("");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: app.price, eventId: app.id, userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
        name: "Tez App Store", description: app.title, order_id: orderData.orderId,
        prefill: { name: session.name, email: session.email },
        theme: { color: "#f97316" },
        handler: async (response) => {
          const { error: insErr } = await supabase.from("appstore_purchases").insert({
            app_id: app.id, user_id: session.userId, amount_paid: app.price,
            payment_id: response.razorpay_payment_id, status: "paid",
          });
          if (insErr) { setError(insErr.message); setStep("view"); return; }
          await supabase.from("tez_appstore").update({ download_count: (app.download_count || 0) + 1 }).eq("id", app.id);
          setStep("success");
          setTimeout(() => { onPurchased(); }, 1500);
        },
        modal: { ondismiss: () => setStep("view") },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      setStep("view");
    } catch (err) {
      setError(err.message);
      setStep("view");
    }
  };

  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100) : 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 650, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
          <button onClick={onClose} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "10px 20px 30px" }}>
          {/* App header */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 76, height: 76, borderRadius: 18, background: T.bgInput, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
              {app.icon_url ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📱</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1.3 }}>{app.title}</div>
              <span style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", f
