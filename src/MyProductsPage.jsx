import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e15",
  error: "#f87171", errorLo: "#f8717112",
  purple: "#a78bfa", purpleLo: "#a78bfa15",
};

const CATEGORIES = [
  "Digital Product", "Service", "Course",
  "Consultation", "Physical Product", "Software", "Other",
];

/* ── Product Form Modal ── */
function ProductModal({ product, session, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    title: "", description: "", price: "",
    compare_price: "", category: "Service", image_url: "",
    ...product,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(product?.image_url || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f));
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
      title: form.title.trim(), description: form.description.trim(),
      price: parseFloat(form.price),
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category: form.category, image_url: imageUrl,
      user_id: session.userId, updated_at: new Date().toISOString(),
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 99999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(92vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>{isEdit ? "Edit Listing" : "Add Listing"}</div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 20px 120px", minHeight: 0 }}>
          {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Image upload */}
            <div onClick={() => fileRef.current.click()} style={{ width: "100%", height: 160, borderRadius: 14, border: `2px dashed ${T.border}`, background: T.bgInput, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}>
              {preview
                ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛍️</div>
                    <div style={{ fontSize: 12, color: T.textMid }}>Tap to add product image</div>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Logo Design Service" style={inputStyle} />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Description</label>
              <textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe what you're offering…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="999" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Original Price (₹)</label>
                <input type="number" value={form.compare_price} onChange={e => set("compare_price", e.target.value)} placeholder="1499" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div
  style={{
    padding: "14px 20px calc(14px + env(safe-area-inset-bottom))",
    borderTop: `1px solid ${T.border}`,
    flexShrink: 0,
    background: T.bgCard,
    position: "sticky",
    bottom: 0,
    zIndex: 10,
  }}
>
          <button onClick={save} disabled={saving}
            style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: saving ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : isEdit ? "Update Listing" : "Publish Listing 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting] = useState(false);
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(product.id);
    setDeleting(false);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg,#0b0d17,#0d0f1e)",
      border: `1px solid ${product.is_active ? T.orange + "55" : T.border}`,
      borderRadius: 20, overflow: "hidden",
      boxShadow: product.is_active ? `0 0 24px ${T.orange}15` : "none",
      transition: "all .2s",
    }}>
      {/* Product image */}
      {product.image_url && (
        <div style={{ width: "100%", height: 180, overflow: "hidden", position: "relative" }}>
          <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {discount > 0 && (
            <div style={{ position: "absolute", top: 10, left: 10, background: T.error, color: "#fff", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
              -{discount}%
            </div>
          )}
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <div style={{
              background: product.is_active ? T.successLo : T.bgInput,
              border: `1px solid ${product.is_active ? T.success + "66" : T.border}`,
              borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 800,
              color: product.is_active ? T.success : T.textLow,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: product.is_active ? T.success : T.textLow }} />
              {product.is_active ? "Live" : "Hidden"}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {/* Title + price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text, lineHeight: 1.2, marginBottom: 4 }}>{product.title}</div>
            {/* Category badge */}
            <div style={{ display: "inline-block", background: T.orange + "18", border: `1px solid ${T.orange}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: T.orange }}>
              {product.category}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: T.orange }}>₹{product.price}</div>
            {product.compare_price && (
              <div style={{ fontSize: 11, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6, marginBottom: 14, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {product.description}
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {/* Edit */}
          <button onClick={() => onEdit(product)}
            style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "11px", color: T.text, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            ✏️ Edit Listing
          </button>

          {/* Toggle live/hidden */}
          <button onClick={() => onToggle(product.id, product.is_active)}
            style={{
              flex: 1,
              background: product.is_active
                ? `linear-gradient(135deg,${T.success}22,${T.success}11)`
                : T.bgInput,
              border: `1px solid ${product.is_active ? T.success + "66" : T.border}`,
              borderRadius: 12, padding: "11px",
              color: product.is_active ? T.success : T.textMid,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {product.is_active ? "✓ Live" : "○ Hidden"}
          </button>

          {/* Delete */}
          <button onClick={handleDelete} disabled={deleting}
            style={{ width: 44, background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 12, color: T.error, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ onAdd }) {
  return (
    <div style={{
      textAlign: "center", padding: "50px 24px",
      background: "linear-gradient(135deg,#0b0d17,#0d0f1e)",
      border: `1px dashed ${T.border}`, borderRadius: 20,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🛍️</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8 }}>No listings yet</div>
      <div style={{ fontSize: 13, color: T.textMid, marginBottom: 24, lineHeight: 1.6 }}>
        Sell your products or services directly to TezConnect members. Add your first listing to get started.
      </div>
      <button onClick={onAdd}
        style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 14, padding: "13px 32px", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 20px #f9731444" }}>
        + Create First Listing
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function MyProductsPage({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [filter, setFilter] = useState("All");

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("user_products").select("*")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [session.userId]);

  const handleDelete = async (id) => {
    await supabase.from("user_products").delete().eq("id", id);
    fetchProducts();
  };

  const handleToggle = async (id, current) => {
    await supabase.from("user_products").update({ is_active: !current }).eq("id", id);
    fetchProducts();
  };

  const liveCount = products.filter(p => p.is_active).length;
  const filters = ["All", "Live", "Hidden"];
  const filtered = products.filter(p => {
    if (filter === "Live") return p.is_active;
    if (filter === "Hidden") return !p.is_active;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          {/* Eyebrow label */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.purpleLo, border: `1px solid ${T.purple}44`, borderRadius: 20, padding: "4px 12px", marginBottom: 10 }}>
            <span style={{ fontSize: 14 }}>🛍️</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: T.purple, textTransform: "uppercase", letterSpacing: ".1em" }}>My Listings</span>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 24, color: T.text, lineHeight: 1.2, marginBottom: 4 }}>
            Products & <span style={{ color: T.orange }}>Services</span>
          </h2>
          <div style={{ fontSize: 12, color: T.textMid }}>Manage, update and grow your business</div>
        </div>

        <button onClick={() => setShowAdd(true)}
          style={{ flexShrink: 0, background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 14, padding: "12px 20px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px #f9731444", whiteSpace: "nowrap" }}>
          + Add Listing
        </button>
      </div>

      {/* Stats row */}
      {products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {[
            { label: "Total", value: products.length, color: T.orange },
            { label: "Live", value: liveCount, color: T.success },
            { label: "Hidden", value: products.length - liveCount, color: T.textMid },
          ].map(s => (
            <div key={s.label} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.textMid, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {products.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter === f ? T.orangeMd : T.bgCard, border: `1px solid ${filter === f ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 18px", color: filter === f ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 50, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: T.orange, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading listings…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && <EmptyState onAdd={() => setShowAdd(true)} />}

      {/* No results for filter */}
      {!loading && products.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMid, fontSize: 13 }}>
          No {filter.toLowerCase()} listings
        </div>
      )}

      {/* Product cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={setEditProduct}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Bottom CTA if has products */}
      {!loading && products.length > 0 && (
        <button onClick={() => setShowAdd(true)}
          style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 14, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px #f9731444" }}>
          + Add Another Listing
        </button>
      )}

      {/* Modals */}
      {showAdd && (
        <ProductModal session={session} onClose={() => setShowAdd(false)} onSaved={fetchProducts} />
      )}
      {editProduct && (
        <ProductModal product={editProduct} session={session} onClose={() => setEditProduct(null)} onSaved={fetchProducts} />
      )}
    </div>
  );
}
