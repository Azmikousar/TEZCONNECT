import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58", success: "#22c55e", successLo: "#22c55e12",
};

function BuyModal({ product, session, onClose, onPaid }) {
  const [step, setStep] = useState("confirm");
  const [error, setError] = useState("");

  const handlePay = async () => {
    setStep("processing");
    try {
      const orderRes = await fetch("/api/create-order", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: product.price, eventId: product.id, userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId, amount: orderData.amount, currency: orderData.currency,
        name: "TezConnect", description: product.title, order_id: orderData.orderId,
        prefill: { name: session.name, email: session.email },
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
      rzp.open();
      setStep("confirm");
    } catch (err) {
      setError(err.message);
      setStep("confirm");
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "20px", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "0 auto 20px" }} />
        {step === "confirm" && (
          <>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 16 }}>💳 Confirm Purchase</div>
            {error && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>⚠ {error}</div>}
            <div style={{ background: T.bgInput, borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: T.text }}>{product.title}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.orange, marginTop: 8 }}>₹{product.price}</div>
            </div>
            <button onClick={handlePay} style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: 14, color: "#fff", fontWeight: 700, cursor: "pointer" }}>Pay ₹{product.price}</button>
          </>
        )}
        {step === "processing" && <div style={{ textAlign: "center", padding: 30 }}>Processing…</div>}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: 30 }}>
            <div style={{ fontSize: 48 }}>✓</div>
            <div style={{ fontWeight: 700, color: T.text, marginTop: 10 }}>Purchase Successful!</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage({ session }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyProduct, setBuyProduct] = useState(null);

  useEffect(() => {
    supabase.from("user_products").select("*, profiles(name, photo)").eq("is_active", true).order("created_at", { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>🛍️ Marketplace</div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text }}>Buy from <span style={{ color: T.orange }}>Members</span></h2>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: T.textMid }}>Loading…</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {products.filter(p => p.user_id !== session.userId).map(p => (
          <div key={p.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            {p.image_url && <img src={p.image_url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />}
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{p.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea6008)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", overflow: "hidden" }}>
                  {p.profiles?.photo ? <img src={p.profiles.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : p.profiles?.name?.[0]}
                </div>
                <span style={{ fontSize: 11, color: T.textLow }}>{p.profiles?.name}</span>
              </div>
              <p style={{ fontSize: 12, color: T.textMid, marginTop: 8 }}>{p.description}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: T.orange }}>₹{p.price}</span>
                <button onClick={() => setBuyProduct(p)} style={{ background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Buy Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {buyProduct && <BuyModal product={buyProduct} session={session} onClose={() => setBuyProduct(null)} onPaid={() => {}} />}
    </div>
  );
}
