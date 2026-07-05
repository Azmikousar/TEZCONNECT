import { useState, useEffect } from "react";
import { supabase } from "./supabase";


const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120", border: "#1a1f35",
  orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112", amber: "#fbbf24", info: "#38bdf8",
};

const ADMIN_USER_ID = "3f1ec55b-a33f-462c-8d10-0197fea18e69";

const STATUS_FLOW = ["placed", "processing", "shipped", "delivered"];
const STATUS_META = {
  placed:     { label: "Order Placed",  icon: "📝", color: T.info },
  processing: { label: "Processing",    icon: "⚙️", color: T.amber },
  shipped:    { label: "Shipped",       icon: "🚚", color: T.orange },
  delivered:  { label: "Delivered",     icon: "✅", color: T.success },
  cancelled:  { label: "Cancelled",     icon: "✕",  color: T.error },
};

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(ts) {
  return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.placed;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.color + "18", border: `1px solid ${m.color}44`,
      color: m.color, borderRadius: 20, padding: "4px 10px",
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {m.icon} {m.label}
    </span>
  );
}

/* ── Status timeline (for detail modal) ── */
function StatusTimeline({ status }) {
  if (status === "cancelled") {
    return (
      <div style={{ background: T.errorLo, border: `1px solid ${T.error}33`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>✕</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.error }}>Order Cancelled</div>
          <div style={{ fontSize: 11, color: T.textMid, marginTop: 2 }}>This order was cancelled.</div>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(status || "placed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {STATUS_FLOW.map((step, i) => {
        const m = STATUS_META[step];
        const done = i <= currentIdx;
        const isLast = i === STATUS_FLOW.length - 1;
        return (
          <div key={step} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: done ? m.color + "22" : T.bgInput,
                border: `2px solid ${done ? m.color : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}>
                {done ? m.icon : ""}
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: 24, background: i < currentIdx ? m.color : T.border, margin: "2px 0" }} />
              )}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 20, paddingTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: done ? T.text : T.textLow }}>{m.label}</div>
              {done && i === currentIdx && (
                <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>Current status</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Invoice generation ── */
function generateInvoice(order) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, pageWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text("TezConnect", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Tez Prints — Official Merchandise Store", margin, y + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text("TAX INVOICE", pageWidth - margin, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Invoice #: ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, y + 16, { align: "right" });
  doc.text(`Date: ${fmtDate(order.created_at)}`, pageWidth - margin, y + 28, { align: "right" });

  y += 56;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text("BILL / SHIP TO", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(order.shipping_name || "-", margin, y); y += 14;
  doc.text(order.shipping_phone || "-", margin, y); y += 14;
  const addrLines = doc.splitTextToSize(order.shipping_address || "-", 260);
  doc.text(addrLines, margin, y);
  y += addrLines.length * 14 + 10;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFillColor(245, 246, 250);
  doc.rect(margin, y - 14, pageWidth - margin * 2, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("ITEM", margin + 8, y + 2);
  doc.text("QTY", pageWidth - margin - 180, y + 2, { align: "right" });
  doc.text("PRICE", pageWidth - margin - 100, y + 2, { align: "right" });
  doc.text("TOTAL", pageWidth - margin - 8, y + 2, { align: "right" });
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  (order.items || []).forEach(item => {
    const lineTotal = (item.price * item.qty).toFixed(2);
    doc.text(item.title, margin + 8, y, { maxWidth: pageWidth - margin * 2 - 200 });
    doc.text(String(item.qty), pageWidth - margin - 180, y, { align: "right" });
    doc.text(`Rs.${item.price}`, pageWidth - margin - 100, y, { align: "right" });
    doc.text(`Rs.${lineTotal}`, pageWidth - margin - 8, y, { align: "right" });
    y += 20;
  });

  y += 8;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Delivery", pageWidth - margin - 100, y, { align: "right" });
  doc.text("Free", pageWidth - margin - 8, y, { align: "right" });
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(249, 115, 22);
  doc.text("TOTAL", pageWidth - margin - 100, y, { align: "right" });
  doc.text(`Rs.${Number(order.total_amount).toFixed(2)}`, pageWidth - margin - 8, y, { align: "right" });

  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Payment ID: ${order.payment_id || "-"}`, margin, y);
  doc.text(`Payment Status: ${(order.status || "paid").toUpperCase()}`, margin, y + 14);

  y += 40;
  doc.setFontSize(8.5);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a computer-generated invoice and does not require a signature.", margin, y);
  doc.text("Thank you for shopping with Tez Prints — TezConnect.", margin, y + 12);

  doc.save(`TezPrints-Invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
}

/* ── Admin Fulfillment Editor ── */
function AdminFulfillmentEditor({ order, onUpdated }) {
  const [status, setStatus] = useState(order.fulfillment_status || "placed");
  const [tracking, setTracking] = useState(order.tracking_number || "");
  const [courier, setCourier] = useState(order.courier_name || "");
  const [eta, setEta] = useState(order.estimated_delivery || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: "9px 12px", color: T.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("tez_print_orders").update({
      fulfillment_status: status,
      tracking_number: tracking.trim() || null,
      courier_name: courier.trim() || null,
      estimated_delivery: eta || null,
    }).eq("id", order.id);
    setSaving(false);
    if (error) { alert("Update failed: " + error.message); return; }
    setSaved(true);
    onUpdated({ ...order, fulfillment_status: status, tracking_number: tracking, courier_name: courier, estimated_delivery: eta });
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 14, padding: "16px", marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
        🛠️ Admin — Manage Fulfillment
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 5 }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, appearance: "none" }}>
            <option value="placed">Order Placed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 5 }}>Tracking Number</label>
            <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. AWB123456789" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 5 }}>Courier</label>
            <input value={courier} onChange={e => setCourier(e.target.value)} placeholder="e.g. Delhivery" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 5 }}>Estimated Delivery</label>
          <input type="date" value={eta || ""} onChange={e => setEta(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={save} disabled={saving}
          style={{ width: "100%", background: saving ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 10, padding: "11px", color: saving ? T.textMid : "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", marginTop: 4 }}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Update Order"}
        </button>
      </div>
    </div>
  );
}

/* ── Order Detail Modal ── */
function OrderDetailModal({ order, onClose, isAdmin, onUpdated }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, height: "min(90vh,700px)", display: "flex", flexDirection: "column", animation: "slideUp .3s ease", overflow: "hidden" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "12px auto 0", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
            <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{fmtDateTime(order.created_at)}</div>
          </div>
          <button onClick={onClose} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "50%", width: 32, height: 32, color: T.textMid, fontSize: 16, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px", minHeight: 0 }}>
          {isAdmin && (
            <div style={{ background: T.bgInput, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Buyer</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{order.profiles?.name || "Unknown"}</div>
              <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{order.profiles?.email || order.profiles?.mobile || ""}</div>
            </div>
          )}

          {isAdmin ? (
            <AdminFulfillmentEditor order={order} onUpdated={onUpdated} />
          ) : order.tracking_number && (
            <div style={{ background: T.orangeLo, border: `1px solid ${T.orange}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.textLow, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Tracking Number</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{order.tracking_number}</div>
              {order.courier_name && <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>via {order.courier_name}</div>}
              {order.estimated_delivery && <div style={{ fontSize: 12, color: T.orange, marginTop: 6, fontWeight: 600 }}>Estimated delivery: {fmtDate(order.estimated_delivery)}</div>}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Order Status</div>
            <StatusTimeline status={order.fulfillment_status || "placed"} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Items ({(order.items || []).length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bgInput, borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>Qty {item.qty} × ₹{item.price}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: T.orange }}>₹{(item.price * item.qty).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Shipping Address</div>
            <div style={{ background: T.bgInput, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{order.shipping_name}</div>
              <div style={{ fontSize: 12, color: T.textMid, marginTop: 2 }}>{order.shipping_phone}</div>
              <div style={{ fontSize: 12, color: T.textMid, marginTop: 4, lineHeight: 1.5 }}>{order.shipping_address}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textLow, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Payment</div>
            <div style={{ background: T.bgInput, borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.textMid }}>Payment ID</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{order.payment_id || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: T.textMid }}>Delivery</span>
                <span style={{ fontSize: 12, color: T.success, fontWeight: 700 }}>Free</span>
              </div>
              <div style={{ height: 1, background: T.border, margin: "2px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Total Paid</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.orange }}>₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={() => generateInvoice(order)}
            style={{ width: "100%", background: "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px #f9731440", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            📄 Download Invoice (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Order Card (list item) ── */
function OrderCard({ order, onClick, isAdmin }) {
  const itemCount = (order.items || []).reduce((s, i) => s + i.qty, 0);
  const firstItem = (order.items || [])[0];
  const isNew = isAdmin && (order.fulfillment_status || "placed") === "placed";

  return (
    <div onClick={onClick} style={{ background: T.bgCard, border: `1px solid ${isNew ? T.orange + "66" : T.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "border-color .15s", position: "relative" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.orange + "55"}
      onMouseLeave={e => e.currentTarget.style.borderColor = isNew ? T.orange + "66" : T.border}
    >
      {isNew && (
        <div style={{ position: "absolute", top: -8, right: 12, background: T.orange, color: "#fff", borderRadius: 20, padding: "2px 9px", fontSize: 9, fontWeight: 800 }}>NEW</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>Order #{order.id.slice(0, 8).toUpperCase()}</div>
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 2 }}>{fmtDate(order.created_at)}{isAdmin && order.profiles?.name ? ` · ${order.profiles.name}` : ""}</div>
        </div>
        <StatusBadge status={order.fulfillment_status || "placed"} />
      </div>
      <div style={{ fontSize: 12, color: T.textMid, marginBottom: 10 }}>
        {firstItem?.title}{itemCount > 1 ? ` + ${itemCount - 1} more item${itemCount - 1 > 1 ? "s" : ""}` : ""}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: T.orange }}>₹{Number(order.total_amount).toFixed(2)}</span>
        <span style={{ fontSize: 12, color: T.orange, fontWeight: 700 }}>View Details →</span>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function OrdersPage({ session }) {
  const isAdmin = session?.userId === ADMIN_USER_ID;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    console.log("[OrdersPage debug] session.userId:", session.userId, "| isAdmin:", isAdmin, "| ADMIN_USER_ID:", ADMIN_USER_ID);

    let query = supabase.from("tez_print_orders").select("*");
    if (!isAdmin) query = query.eq("user_id", session.userId);
    const { data, error } = await query.order("created_at", { ascending: false });

    console.log("[OrdersPage debug] query result:", { data, error, count: data?.length });

    if (error) { console.error("fetchOrders failed:", error); setOrders([]); setLoading(false); return; }

    let rows = data || [];
    if (isAdmin && rows.length) {
      const ids = [...new Set(rows.map(o => o.user_id))];
      const { data: profiles, error: pErr } = await supabase.from("profiles").select("id, name, email, mobile").in("id", ids);
      if (pErr) console.error("fetchOrders profiles lookup failed:", pErr);
      const pm = {};
      (profiles || []).forEach(p => { pm[p.id] = p; });
      rows = rows.map(o => ({ ...o, profiles: pm[o.user_id] || null }));
    }
    setOrders(rows);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [session.userId, isAdmin]);

  /* ── Admin: live-refresh when a new order comes in ── */
  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel("admin_orders_watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tez_print_orders" }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleOrderUpdated = (updated) => {
    setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
    setSelected(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
  };

  const filtered = orders.filter(o => {
    if (filter === "all") return true;
    if (filter === "new") return (o.fulfillment_status || "placed") === "placed";
    if (filter === "active") return ["placed", "processing", "shipped"].includes(o.fulfillment_status || "placed");
    if (filter === "delivered") return o.fulfillment_status === "delivered";
    if (filter === "cancelled") return o.fulfillment_status === "cancelled";
    return true;
  });

  const newCount = orders.filter(o => (o.fulfillment_status || "placed") === "placed").length;

  const filters = isAdmin ? [
    { id: "all", label: "All Orders" },
    { id: "new", label: `New${newCount > 0 ? ` (${newCount})` : ""}` },
    { id: "active", label: "Active" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ] : [
    { id: "all", label: "All Orders" },
    { id: "active", label: "Active" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: T.text, margin: 0, marginBottom: 4 }}>{isAdmin ? "All Orders (Admin)" : "My Orders"}</h2>
        <div style={{ fontSize: 12, color: T.textLow }}>{isAdmin ? "Manage every Tez Prints order, update status and tracking" : "Track and manage your Tez Prints orders"}</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ flexShrink: 0, background: filter === f.id ? T.orangeMd : T.bgCard, border: `1px solid ${filter === f.id ? T.orange + "55" : T.border}`, borderRadius: 20, padding: "7px 16px", color: filter === f.id ? T.orange : T.textMid, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12 }}>
          <div style={{ width: 22, height: 22, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <span style={{ color: T.textMid, fontSize: 13 }}>Loading orders…</span>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 14 }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>
            {orders.length === 0 ? "No orders yet" : "No orders in this filter"}
          </div>
          <div style={{ fontSize: 13, color: T.textLow }}>
            {orders.length === 0 ? "Your Tez Prints orders will show up here" : "Try a different filter above"}
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} isAdmin={isAdmin} onClick={() => setSelected(order)} />
          ))}
        </div>
      )}

      {selected && <OrderDetailModal order={selected} isAdmin={isAdmin} onUpdated={handleOrderUpdated} onClose={() => setSelected(null)} />}
    </div>
  );
}
