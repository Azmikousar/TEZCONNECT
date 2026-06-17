import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const T = {
  bg: "#06070d", bgCard: "#0b0d17", bgInput: "#0f1120",
  border: "#1a1f35", orange: "#f97316", orangeLo: "#f9731612", orangeMd: "#f9731625",
  text: "#eef0f8", textMid: "#6b7594", textLow: "#343c58",
  success: "#22c55e", successLo: "#22c55e12",
  error: "#f87171", errorLo: "#f8717112",
  amber: "#fbbf24",
};

function WithdrawModal({ wallet, session, onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { setError("Minimum withdrawal is ₹10"); return; }
    if (amt > wallet.balance) { setError("Insufficient balance"); return; }
    if (!upiId.trim()) { setError("Enter your UPI ID"); return; }
    setLoading(true);

    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: session.userId,
      type: "withdrawal",
      amount: amt,
      description: `Withdrawal to UPI: ${upiId}`,
      status: "pending",
    });

    if (!txErr) {
      await supabase.from("wallets").update({
        balance: wallet.balance - amt,
        total_withdrawn: (wallet.total_withdrawn || 0) + amt,
        updated_at: new Date().toISOString(),
      }).eq("user_id", session.userId);
    }

    setLoading(false);
    if (txErr) { setError(txErr.message); return; }
    onSuccess();
    onClose();
  };

  const inputStyle = {
    width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
    borderRadius: 10, padding: "12px 14px", color: T.text,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000d", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 500, padding: "24px 20px 40px", animation: "slideUp .3s ease" }}>
        <div style={{ width: 40, height: 4, background: T.border, borderRadius: 4, margin: "0 auto 20px" }} />
        <div style={{ fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 4 }}>💸 Withdraw Money</div>
        <div style={{ fontSize: 12, color: T.textLow, marginBottom: 20 }}>Available: <strong style={{ color: T.success }}>₹{wallet?.balance?.toFixed(2) || "0.00"}</strong></div>

        {error && (
          <div style={{ background: T.errorLo, border: `1px solid ${T.error}44`, borderRadius: 9, padding: "10px 14px", fontSize: 12, color: T.error, marginBottom: 14 }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }} placeholder="Enter amount (min ₹10)" style={inputStyle} onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {[50, 100, 200, 500].map(a => (
                <button key={a} onClick={() => setAmount(Math.min(a, wallet?.balance || 0).toString())}
                  style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 0", color: T.textMid, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  ₹{a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: 6 }}>UPI ID</label>
            <input value={upiId} onChange={e => { setUpiId(e.target.value); setError(""); }} placeholder="yourname@upi" style={inputStyle} onFocus={e => e.target.style.borderColor = T.orange} onBlur={e => e.target.style.borderColor = T.border} />
          </div>
          <div style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: T.textLow }}>
            ℹ️ Withdrawals are processed within 24-48 hours. Minimum ₹10.
          </div>
          <button onClick={handleWithdraw} disabled={loading}
            style={{ width: "100%", background: loading ? "#1a1f35" : "linear-gradient(135deg,#f97316,#ea6008)", border: "none", borderRadius: 12, padding: "14px", color: loading ? T.textMid : "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: loading ? "none" : "0 4px 20px #f9731440" }}>
            {loading ? "Processing…" : "💸 Request Withdrawal"}
          </button>
          <button onClick={onClose} style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px", color: T.textMid, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage({ session }) {
  const [wallet, setWallet]   = useState(null);
  const [txns, setTxns]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [tab, setTab]         = useState("all");

  const loadData = async () => {
    const [{ data: wal }, { data: transactions }] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", session.userId).single(),
      supabase.from("transactions").select("*").eq("user_id", session.userId).order("created_at", { ascending: false }).limit(50),
    ]);
    setWallet(wal || { balance: 0, total_earned: 0, total_withdrawn: 0 });
    setTxns(transactions || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [session.userId]);

  const TYPE_CONFIG = {
    credit:         { icon: "💰", label: "Credit",         color: T.success },
    debit:          { icon: "💸", label: "Debit",          color: T.error },
    withdrawal:     { icon: "🏦", label: "Withdrawal",     color: T.error },
    referral_bonus: { icon: "🎁", label: "Referral Bonus", color: T.amber },
    lead_bonus:     { icon: "🎯", label: "Lead Bonus",     color: T.orange },
  };

  const filtered = tab === "all" ? txns : txns.filter(t => t.type === tab || (tab === "credit" && ["credit","referral_bonus","lead_bonus"].includes(t.type)) || (tab === "debit" && ["debit","withdrawal"].includes(t.type)));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12 }}>
      <div style={{ width: 24, height: 24, border: "2px solid #f9731633", borderTopColor: "#f97316", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Wallet card */}
      <div style={{ background: "linear-gradient(135deg,#1a0a00,#0d0600,#0c0e1a)", border: `1px solid ${T.orange}33`, borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#f9731644,transparent)" }} />
        <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: T.orange + "08" }} />
        <div style={{ fontSize: 11, color: T.textLow, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>💳 TezConnect Wallet</div>
        <div style={{ fontWeight: 800, fontSize: 42, color: T.text, letterSpacing: "-.03em", marginBottom: 4 }}>
          ₹{wallet?.balance?.toFixed(2) || "0.00"}
        </div>
        <div style={{ fontSize: 13, color: T.textMid, marginBottom: 24 }}>Available Balance</div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          {[
            { label: "Total Earned",     value: `₹${wallet?.total_earned?.toFixed(2) || "0.00"}`,     color: T.success },
            { label: "Total Withdrawn",  value: `₹${wallet?.total_withdrawn?.toFixed(2) || "0.00"}`,  color: T.error },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "#ffffff08", borderRadius: 12, padding: "12px 8px" }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.textLow, marginTop: 2, textTransform: "uppercase", letterSpacing: ".07em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowWithdraw(true)}
          disabled={(wallet?.balance || 0) < 10}
          style={{ background: (wallet?.balance || 0) >= 10 ? "linear-gradient(135deg,#f97316,#ea6008)" : "#1a1f35", border: "none", borderRadius: 12, padding: "14px 32px", color: (wallet?.balance || 0) >= 10 ? "#fff" : T.textLow, fontSize: 15, fontWeight: 700, cursor: (wallet?.balance || 0) >= 10 ? "pointer" : "not-allowed", fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: (wallet?.balance || 0) >= 10 ? "0 4px 20px #f9731440" : "none" }}
        >
          💸 Withdraw Money
        </button>
        {(wallet?.balance || 0) < 10 && (
          <div style={{ fontSize: 11, color: T.textLow, marginTop: 8 }}>Minimum ₹10 required to withdraw</div>
        )}
      </div>

      {/* Quick earn */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>⚡ Quick Earn</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "👥", label: "Refer a friend",           points: 100, action: "Refer Now" },
            { icon: "✅", label: "Complete your profile",    points: 50,  action: "Edit Profile" },
            { icon: "🤝", label: "Make 5 connections",       points: 50,  action: "Network" },
            { icon: "📸", label: "Post in the community",    points: 20,  action: "Post Now" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.label}</div>
                <div style={{ fontSize: 11, color: T.amber, fontWeight: 700 }}>+{item.points} points · ₹{(item.points * 0.1).toFixed(0)}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, background: T.orangeMd, border: `1px solid ${T.orange}33`, borderRadius: 8, padding: "4px 10px", flexShrink: 0, cursor: "pointer" }}>
                {item.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.text, marginBottom: 14 }}>🧾 Transactions</div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {[["all","All"],["credit","Credits"],["debit","Debits"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ background: tab === id ? T.orangeMd : T.bgInput, border: `1px solid ${tab === id ? T.orange+"55" : T.border}`, borderRadius: 20, padding: "6px 14px", color: tab === id ? T.orange : T.textMid, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all .2s" }}>
              {label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
            <div style={{ fontSize: 13, color: T.textLow }}>No transactions yet</div>
          </div>
        ) : (
          filtered.map(txn => {
            const cfg = TYPE_CONFIG[txn.type] || TYPE_CONFIG.credit;
            const isCredit = ["credit","referral_bonus","lead_bonus"].includes(txn.type);
            return (
              <div key={txn.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: (isCredit ? T.success : T.error) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{txn.description || cfg.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: T.textLow }}>{new Date(txn.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: txn.status === "completed" ? T.success : txn.status === "pending" ? T.amber : T.error, background: (txn.status === "completed" ? T.success : txn.status === "pending" ? T.amber : T.error) + "18", borderRadius: 20, padding: "1px 7px", textTransform: "capitalize" }}>
                      {txn.status}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isCredit ? T.success : T.error, flexShrink: 0 }}>
                  {isCredit ? "+" : "-"}₹{txn.amount?.toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal wallet={wallet} session={session} onClose={() => setShowWithdraw(false)} onSuccess={loadData} />
      )}
    </div>
  );
}
