import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12", error: "#f87171", errorLo: "#f8717112",
};

const CATEGORIES = ["Digital Product", "Service", "Course", "Consultation", "Physical Product", "Software", "Other"];

function ProductModal({ product, session, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: "", description: "", price: "", category: "", image_url: "",
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
      const path = `${session.userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("products").upload(path, file, { contentType: file.type });
      if (upErr) { setError(upErr.message); setSaving(false); return; }
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category: form.category,
      image_url: imageUrl,
      user_id: session.userId,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase.from("user_products").update(payload).eq("id", product.id));
    } else {
      ({ error: err } = await supabase.from("user_products").insert(payload));
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "11px 14px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", animation: "slideUp .3s ease",paddingBottom: "120px",}}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ padding: "16px 20px 120px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{isEdit ? "Edit Listing" : "Add Product/Service"}</div>
            <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>

          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Image */}
            <div onClick={() => fileRef.current.click()} style={{ width: "100%", height: 160, borderRadius: 12, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}>
              {preview ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ textAlign: "center" }}><div style={{ fontSize: 32 }}>📦</div><div style={{ fontSize: 12, color: T.textMid, marginTop: 6 }}>Add product image</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Logo Design Service" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe what you're offering..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="999" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                  <option value="">Select</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button onClick={save} disabled={saving}
              style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {saving ? "Saving…" : isEdit ? "Update Listing" : "Publish Listing 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyProductsPage({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    const { data } = await supabase.from("user_products").select("*").eq("user_id", session.userId).order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [session.userId]);

  const handleDelete = async (id) => {
    await supabase.from("user_products").delete().eq("id", id);
    fetchProducts();
  };

  const toggleActive = async (id, current) => {
    await supabase.from("user_products").update({ is_active: !current }).eq("id", id);
    fetchProducts();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>🛍️ My Listings</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text }}>Products & <span style={{ color: T.orange }}>Services</span></h2>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "11px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Add Listing
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: T.textMid }}>Loading…</div>}

      {!loading && products.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛍️</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 8 }}>No listings yet</div>
          <div style={{ fontSize: 13, color: T.textMid, marginBottom: 20 }}>Sell your products or services directly to TezConnect members</div>
          <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Create First Listing</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {products.map(p => (
          <div key={p.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", opacity: p.is_active ? 1 : 0.5 }}>
            {p.image_url && <img src={p.image_url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />}
            <div style={{ padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{p.title}</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: T.orange }}>₹{p.price}</div>
              </div>
              {p.category && <span style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, color: T.orange, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>{p.category}</span>}
              <p style={{ fontSize: 12, color: T.textMid, marginTop: 8, lineHeight: 1.5 }}>{p.description}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => setEditProduct(p)} style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px", color: T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ Edit</button>
                <button onClick={() => toggleActive(p.id, p.is_active)} style={{ flex: 1, background: p.is_active ? T.successLo : T.bgInput, border: `1px solid ${p.is_active ? T.success + "44" : T.border}`, borderRadius: 8, padding: "8px", color: p.is_active ? T.success : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{p.is_active ? "✓ Live" : "Hidden"}</button>
                <button onClick={() => handleDelete(p.id)} style={{ background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 8, padding: "8px 12px", color: T.error, fontSize: 12, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <ProductModal session={session} onClose={() => setShowAdd(false)} onSaved={fetchProducts} />}
      {editProduct && <ProductModal product={editProduct} session={session} onClose={() => setEditProduct(null)} onSaved={fetchProducts} />}
    </div>
  );
}
