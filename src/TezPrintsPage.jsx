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

/* ── Product Form Modal (admin only) ── */
function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: "", description: "", price: "", compare_price: "", category: "General", stock: "100",
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
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category: form.category || "General",
      stock: parseInt(form.stock) || 0,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
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
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ padding: "16px 20px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit Product" : "Add to Tez Prints"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div onClick={() => fileRef.current.click()} style={{ width: "100%", height: 180, borderRadius: 12, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
              {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: "center" }}><div style={{ fontSize: 36 }}>🖨️</div><div style={{ fontSize: 12, color: T.textMid, marginTop: 6 }}>Add product photo</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Product Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. TezConnect Branded Mug" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Product details…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="499" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Compare at (₹)</label>
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="699 (optional)" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Apparel, Print" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Stock</label>
                <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="100" style={inputStyle} />
              </div>
            </div>

            <button onClick={save} disabled={saving}
              style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {saving ? "Saving…" : isEdit ? "Update Product" : "List Product 🖨️"}
            </button>

            {isEdit && (
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={toggleActive}
                  style={{ flex: 1, background: product.is_active ? T.errorLo : T.successLo, border: `1px solid ${product.is_active ? T.error + "44" : T.success + "44"}`, borderRadius: 12, padding: "12px", color: product.is_active ? T.error : T.success, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {product.is_active ? "Hide from Store" : "Show in Store"}
                </button>
                <button onClick={deleteProduct}
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

/* ── Cart Drawer ── */
function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onCheckout, checking }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>🛒 Your Cart ({cart.length})</div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <div style={{ color: T.textMid, fontSize: 13 }}>Your cart is empty</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", gap: 12, background: T.bgInput, borderRadius: 12, padding: "10px" }}>
                  {item.image_url && <img src={item.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.orange, marginTop: 4 }}>₹{item.price}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                      <button onClick={() => onUpdateQty(item.id, Math.max(1, item.qty - 1))} style={{ width: 26, height: 26, borderRadius: 6, background: T.bgCard, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer" }}>−</button>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                      <button onClick={() => onUpdateQty(item.id, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: 6, background: T.bgCard, border: `1px solid ${T.border}`, color: T.text, cursor: "pointer" }}>+</button>
                      <button onClick={() => onRemove(item.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: T.error, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: T.textMid }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: T.orange }}>₹{total.toFixed(2)}</span>
            </div>
            <button onClick={onCheckout} disabled={checking}
              style={{ width: "100%", background: checking ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: checking ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: checking ? "wait" : "pointer" }}>
              {checking ? "Processing…" : `Checkout ₹${total.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shipping Modal ── */
function ShippingModal({ onClose, onConfirm }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [error, setError] = useState("");

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("All fields are required");
      return;
    }
    onConfirm(form);
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 750, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "0 auto 20px" }} />
        <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 16 }}>📦 Shipping Details</div>
        {error && <div style={{ color: T.error, fontSize: 12, marginBottom: 12 }}>⚠ {error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full Name" style={inputStyle} />
          <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone Number" type="tel" style={inputStyle} />
          <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full delivery address" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={submit} style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Modal ── */
function ProductDetailModal({ product, onClose, onAddCart }) {
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 650, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
          <button onClick={onClose} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ width: "100%", height: 300, background: T.bgInput, position: "relative" }}>
          {product.image_url ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🖨️</div>}
          {discount > 0 && <div style={{ position: "absolute", top: 14, left: 14, background: T.error, color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 800 }}>-{discount}% OFF</div>}
        </div>

        <div style={{ padding: "20px" }}>
          <span style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".06em" }}>{product.category}</span>
          <h2 style={{ fontWeight: 800, fontSize: 20, color: T.text, marginTop: 6, lineHeight: 1.3 }}>{product.title}</h2>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 28, color: T.orange }}>₹{product.price}</span>
            {product.compare_price && <span style={{ fontSize: 15, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</span>}
          </div>

          <div style={{ fontSize: 12, marginTop: 8, color: product.stock > 5 ? T.success : product.stock > 0 ? T.amber : T.error, fontWeight: 700 }}>
            {product.stock > 5 ? "✓ In Stock" : product.stock > 0 ? `Only ${product.stock} left!` : "Out of Stock"}
          </div>

          {product.description && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Description</div>
              <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{product.description}</p>
            </div>
          )}

          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", marginTop: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>🚚</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Free delivery across India</div>
              <div style={{ fontSize: 11, color: T.textLow }}>Estimated 5-7 business days</div>
            </div>
          </div>

          <button onClick={() => { onAddCart(product); onClose(); }} disabled={product.stock === 0}
            style={{ width: "100%", marginTop: 20, background: product.stock === 0 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "15px", color: product.stock === 0 ? T.textLow : "#fff", fontSize: 15, fontWeight: 700, cursor: product.stock === 0 ? "not-allowed" : "pointer" }}>
            {product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, isAdmin, onAddCart, onEdit, onView }) {
  const [hov, setHov] = useState(false);
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.bgCard, border: `1px solid ${hov ? T.orange + "55" : T.border}`, borderRadius: 16, overflow: "hidden", transition: "all .2s", transform: hov ? "translateY(-3px)" : "none", position: "relative" }}
    >
      {discount > 0 && <div style={{ position: "absolute", top: 10, left: 10, background: T.error, color: "#fff", borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 800, zIndex: 1 }}>-{discount}%</div>}
      {isAdmin && <button onClick={() => onEdit(product)} style={{ position: "absolute", top: 10, right: 10, background: "#000a", border: "none", borderRadius: 8, padding: "5px 9px", color: "#fff", fontSize: 12, cursor: "pointer", zIndex: 1 }}>✏️</button>}

      <div onClick={() => onView(product)} style={{ height: 160, background: T.bgInput, overflow: "hidden", cursor: "pointer" }}>
        {product.image_url ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🖨️</div>}
      </div>

      <div style={{ padding: "14px" }}>
        <span style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em" }}>{product.category}</span>
        <div onClick={() => onView(product)} style={{ fontWeight: 700, fontSize: 13, color: T.text, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 34, cursor: "pointer" }}>{product.title}</div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: T.orange }}>₹{product.price}</span>
          {product.compare_price && <span style={{ fontSize: 12, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</span>}
        </div>

        {product.stock <= 5 && product.stock > 0 && <div style={{ fontSize: 10, color: T.amber, fontWeight: 700, marginTop: 4 }}>Only {product.stock} left!</div>}
        {product.stock === 0 && <div style={{ fontSize: 10, color: T.error, fontWeight: 700, marginTop: 4 }}>Out of stock</div>}

        {!isAdmin && (
          <button onClick={() => onAddCart(product)} disabled={product.stock === 0}
            style={{ width: "100%", marginTop: 10, background: product.stock === 0 ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 9, padding: "9px", color: product.stock === 0 ? T.textLow : "#fff", fontSize: 12, fontWeight: 700, cursor: product.stock === 0 ? "not-allowed" : "pointer" }}>
            {product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function TezPrintsPage({ session }) {
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

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
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
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, eventId: "tezprints", userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
        name: "Tez Prints", description: `${cart.length} item(s)`, order_id: orderData.orderId,
        prefill: { name: shipping.name, contact: shipping.phone, email: session.email },
        theme: { color: "#f97316" },
        handler: async (response) => {
          await supabase.from("tez_print_orders").insert({
            user_id: session.userId,
            items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
            total_amount: total,
            status: "paid",
            payment_id: response.razorpay_payment_id,
            shipping_name: shipping.name,
            shipping_phone: shipping.phone,
            shipping_address: shipping.address,
          });
          setCart([]);
          setChecking(false);
          alert("Order placed successfully! 🎉");
        },
        modal: { ondismiss: () => setChecking(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setChecking(false);
      alert("Payment failed: " + err.message);
    }
  };

  const categories = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>🖨️ Tez Prints</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text }}>Official <span style={{ color: T.orange }}>Store</span></h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setShowAdd(true)} style={{ background: T.orangeMd, border: `1px solid ${T.orange}44`, borderRadius: 10, padding: "9px 16px", color: T.orange, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Add Product</button>
          )}
          {!isAdmin && (
            <button onClick={() => setShowCart(true)}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "9px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              🛒 Cart {cart.length > 0 && <span style={{ background: "#fff", color: T.orange, borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{cart.reduce((s, i) => s + i.qty, 0)}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textLow }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px 10px 36px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
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

      {/* Loading */}
      {loading && <div style={{ textAlign: "center", padding: 60, color: T.textMid }}>Loading…</div>}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🖨️</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>No products listed yet</div>
          {isAdmin && <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 10 }}>+ Add First Product</button>}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 14 }}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} isAdmin={isAdmin} onAddCart={addToCart} onEdit={setEditProduct} onView={setViewProduct} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd && <ProductFormModal onClose={() => setShowAdd(false)} onSaved={fetchProducts} />}
      {editProduct && <ProductFormModal product={editProduct} onClose={() => setEditProduct(null)} onSaved={fetchProducts} />}
      {showCart && <CartDrawer cart={cart} onClose={() => setShowCart(false)} onUpdateQty={updateQty} onRemove={removeItem} onCheckout={handleCheckout} checking={checking} />}
      {showShipping && <ShippingModal onClose={() => setShowShipping(false)} onConfirm={handleShippingConfirm} />}
      {viewProduct && <ProductDetailModal product={viewProduct} onClose={() => setViewProduct(null)} onAddCart={addToCart} />}
    </div>
  );
}
