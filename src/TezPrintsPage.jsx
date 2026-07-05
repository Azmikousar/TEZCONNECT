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

const CATEGORIES = [
  { id: "All",         icon: "⊞",  label: "All Products" },
  { id: "Apparel",     icon: "👕",  label: "Apparel" },
  { id: "Accessories", icon: "🎒",  label: "Accessories" },
  { id: "Stationery",  icon: "📓",  label: "Stationery" },
  { id: "Mugs",        icon: "☕",  label: "Mugs" },
  { id: "Prints",      icon: "🖼️",  label: "Prints" },
  { id: "Tech",        icon: "💻",  label: "Tech" },
  { id: "General",     icon: "📦",  label: "General" },
];

/* ── Product Form Modal (admin only) ── */
function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: "", description: "", price: "", compare_price: "",
    category: "General", stock: "100",
    ...product,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product?.image_url || null);
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
    setSaving(true);
    let imageUrl = form.image_url || "";
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("tezprints").upload(path, file, { contentType: file.type });
      if (upErr) { setError(upErr.message); setSaving(false); return; }
      const { data } = supabase.storage.from("tezprints").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
    const payload = {
      title: form.title.trim(), description: form.description.trim(),
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category: form.category || "General",
      stock: parseInt(form.stock) || 0,
      image_url: imageUrl, updated_at: new Date().toISOString(),
    };
    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("tez_prints").update(payload).eq("id", product.id));
    } else {
      ({ error: err } = await supabase.from("tez_prints").insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const toggleActive = async () => {
    await supabase.from("tez_prints").update({ is_active: !product.is_active }).eq("id", product.id);
    onSaved(); onClose();
  };

  const deleteProduct = async () => {
    await supabase.from("tez_prints").delete().eq("id", product.id);
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
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit Product" : "Add Product"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>
          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div onClick={() => fileRef.current.click()} style={{ width: "100%", height: 180, borderRadius: 12, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
              {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: "center" }}><div style={{ fontSize: 36 }}>🖨️</div><div style={{ fontSize: 12, color: T.textMid, marginTop: 6 }}>Tap to add product photo</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Product Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. TezConnect Premium T-Shirt" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Product details, material, size info…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="499" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Original Price (₹)</label>
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="699" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  {CATEGORIES.filter(c => c.id !== "All").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Stock</label>
                <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="100" style={inputStyle} />
              </div>
            </div>
            {isEdit && (
              <button onClick={deleteProduct} style={{ width: "100%", background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 12, padding: "12px", color: T.error, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🗑 Delete Product
              </button>
            )}
          </div>
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Update Product" : "List Product 🛍️"}
          </button>
          {isEdit && (
            <button onClick={toggleActive}
              style={{ width: "100%", background: product.is_active ? T.errorLo : T.successLo, border: `1px solid ${product.is_active ? T.error + "44" : T.success + "44"}`, borderRadius: 12, padding: "11px", color: product.is_active ? T.error : T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {product.is_active ? "Hide from Store" : "Show in Store"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Modal ── */
function ProductDetailModal({ product, onClose, onAddCart, isAdmin, onEdit }) {
  const [qty, setQty] = useState(1);
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.price) * 100) : 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000e", zIndex: 650, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,640px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", flexShrink: 0 }}>
          {isAdmin
            ? <button onClick={() => { onClose(); onEdit(product); }} style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 8, padding: "5px 12px", color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️ Edit</button>
            : <div />
          }
          <button onClick={onClose} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          <div style={{ width: "100%", height: 260, background: T.bgInput, overflow: "hidden", position: "relative" }}>
            {product.image_url
              ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🖨️</div>
            }
            {discount > 0 && <div style={{ position: "absolute", top: 14, left: 14, background: T.error, color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 800 }}>-{discount}% OFF</div>}
            {product.stock <= 5 && product.stock > 0 && <div style={{ position: "absolute", top: 14, right: 14, background: T.amber, color: "#000", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 800 }}>Only {product.stock} left!</div>}
          </div>

          <div style={{ padding: "20px" }}>
            <div style={{ fontSize: 11, color: T.orange, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".1em", marginBottom: 6 }}>{product.category}</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: T.text, lineHeight: 1.3, marginBottom: 12 }}>{product.title}</h2>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 28, color: T.orange }}>₹{product.price}</span>
              {product.compare_price && <span style={{ fontSize: 16, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</span>}
              {discount > 0 && <span style={{ fontSize: 13, color: T.success, fontWeight: 700 }}>Save ₹{product.compare_price - product.price}</span>}
            </div>

            {product.description && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>About this Product</div>
                <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.8 }}>{product.description}</p>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { icon: "🚚", label: "Free Delivery" },
                { icon: "↩️", label: "Easy Returns" },
                { icon: "🔒", label: "Secure Pay" },
                { icon: "✅", label: "Genuine" },
              ].map(b => (
                <div key={b.label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>{b.icon}</span>
                  <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{b.label}</span>
                </div>
              ))}
            </div>

            {!isAdmin && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: T.textMid, fontWeight: 600 }}>Quantity:</div>
                <div style={{ display: "flex", alignItems: "center", gap: 0, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: "none", border: "none", color: T.text, fontSize: 18, cursor: "pointer" }}>−</button>
                  <span style={{ minWidth: 36, textAlign: "center", fontWeight: 700, color: T.text, fontSize: 14 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={{ width: 36, height: 36, background: "none", border: "none", color: T.text, fontSize: 18, cursor: "pointer" }}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isAdmin && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard }}>
            <button
              onClick={() => { onAddCart(product, qty); onClose(); }}
              disabled={product.stock === 0}
              style={{ width: "100%", background: product.stock === 0 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "15px", color: product.stock === 0 ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: product.stock === 0 ? "not-allowed" : "pointer", boxShadow: product.stock === 0 ? "none" : "0 4px 20px #f9731440" }}>
              {product.stock === 0 ? "Out of Stock" : `🛒 Add ${qty > 1 ? qty + "x " : ""}to Cart — ₹${(product.price * qty).toFixed(0)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Cart Drawer ── */
function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onCheckout, checking }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 900, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(80vh,620px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>🛒 Cart <span style={{ fontSize: 13, color: T.textMid, fontWeight: 500 }}>({count} item{count !== 1 ? "s" : ""})</span></div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 20px", minHeight: 0 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>🛒</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>Your cart is empty</div>
              <div style={{ fontSize: 13, color: T.textLow }}>Add products to get started</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, background: T.bgInput, borderRadius: 14, padding: "12px", alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: T.bgCard }}>
                    {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🖨️</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{item.category}</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.orange, marginTop: 4 }}>₹{item.price}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    <button onClick={() => onRemove(item.id)} style={{ background: "none", border: "none", color: T.error, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                      <button onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))} style={{ width: 28, height: 28, background: "none", border: "none", color: T.text, cursor: "pointer", fontSize: 14 }}>−</button>
                      <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700, fontSize: 13, color: T.text }}>{item.qty}</span>
                      <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 28, height: 28, background: "none", border: "none", color: T.text, cursor: "pointer", fontSize: 14 }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: T.textMid }}>Subtotal</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>₹{total.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: T.textMid }}>Delivery</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.success }}>Free</span>
            </div>
            <div style={{ height: 1, background: T.border, marginBottom: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: T.orange }}>₹{total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} disabled={checking}
              style={{ width: "100%", background: checking ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "15px", color: checking ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: checking ? "wait" : "pointer", boxShadow: checking ? "none" : "0 4px 20px #f9731440" }}>
              {checking ? "Processing…" : `Proceed to Checkout →`}
            </button>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.textLow }}>
              🔒 Free delivery across India · Easy 30-day returns
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shipping Modal ── */
function ShippingModal({ onClose, onConfirm }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", pincode: "" });
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Name, phone and address are required"); return;
    }
    onConfirm(form);
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "12px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 950, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, height: "min(75vh,560px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px 20px 0", minHeight: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 6 }}>📦 Shipping Details</div>
          <div style={{ fontSize: 12, color: T.textMid, marginBottom: 20 }}>Enter your delivery address to proceed to payment</div>
          {error && <div style={{ color: T.error, fontSize: 12, marginBottom: 12, background: T.errorLo, padding: "8px 12px", borderRadius: 8 }}>⚠ {error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Full Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Arjun Mehta" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Phone Number *</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Delivery Address *</label>
              <textarea value={form.address} onChange={e => set("address", e.target.value)} placeholder="House/Flat No., Street, Area, City, State" rows={3} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>PIN Code</label>
              <input value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="500001" type="number" style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ padding: "14px 20px", flexShrink: 0, background: T.bgCard, borderTop: `1px solid ${T.border}` }}>
          <button onClick={submit} style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "15px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px #f9731440" }}>
            Continue to Payment 💳
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card (grid) ── */
function ProductCard({ product, isAdmin, onView, onEdit, onAddCart }) {
  const [hov, setHov] = useState(false);
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.bgCard, border: `1px solid ${hov ? T.orange + "55" : T.border}`, borderRadius: 16, overflow: "hidden", transition: "all .2s", transform: hov ? "translateY(-3px)" : "none", position: "relative", cursor: "pointer" }}
      onClick={() => onView(product)}
    >
      {/* Badges */}
      {discount > 0 && <div style={{ position: "absolute", top: 10, left: 10, background: T.error, color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 800, zIndex: 2 }}>-{discount}%</div>}
      {product.stock <= 5 && product.stock > 0 && <div style={{ position: "absolute", top: 10, right: isAdmin ? 44 : 10, background: T.amber, color: "#000", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontWeight: 800, zIndex: 2 }}>Low Stock</div>}

      {/* Admin edit */}
      {isAdmin && (
        <button onClick={e => { e.stopPropagation(); onEdit(product); }} style={{ position: "absolute", top: 10, right: 10, background: "#000a", border: "none", borderRadius: 8, padding: "5px 9px", color: "#fff", fontSize: 12, cursor: "pointer", zIndex: 2 }}>✏️</button>
      )}

      {/* Image */}
      <div style={{ height: 180, background: T.bgInput, overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s", transform: hov ? "scale(1.05)" : "scale(1)" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🖨️</div>
        }
      </div>

      <div style={{ padding: "14px" }}>
        <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em", marginBottom: 4 }}>{product.category}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, lineHeight: 1.4, minHeight: 36, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{product.title}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.orange }}>₹{product.price}</div>
            {product.compare_price && <div style={{ fontSize: 11, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</div>}
          </div>
          {!isAdmin && (
            <button
              onClick={e => { e.stopPropagation(); onAddCart(product, 1); }}
              disabled={product.stock === 0}
              style={{ width: 36, height: 36, borderRadius: 10, background: product.stock === 0 ? T.bgInput : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: product.stock === 0 ? "not-allowed" : "pointer", fontSize: 16, boxShadow: product.stock === 0 ? "none" : "0 2px 8px #f9731440" }}>
              {product.stock === 0 ? "✕" : "🛒"}
            </button>
          )}
        </div>

        {product.stock === 0 && <div style={{ fontSize: 10, color: T.error, fontWeight: 700, marginTop: 6 }}>Out of stock</div>}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function TezPrintsPage({ session ,onNav}) {
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showShipping, setShowShipping] = useState(false);
  const [checking, setChecking] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const fetchProducts = async () => {
    const { data } = await supabase.from("tez_prints").select("*").eq("is_active", true).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    setShowCart(true);
  };

  const updateQty = (id, qty) => setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const handleCheckout = () => { setShowCart(false); setShowShipping(true); };

  const handleShippingConfirm = async (shipping) => {
    setShowShipping(false);
    setChecking(true);
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    try {
      if (!window.Razorpay) { alert("Payment system not loaded. Please refresh."); setChecking(false); return; }
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, eventId: "tezprints", userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.keyId) { alert("Order failed: " + (orderData.error || "Check Vercel env vars")); setChecking(false); return; }

      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency || "INR",
        name: "Tez Prints", description: `${cart.length} item(s)`, order_id: orderData.orderId,
        prefill: { name: shipping.name, contact: shipping.phone, email: session.email },
        theme: { color: "#f97316" },
        handler: async (response) => {
          await supabase.from("tez_print_orders").insert({
            user_id: session.userId,
            items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
            total_amount: total, status: "paid",
            payment_id: response.razorpay_payment_id,
            shipping_name: shipping.name, shipping_phone: shipping.phone,
            shipping_address: shipping.address + (shipping.pincode ? ", " + shipping.pincode : ""),
          });
          setCart([]); setChecking(false);
          alert("🎉 Order placed! We'll deliver within 5-7 business days.");
        },
        modal: { ondismiss: () => setChecking(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", r => { alert("Payment failed: " + (r.error?.description || "Try again.")); setChecking(false); });
      rzp.open();
    } catch (err) { alert("Error: " + err.message); setChecking(false); }
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const categories = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });
  const featured = products.slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Hero Banner */}
      <div style={{ background: "linear-gradient(135deg,#0c0500,#0c0e1a,#00100a)", borderRadius: 20, padding: "28px 24px", marginBottom: 24, position: "relative", overflow: "hidden", minHeight: 180 }}>
        <div style={{ position: "absolute", top: -80, right: -60, width: 250, height: 250, borderRadius: "50%", background: T.orange + "08" }} />
        <div style={{ position: "absolute", bottom: -60, left: -40, width: 180, height: 180, borderRadius: "50%", background: T.success + "06" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, color: T.orange, fontWeight: 700, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 10 }}>🖨️ Tez Prints · Official Store</div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, lineHeight: 1.25, marginBottom: 8, letterSpacing: "-.03em" }}>
            Quality You Love,<br /><span style={{ color: T.orange }}>Style You Deserve.</span>
          </h2>
          <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20, maxWidth: 320 }}>
            Premium branded merchandise delivered to your door. Free shipping on all orders.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {isAdmin ? (
              <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                + Add Product
              </button>
            ) : (
              <>
                <button onClick={() => document.getElementById("tpgrid")?.scrollIntoView({ behavior: "smooth" })}
                  style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "10px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Shop Now →
                </button>
                <button onClick={() => setShowCart(true)} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 20px", color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  🛒 Cart {cartCount > 0 && <span style={{ background: T.orange, color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{cartCount}</span>}
                </button>
                <button onClick={() => onNav && onNav("orders")} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 20px", color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
  📦 My Orders
</button>

              </>
            )}
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
        {[
          { icon: "🔒", title: "Secure Payment", sub: "100% safe checkout" },
          { icon: "🚚", title: "Free Shipping", sub: "On all orders" },
          { icon: "↩️", title: "Easy Returns", sub: "30-day return policy" },
        ].map(item => (
          <div key={item.title} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{item.title}</div>
            <div style={{ fontSize: 10, color: T.textLow, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textLow, pointerEvents: "none" }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
      </div>

      {/* Shop by Category */}
      {!search && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>Shop by Category</div>
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: category === c.id ? T.orangeMd : T.bgCard, border: `1px solid ${category === c.id ? T.orange + "55" : T.border}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer", transition: "all .2s", minWidth: 72 }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: category === c.id ? T.orange : T.textMid, whiteSpace: "nowrap" }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading store…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Featured Products horizontal scroll — shown when no filter active */}
          {!search && category === "All" && featured.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>⭐ Featured Products</div>
                <span style={{ fontSize: 12, color: T.orange, fontWeight: 600 }}>{products.length} products</span>
              </div>
              <div style={{ display: "flex", gap: 14, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 8 }}>
                {featured.map(product => {
                  const disc = product.compare_price && product.compare_price > product.price
                    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
                  return (
                    <div key={product.id} onClick={() => setViewProduct(product)} style={{ flexShrink: 0, width: 160, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", position: "relative" }}>
                      {disc > 0 && <div style={{ position: "absolute", top: 8, left: 8, background: T.error, color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 9, fontWeight: 800, zIndex: 1 }}>-{disc}%</div>}
                      <div style={{ height: 130, background: T.bgInput, overflow: "hidden" }}>
                        {product.image_url ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🖨️</div>}
                      </div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: T.orange }}>₹{product.price}</span>
                          {product.compare_price && <span style={{ fontSize: 10, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</span>}
                        </div>
                        {!isAdmin && (
                          <button onClick={e => { e.stopPropagation(); addToCart(product, 1); }}
                            disabled={product.stock === 0}
                            style={{ width: "100%", marginTop: 8, background: product.stock === 0 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 7, padding: "7px", color: product.stock === 0 ? T.textLow : "#fff", fontSize: 11, fontWeight: 700, cursor: product.stock === 0 ? "not-allowed" : "pointer" }}>
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Promo banners */}
          {!search && category === "All" && products.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              <div style={{ background: "linear-gradient(135deg,#1a0a00,#0f0800)", border: `1px solid ${T.orange}33`, borderRadius: 14, padding: "18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: T.orange + "12" }} />
                <div style={{ fontSize: 10, color: T.orange, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Special Offer</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1.2, marginBottom: 6 }}>Up to<br /><span style={{ color: T.orange }}>30% Off</span></div>
                <div style={{ fontSize: 11, color: T.textMid, marginBottom: 12 }}>On selected items</div>
                <button onClick={() => setCategory("All")} style={{ background: T.orange, border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Shop Now</button>
              </div>
              <div style={{ background: "linear-gradient(135deg,#001a0a,#0f1120)", border: `1px solid ${T.success}33`, borderRadius: 14, padding: "18px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: T.success + "10" }} />
                <div style={{ fontSize: 10, color: T.success, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>New Arrivals</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1.2, marginBottom: 6 }}>Fresh<br /><span style={{ color: T.success }}>Picks For You</span></div>
                <div style={{ fontSize: 11, color: T.textMid, marginBottom: 12 }}>Latest products</div>
                <button onClick={() => setCategory("All")} style={{ background: T.success, border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Explore Now</button>
              </div>
            </div>
          )}

          {/* All products grid */}
          <div id="tpgrid" style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>
                {search ? `Results for "${search}"` : category !== "All" ? `${category}` : "🛍️ All Products"}
                <span style={{ fontSize: 12, color: T.textMid, fontWeight: 500, marginLeft: 8 }}>({filtered.length})</span>
              </div>
              {(search || category !== "All") && (
                <button onClick={() => { setSearch(""); setCategory("All"); }} style={{ background: "none", border: "none", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Clear ×</button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🛍️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 8 }}>
                  {products.length === 0 ? "No products yet" : "No products match your search"}
                </div>
                {products.length === 0 && isAdmin && (
                  <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>
                    + Add First Product
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} isAdmin={isAdmin} onView={setViewProduct} onEdit={setEditProduct} onAddCart={addToCart} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom trust badges */}
          {products.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "🔒", title: "Secure Checkout", sub: "Your payment is safe with us" },
                { icon: "🎧", title: "24/7 Support", sub: "We're here to help anytime" },
                { icon: "⭐", title: "Premium Quality", sub: "Best quality guaranteed" },
                { icon: "🤝", title: "Trusted by Members", sub: "Join happy customers" },
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
      {showAdd && <ProductFormModal onClose={() => setShowAdd(false)} onSaved={fetchProducts} />}
      {editProduct && <ProductFormModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={fetchProducts} />}
      {showCart && <CartDrawer cart={cart} onClose={() => setShowCart(false)} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={handleCheckout} checking={checking} />}
      {showShipping && <ShippingModal onClose={() => setShowShipping(false)} onConfirm={handleShippingConfirm} />}
      {viewProduct && <ProductDetailModal product={viewProduct} onClose={() => setViewProduct(null)} onAddCart={addToCart} isAdmin={isAdmin} onEdit={p => { setViewProduct(null); setEditProduct(p); }} />}
    </div>
  );
}
