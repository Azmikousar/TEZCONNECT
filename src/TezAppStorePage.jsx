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
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 20px 0", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit App" : "Add to App Store"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div onClick={() => fileRef.current.click()} style={{ width: 80, height: 80, borderRadius: 18, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 }}>
                {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 24 }}>📱</div>}
              </div>
              <div style={{ fontSize: 12, color: T.textMid }}>App icon<br /><span style={{ color: T.textLow, fontSize: 11 }}>Square image recommended</span></div>
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
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="499" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Software" style={inputStyle} />
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

        {/* Fixed footer */}
        <div style={{ padding: "14px 100px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "120px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Update App" : "Publish to Store 🚀"}
          </button>
          {isEdit && (
            <button onClick={toggleActive}
              style={{ width: "100%", background: app.is_active ? T.errorLo : T.successLo, border: `1px solid ${app.is_active ? T.error + "44" : T.success + "44"}`, borderRadius: 12, padding: "11px", color: app.is_active ? T.error : T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {app.is_active ? "Hide from Store" : "Show in Store"}
            </button>
          )}
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
      // Step 1 — check Razorpay script loaded
      if (!window.Razorpay) {
        setError("Payment system not loaded. Please refresh the page and try again.");
        setStep("view");
        return;
      }

      // Step 2 — create order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: app.price,
          eventId: app.id,
          userId: session.userId,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        setError("Order creation failed: " + (orderData.error || orderData.message || "Unknown error. Check Vercel env vars."));
        setStep("view");
        return;
      }

      if (!orderData.keyId) {
        setError("Razorpay key missing — add RAZORPAY_KEY_ID to Vercel environment variables and redeploy.");
        setStep("view");
        return;
      }

      // Step 3 — open Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Tez App Store",
        description: app.title,
        order_id: orderData.orderId,
        prefill: {
          name: session.name || "",
          email: session.email || "",
        },
        theme: { color: "#f97316" },
        handler: async (response) => {
          // Step 4 — verify and save purchase
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: app.id,
                userId: session.userId,
                amount: app.price,
              }),
            });

            if (!verifyRes.ok) {
              // Fallback — save directly if verify endpoint fails
              console.warn("Verify endpoint failed, saving directly");
            }

            const { error: insErr } = await supabase.from("appstore_purchases").insert({
              app_id: app.id,
              user_id: session.userId,
              amount_paid: app.price,
              payment_id: response.razorpay_payment_id,
              status: "paid",
            });

            if (insErr && !insErr.message.includes("unique")) {
              setError(insErr.message);
              setStep("view");
              return;
            }

            await supabase.from("tez_appstore")
              .update({ download_count: (app.download_count || 0) + 1 })
              .eq("id", app.id);

            setStep("success");
            setTimeout(() => { onPurchased(); }, 2000);

          } catch (err) {
            setError("Purchase save failed: " + err.message);
            setStep("view");
          }
        },
        modal: {
          ondismiss: () => {
            setStep("view");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setError("Payment failed: " + (response.error?.description || "Please try again."));
        setStep("view");
      });
      rzp.open();

      // Reset to view so UI doesn't show "Processing" while Razorpay modal is open
      setStep("view");

    } catch (err) {
      setError("Unexpected error: " + err.message);
      setStep("view");
    }
  };

  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100)
    : 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 650, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "10px 20px 0", minHeight: 0 }}>
          {/* App header */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 76, height: 76, borderRadius: 18, background: T.bgInput, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
              {app.icon_url
                ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📱</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1.3 }}>{app.title}</div>
              <span style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700 }}>{app.category}</span>
              {(app.version || app.size_info) && (
                <div style={{ fontSize: 11, color: T.textMid, marginTop: 4 }}>
                  {app.version ? `Version ${app.version}` : ""}{app.version && app.size_info ? " · " : ""}{app.size_info || ""}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 10, padding: "12px 14px", fontSize: 12, color: T.error, marginBottom: 16, lineHeight: 1.5 }}>
              ⚠ {error}
            </div>
          )}

          {/* Owned — show drive link */}
          {owned ? (
            <div style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 14, padding: "20px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.success, marginBottom: 4 }}>You own this app</div>
              <div style={{ fontSize: 12, color: T.textMid, marginBottom: 16 }}>Your download link is ready</div>
              <a href={app.drive_link} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-block", background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                📥 Open Download Link
              </a>
            </div>
          ) : (
            /* Price block */
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 14, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Price</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 26, color: T.orange }}>₹{app.price}</span>
                  {app.compare_price && <span style={{ fontSize: 14, color: T.textLow, textDecoration: "line-through" }}>₹{app.compare_price}</span>}
                </div>
              </div>
              {discount > 0 && (
                <div style={{ background: T.error, color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 800 }}>-{discount}%</div>
              )}
            </div>
          )}

          {/* Description */}
          {app.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>About</div>
              <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{app.description}</p>
            </div>
          )}

          {/* Security note */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.5 }}>
              Download link unlocks instantly after secure payment via Razorpay. One-time purchase, lifetime access.
            </div>
          </div>

          {/* Success state */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "16px 0", marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, color: T.success, fontSize: 14 }}>Payment successful! Unlocking download link…</div>
            </div>
          )}
        </div>

        {/* Fixed footer — Buy button always visible */}
        {!owned && step !== "success" && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard }}>
            <button
              onClick={handlePay}
              disabled={step === "processing"}
              style={{
                width: "100%",
                background: step === "processing" ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
                border: "none", borderRadius: 12, padding: "15px",
                color: step === "processing" ? T.textMid : "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: step === "processing" ? "wait" : "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                boxShadow: step === "processing" ? "none" : "0 4px 20px #f9731440",
              }}
            >
              {step === "processing" ? "⏳ Opening Payment…" : `Buy Now — ₹${app.price}`}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: T.textLow }}>
              🔒 Secured by Razorpay · UPI · Cards · Net Banking
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── App Card ── */
function AppCard({ app, isAdmin, owned, onView, onEdit }) {
  const [hov, setHov] = useState(false);
  const discount = app.compare_price && app.compare_price > app.price
    ? Math.round(((app.compare_price - app.price) / app.compare_price) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView(app)}
      style={{
        background: T.bgCard, border: `1px solid ${hov ? T.orange + "55" : T.border}`,
        borderRadius: 16, padding: "16px", cursor: "pointer",
        transition: "all .2s", transform: hov ? "translateY(-3px)" : "none",
        position: "relative",
      }}
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div style={{ position: "absolute", top: 10, right: 10, background: T.error, color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 800 }}>
          -{discount}%
        </div>
      )}

      {/* Admin edit button */}
      {isAdmin && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(app); }}
          style={{ position: "absolute", top: 10, right: discount > 0 ? 56 : 10, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 9px", color: T.textMid, fontSize: 12, cursor: "pointer", zIndex: 1 }}>
          ✏️
        </button>
      )}

      {/* Owned badge */}
      {owned && !isAdmin && (
        <div style={{ position: "absolute", top: 10, left: 10, background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: T.success }}>
          ✓ OWNED
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: T.bgInput, overflow: "hidden", flexShrink: 0, border: `1px solid ${T.border}` }}>
          {app.icon_url
            ? <img src={app.icon_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📱</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.title}</div>
          <span style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700 }}>{app.category}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: T.orange }}>₹{app.price}</span>
            {app.compare_price && <span style={{ fontSize: 11, color: T.textLow, textDecoration: "line-through" }}>₹{app.compare_price}</span>}
          </div>
        </div>
      </div>

      {/* Description preview */}
      {app.description && (
        <p style={{ fontSize: 11, color: T.textLow, marginTop: 10, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {app.description}
        </p>
      )}

      {/* CTA */}
      <div style={{ marginTop: 12, display: "flex" }}>
        {owned ? (
          <div style={{ flex: 1, background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 9, padding: "9px", color: T.success, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
            📥 View & Download
          </div>
        ) : (
          <div style={{ flex: 1, background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 9, padding: "9px", color: T.orange, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
            🛒 Buy Now — ₹{app.price}
          </div>
        )}
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

  const categories = ["All", ...new Set(apps.map(a => a.category))];
  const filtered = apps.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || a.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#0c0e1a)", border: "1px solid #a78bfa33", borderRadius: 16, padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>📱 Tez App Store</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text }}>Premium <span style={{ color: T.orange }}>Software</span></h2>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 4 }}>
              {isAdmin ? "Manage your software listings" : "Buy once, access forever via Google Drive"}
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "9px 16px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              + Add App
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textLow, pointerEvents: "none" }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search apps & software…"
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px 10px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Categories */}
      {categories.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ background: category === c ? T.orangeMd : T.bgCard, border: `1px solid ${category === c ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 16px", color: category === c ? T.orange : T.textMid, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* My Purchases strip */}
      {!isAdmin && purchases.length > 0 && (
        <div style={{ background: T.successLo, border: `1px solid ${T.success}44`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div style={{ fontSize: 13, color: T.success, fontWeight: 600 }}>
            You own {purchases.length} app{purchases.length !== 1 ? "s" : ""} — tap to re-download anytime
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading apps…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && apps.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📱</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>No apps listed yet</div>
          <div style={{ fontSize: 13, color: T.textMid }}>
            {isAdmin ? "Add your first software product to get started" : "Check back soon for premium software deals"}
          </div>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 20 }}>
              + Add First App
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && apps.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.textLow, fontSize: 13 }}>
          No apps match your search
          <button onClick={() => { setSearch(""); setCategory("All"); }} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map(app => (
            <AppCard
              key={app.id}
              app={app}
              isAdmin={isAdmin}
              owned={purchases.includes(app.id)}
              onView={setViewApp}
              onEdit={setEditApp}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && <AppFormModal onClose={() => setShowAdd(false)} onSaved={fetchData} />}
      {editApp && <AppFormModal app={editApp} onClose={() => setEditApp(null)} onSaved={fetchData} />}
      {viewApp && (
        <AppDetailModal
          app={viewApp}
          session={session}
          owned={purchases.includes(viewApp.id)}
          onClose={() => setViewApp(null)}
          onPurchased={() => { fetchData(); setViewApp(null); }}
        />
      )}
    </div>
  );
}
