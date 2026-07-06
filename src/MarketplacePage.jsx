import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
};

const CATEGORIES = [
  { id: "All", icon: "⊞", label: "All Categories" },
  { id: "Digital Product", icon: "💾", label: "Digital Product" },
  { id: "Service", icon: "🛠️", label: "Service" },
  { id: "Course", icon: "📚", label: "Course" },
  { id: "Consultation", icon: "💼", label: "Consultation" },
  { id: "Physical Product", icon: "📦", label: "Physical" },
  { id: "Software", icon: "💻", label: "Software" },
  { id: "Other", icon: "🔖", label: "Other" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
];

/* ── Buy Modal ── */
function BuyModal({ product, session, onClose, onPaid }) {
  const [step, setStep] = useState("confirm");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setStep("processing");
    setError("");
    try {
      if (!window.Razorpay) {
        setError("Payment system not loaded. Please refresh.");
        setStep("confirm"); return;
      }
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: product.price, eventId: product.id, userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.keyId) {
        setError("Order failed: " + (orderData.error || "Check Vercel env vars"));
        setStep("confirm"); return;
      }
      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency || "INR",
        name: "TezConnect Marketplace", description: product.title, order_id: orderData.orderId,
        prefill: { name: session.name || "", email: session.email || "" },
        theme: { color: "#f97316" },
        handler: async (response) => {
          await supabase.from("product_orders").insert({
            product_id: product.id, seller_id: product.user_id, buyer_id: session.userId,
            amount: product.price, status: "paid", payment_id: response.razorpay_payment_id,
          });
          setStep("success");
          setTimeout(() => { onPaid(); onClose(); }, 2000);
        },
        modal: { ondismiss: () => setStep("confirm") },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", r => { setError("Payment failed: " + (r.error?.description || "Try again.")); setStep("confirm"); });
      rzp.open();
      setStep("confirm");
    } catch (err) { setError("Error: " + err.message); setStep("confirm"); }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0" }} />
        <div style={{ padding: "16px 20px 32px" }}>
          {step === "success" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.success, marginBottom: 6 }}>Purchase Successful!</div>
              <div style={{ fontSize: 13, color: T.textMid }}>The seller will contact you shortly.</div>
            </div>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 16 }}>Confirm Purchase</div>
              {error && <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>⚠ {error}</div>}

              {/* Product summary */}
              <div style={{ display: "flex", gap: 12, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px", marginBottom: 20 }}>
                {product.image_url && <img src={product.image_url} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{product.category}</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: T.orange, marginTop: 6 }}>₹{product.price}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 ,marginTop: 10,
    paddingBottom: "calc(20px + env(safe-area-inset-bottom))",}}>
                <button onClick={onClose} style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px", color: T.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                <button onClick={handlePay} disabled={step === "processing"}
                  style={{ flex: 2, background: step === "processing" ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "13px", color: step === "processing" ? T.textMid : "#fff", fontSize: 14, fontWeight: 700, cursor: step === "processing" ? "wait" : "pointer", boxShadow: step === "processing" ? "none" : "0 4px 16px #f9731444" }}>
                  {step === "processing" ? "Opening Payment…" : `Buy Now — ₹${product.price}`}
                </button>
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: T.textLow }}>🔒 Secured by Razorpay · UPI · Cards · Net Banking</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Modal ── */
function ProductDetailModal({ product, session, onClose, onBuy }) {
  const isMine = product.user_id === session.userId;
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const seller = product.profiles || {};
  const sellerInitials = (seller.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000e", zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,680px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 0 }}>
          {/* Image */}
          {product.image_url && (
            <div style={{ width: "100%", height: 240, overflow: "hidden", position: "relative" }}>
              <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {discount > 0 && <div style={{ position: "absolute", top: 12, left: 12, background: T.error, color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>-{discount}%</div>}
            </div>
          )}

          <div style={{ padding: "16px 20px 20px" }}>
            <div style={{ fontSize: 11, color: T.orange, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".08em", marginBottom: 6 }}>{product.category}</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: T.text, lineHeight: 1.3, marginBottom: 12 }}>{product.title}</h2>

            {/* Price */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 26, color: T.orange }}>₹{product.price}</span>
              {product.compare_price && <span style={{ fontSize: 14, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</span>}
              {discount > 0 && <span style={{ fontSize: 12, color: T.success, fontWeight: 700 }}>Save ₹{product.compare_price - product.price}</span>}
            </div>

            {/* Seller */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px", marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                {seller.photo ? <img src={seller.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : sellerInitials}
              </div>
              <div>
                <div style={{ fontSize: 11, color: T.textLow }}>Sold by</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{seller.name || "TezConnect Member"}</div>
              </div>
              {seller.whatsapp && (
                <a href={`https://wa.me/${seller.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: "auto", background: "#25d36618", border: "1px solid #25d36633", borderRadius: 8, padding: "6px 12px", color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  💬 Chat
                </a>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>About this listing</div>
                <p style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{product.description}</p>
              </div>
            )}

            {/* Trust badges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "🔒", text: "Secure Payment" },
                { icon: "⭐", text: "Verified Seller" },
                { icon: "💬", text: "Direct Contact" },
                { icon: "✅", text: "Quality Assured" },
              ].map(b => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                  <span style={{ fontSize: 16 }}>{b.icon}</span>
                  <span style={{ fontSize: 11, color: T.textMid, fontWeight: 600 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed footer buy button */}
        {!isMine && (
          <div style={{ padding: "14px 20px", paddingBottom: "max(14px, env(safe-area-inset-bottom))", borderTop: `1px solid ${T.border}`, flexShrink: 0, background: T.bgCard }}>
            <button onClick={() => { onClose(); onBuy(product); }}
              style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "15px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px #f9731440" }}>
              🛒 Buy Now — ₹{product.price}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Product Card ── */
function ProductCard({ product, session, onView, onBuy }) {
  const [saved, setSaved] = useState(false);
  const isMine = product.user_id === session.userId;
  const seller = product.profiles || {};
  const sellerInitials = (seller.name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;

  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer", transition: "all .2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange + "55"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
      onClick={() => onView(product)}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: T.bgInput, overflow: "hidden" }}>
        {product.image_url
          ? <img src={product.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🛍️</div>
        }
        {discount > 0 && (
          <div style={{ position: "absolute", top: 8, left: 8, background: T.error, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>-{discount}%</div>
        )}
        {/* Heart/save button */}
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
          style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", background: T.bgCard + "cc", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, backdropFilter: "blur(4px)" }}>
          {saved ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700, letterSpacing: ".05em", marginBottom: 4 }}>{product.category}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, lineHeight: 1.4, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", minHeight: 34 }}>
          {product.title}
        </div>

        {/* Seller */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
            {seller.photo ? <img src={seller.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : sellerInitials}
          </div>
          <span style={{ fontSize: 10, color: T.textLow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{seller.name || "Member"}</span>
          {isMine && <span style={{ fontSize: 9, color: T.orange, background: T.orangeLo, borderRadius: 20, padding: "1px 5px", fontWeight: 700, marginLeft: 2 }}>Yours</span>}
        </div>

        {/* Price + buy */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.orange }}>₹{product.price}</div>
            {product.compare_price && <div style={{ fontSize: 10, color: T.textLow, textDecoration: "line-through" }}>₹{product.compare_price}</div>}
          </div>
          {!isMine && (
            <button
              onClick={e => { e.stopPropagation(); onBuy(product); }}
              style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px #f9731440" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function MarketplacePage({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [viewLayout, setViewLayout] = useState("grid");
  const [buyProduct, setBuyProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  useEffect(() => {
    supabase.from("user_products")
      .select("*, profiles(name, photo, whatsapp)")
      .eq("is_active", true)
      .neq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [session.userId]);

  const filtered = products
    .filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !search || p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      const matchCat = category === "All" || p.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "price_low") return a.price - b.price;
      if (sort === "price_high") return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, category, sort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg,#0d1545,#0a0f2e)", border: `1px solid #1e2d6b`, borderRadius: 20, padding: "24px 20px 20px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -20, width: 160, height: 160, borderRadius: "50%", background: T.orange + "08" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, color: T.orange, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>🛍️ Marketplace</div>
          <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, lineHeight: 1.2, marginBottom: 6 }}>
            Products & <span style={{ color: T.orange }}>Services</span>
          </h2>
          <p style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6, marginBottom: 0 }}>
            Discover great products and services from trusted TezConnect members.
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 12, right: 20, fontSize: 48, opacity: 0.15 }}>🛍️</div>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: T.textLow, pointerEvents: "none" }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products or services..."
          style={{ width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px 12px 42px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = T.orange}
          onBlur={e => e.target.style.borderColor = T.border}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMid, cursor: "pointer", fontSize: 16 }}>×</button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {/* Category button */}
        <button onClick={() => setShowSidebar(s => !s)}
          style={{ display: "flex", alignItems: "center", gap: 6, background: showSidebar ? T.orangeMd : T.bgCard, border: `1px solid ${showSidebar ? T.orange + "55" : T.border}`, borderRadius: 10, padding: "8px 14px", color: showSidebar ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          ☰ {category === "All" ? "All Categories" : category}
        </button>

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px", color: T.textMid, fontSize: 12, outline: "none", cursor: "pointer", flexShrink: 0 }}>
          {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* Grid/List toggle */}
        <div style={{ display: "flex", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
          {[{ id: "grid", icon: "⊞" }, { id: "list", icon: "☰" }].map(v => (
            <button key={v.id} onClick={() => setViewLayout(v.id)}
              style={{ width: 36, height: 36, background: viewLayout === v.id ? T.orangeMd : "none", border: "none", color: viewLayout === v.id ? T.orange : T.textMid, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Category sidebar (dropdown style) */}
      {showSidebar && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px", marginBottom: 14, animation: "fadeUp .2s ease" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setCategory(c.id); setShowSidebar(false); }}
                style={{ display: "flex", alignItems: "center", gap: 6, background: category === c.id ? T.orangeMd : T.bgInput, border: `1px solid ${category === c.id ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "6px 14px", color: category === c.id ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 14 }}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
          {category !== "All" && <span style={{ color: T.orange }}> in {category}</span>}
          {search && <span style={{ color: T.orange }}> for "{search}"</span>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 50, gap: 12 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: T.orange, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading marketplace…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.text, marginBottom: 8 }}>No products found</div>
          <div style={{ fontSize: 13, color: T.textLow, marginBottom: 20 }}>Try a different search or category</div>
          <button onClick={() => { setSearch(""); setCategory("All"); }}
            style={{ background: "none", border: "none", color: T.orange, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Clear filters</button>
        </div>
      )}

      {/* Product grid */}
      {!loading && paged.length > 0 && viewLayout === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
          {paged.map(p => (
            <ProductCard key={p.id} product={p} session={session} onView={setViewProduct} onBuy={setBuyProduct} />
          ))}
        </div>
      )}

      {/* List layout */}
      {!loading && paged.length > 0 && viewLayout === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {paged.map(p => {
            const seller = p.profiles || {};
            const isMine = p.user_id === session.userId;
            return (
              <div key={p.id} onClick={() => setViewProduct(p)}
                style={{ display: "flex", gap: 12, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 14, padding: "12px", cursor: "pointer" }}>
                <div style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", background: T.bgInput, flexShrink: 0 }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🛍️</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: T.textLow, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>{p.category}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>by {seller.name || "Member"}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: T.orange }}>₹{p.price}</span>
                    {!isMine && (
                      <button onClick={e => { e.stopPropagation(); setBuyProduct(p); }}
                        style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ width: 36, height: 36, borderRadius: "50%", background: page === 1 ? T.bgInput : T.bgCard, border: `1px solid ${T.border}`, color: page === 1 ? T.textLow : T.text, cursor: page === 1 ? "default" : "pointer", fontSize: 16 }}>‹</button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + 1;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 36, height: 36, borderRadius: "50%", background: page === p ? T.orange : T.bgCard, border: `1px solid ${page === p ? T.orange : T.border}`, color: page === p ? "#fff" : T.textMid, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 800 : 500 }}>
                {p}
              </button>
            );
          })}

          {totalPages > 5 && <span style={{ color: T.textLow }}>…</span>}

          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ width: 36, height: 36, borderRadius: "50%", background: page === totalPages ? T.bgInput : T.bgCard, border: `1px solid ${T.border}`, color: page === totalPages ? T.textLow : T.text, cursor: page === totalPages ? "default" : "pointer", fontSize: 16 }}>›</button>
        </div>
      )}

      {/* Trusted quality banner */}
      {!loading && products.length > 0 && (
        <div style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.orange }}>Trusted Quality</div>
            <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>All listings are from verified TezConnect members</div>
          </div>
        </div>
      )}

      {/* Modals */}
      {viewProduct && (
        <ProductDetailModal product={viewProduct} session={session} onClose={() => setViewProduct(null)} onBuy={p => { setViewProduct(null); setBuyProduct(p); }} />
      )}
      {buyProduct && (
        <BuyModal product={buyProduct} session={session} onClose={() => setBuyProduct(null)} onPaid={() => {}} />
      )}
    </div>
  );
}
