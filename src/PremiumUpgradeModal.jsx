import { useState } from "react";
import { supabase } from "./supabase";

const T = {
  bgCard: "#0b0d17", border: "#1a1f35", orange: "#f97316",
  orangeLo: "#f9731612", text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", error: "#f87171",
};

const PREMIUM_PRICE = 4999;

export default function PremiumUpgradeModal({ session, onClose, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setProcessing(true);
    setError("");
    try {
      if (!window.Razorpay) {
        setError("Payment system not loaded. Please refresh.");
        setProcessing(false);
        return;
      }

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: PREMIUM_PRICE, eventId: "premium_upgrade", userId: session.userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.keyId) {
        setError("Order failed: " + (orderData.error || "Please try again"));
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "TezConnect Premium",
        description: "Annual Premium Membership",
        order_id: orderData.orderId,
        prefill: { name: session.name, email: session.email },
        theme: { color: "#f97316" },
        handler: async (response) => {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          const { error: upErr } = await supabase
            .from("profiles")
            .update({
              is_premium: true,
              premium_expires_at: expiresAt.toISOString(),
            })
            .eq("id", session.userId);

          await supabase.from("premium_orders").insert({
            user_id: session.userId,
            amount: PREMIUM_PRICE,
            payment_id: response.razorpay_payment_id,
            status: "paid",
          });

          setProcessing(false);
          if (upErr) {
            setError("Payment succeeded but activation failed. Contact support with payment ID: " + response.razorpay_payment_id);
            return;
          }
          onSuccess && onSuccess();
          onClose();
        },
        modal: { ondismiss: () => setProcessing(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (r) => {
        setError("Payment failed: " + (r.error?.description || "Please try again."));
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError("Error: " + err.message);
      setProcessing(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.orange}44`, borderRadius: 20, padding: "28px 24px", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👑</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: T.text, marginBottom: 8 }}>Upgrade to Premium</div>
        <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.7, marginBottom: 20 }}>
          Unlock unlimited connections and marketplace listing access for a full year.
        </div>

        {error && (
          <div style={{ background: "#f8717112", border: `1px solid ${T.error}44`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 16, textAlign: "left" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 14, padding: "16px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 28, color: T.orange }}>
            ₹{PREMIUM_PRICE.toLocaleString("en-IN")}
            <span style={{ fontSize: 13, color: T.textMid, fontWeight: 600 }}>/year</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12, textAlign: "left" }}>
            {["Unlimited connections", "List products in marketplace", "Priority visibility"].map((f) => (
              <div key={f} style={{ fontSize: 12, color: T.text, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.success }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleUpgrade}
            disabled={processing}
            style={{
              background: processing ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)",
              border: "none", borderRadius: 12, padding: "14px", color: processing ? T.textMid : "#fff",
              fontWeight: 700, fontSize: 14, cursor: processing ? "wait" : "pointer",
              boxShadow: processing ? "none" : "0 4px 20px #f9731444",
            }}
          >
            {processing ? "Processing…" : `Pay ₹${PREMIUM_PRICE.toLocaleString("en-IN")} →`}
          </button>
          <button onClick={onClose} disabled={processing} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px", color: T.textMid, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
