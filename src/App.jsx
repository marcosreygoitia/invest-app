import { useState, useEffect } from "react";

const SUPABASE_URL = "https://wdazqkgmnexoqupdrqpr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYXpxa2dtbmV4b3F1cGRycXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTc3NDgsImV4cCI6MjA5MTI3Mzc0OH0.-8OGrIjFtmGmO0sQphnUZzc7nK5Mm05CCGQxwQdzig0";

const sb = {
  headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },

  async signUp(email, password, full_name) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password, data: { full_name } })
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST", headers: { ...this.headers, "Authorization": `Bearer ${token}` }
    });
  },

  authHeaders(token) {
    return { ...this.headers, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" };
  },

  async getPortfolio(token, uid) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/portfolios?id=eq.${uid}`, { headers: this.authHeaders(token) });
    const d = await r.json();
    return d[0] || null;
  },

  async createPortfolio(token, uid) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/portfolios`, {
      method: "POST", headers: this.authHeaders(token),
      body: JSON.stringify({ id: uid, invested: 0, capital: 0 })
    });
    return r.json();
  },

  async updatePortfolio(token, uid, invested, capital) {
    await fetch(`${SUPABASE_URL}/rest/v1/portfolios?id=eq.${uid}`, {
      method: "PATCH", headers: this.authHeaders(token),
      body: JSON.stringify({ invested, capital })
    });
  },

  async getTransactions(token, uid) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${uid}&order=created_at.desc`, { headers: this.authHeaders(token) });
    return r.json();
  },

  async addTransaction(token, uid, type, amount, description) {
    const date = new Date().toISOString().slice(0, 10);
    await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: "POST", headers: this.authHeaders(token),
      body: JSON.stringify({ user_id: uid, type, amount, description, date })
    });
  },

  async createProfile(token, uid, email, full_name) {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST", headers: this.authHeaders(token),
      body: JSON.stringify({ id: uid, email, full_name })
    });
  }
};

const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fetchAaveRate = async () => {
  try {
    const r = await fetch(
      "https://aave-api-v2.aave.com/data/liquidity/v2?poolId=0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"
    );
    const data = await r.json();
    const usdc = data?.find?.(d => d.symbol === "USDC");
    if (usdc?.avg1DaysLiquidityRate) {
      const apr = parseFloat(usdc.avg1DaysLiquidityRate) * 100;
      return parseFloat(apr.toFixed(2));
    }
  } catch(e) { console.error("AAVE rate error:", e); }
  return 4.85;
};

const S = {
  app: { fontFamily: "system-ui,-apple-system,sans-serif", maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#f7f8fa", display: "flex", flexDirection: "column" },
  authWrap: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 1.5rem" },
  logoIcon: { width: 56, height: 56, borderRadius: 16, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" },
  card: { background: "#fff", borderRadius: 16, padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e0e0e0", fontSize: 15, background: "#fafafa", boxSizing: "border-box", outline: "none", marginBottom: 14 },
  btn: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnDisabled: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#aaa", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "not-allowed" },
  cancelBtn: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #e0e0e0", background: "#fff", fontSize: 14, fontWeight: 500, color: "#888", cursor: "pointer", marginTop: 8 },
  err: { background: "#fff0f0", color: "#c0392b", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12 },
  info: { background: "#eef2ff", color: "#4f46e5", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12 },
  header: { background: "#1a1a2e", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: 600, margin: 0 },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "2px 0 0" },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 600 },
  dashBody: { padding: "1.25rem", flex: 1, overflowY: "auto" },
  kpiCard: { background: "#fff", borderRadius: 16, padding: "1.25rem", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  kpiLabel: { fontSize: 12, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" },
  kpiValue: { fontSize: 28, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  kpiSub: { fontSize: 13, color: "#aaa", margin: "4px 0 0" },
  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  kpiSmall: { background: "#fff", borderRadius: 16, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  kpiSmallLabel: { fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" },
  kpiSmallValue: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  actionsRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  actionBtn: { background: "#fff", borderRadius: 14, padding: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "none", cursor: "pointer", textAlign: "center" },
  actionIcon: { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: "#1a1a2e", margin: "0 0 10px" },
  txItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  txLeft: { display: "flex", alignItems: "center", gap: 10 },
  txDot: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 },
  txDesc: { fontSize: 14, fontWeight: 500, color: "#1a1a2e", margin: 0 },
  txDate: { fontSize: 12, color: "#aaa", margin: "2px 0 0" },
  txAmount: { fontSize: 15, fontWeight: 600 },
  nav: { background: "#fff", borderTop: "1px solid #f0f0f0", display: "flex", padding: "8px 0 12px" },
  navItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 0" },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, fontWeight: 500 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 100 },
  modalSheet: { background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", boxSizing: "border-box", maxWidth: 420, margin: "0 auto" },
  modalTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
  modalSub: { fontSize: 13, color: "#888", margin: "0 0 1.25rem" },
  amountInput: { width: "100%", padding: 14, borderRadius: 12, border: "2px solid #e0e0e0", fontSize: 22, fontWeight: 700, textAlign: "center", background: "#fafafa", boxSizing: "border-box", outline: "none", marginBottom: 14 },
  filterRow: { display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" },
  filterChip: { padding: "6px 14px", borderRadius: 20, border: "1px solid #e0e0e0", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" },
  success: { background: "#f0fdf4", color: "#16a34a", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 14, fontWeight: 500 },
  center: { textAlign: "center", padding: "3rem 1rem", color: "#aaa", fontSize: 14 },
};

const txColor = t => t === "deposit" ? "#16a34a" : t === "interest" ? "#4f46e5" : "#dc2626";
const txBg = t => t === "deposit" ? "#f0fdf4" : t === "interest" ? "#eef2ff" : "#fef2f2";
const txEmoji = t => t === "deposit" ? "↓" : t === "interest" ? "%" : "↑";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [portfolio, setPortfolio] = useState({ invested: 0, capital: 0 });
  const [txs, setTxs] = useState([]);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [txFilter, setTxFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aaveRate, setAaveRate] = useState(4.85);

  useEffect(() => {
    fetchAaveRate().then(rate => setAaveRate(rate));
    const interval = setInterval(() => fetchAaveRate().then(rate => setAaveRate(rate)), 60000);
    return () => clearInterval(interval);
  }, []);

  const initials = session ? session.email.slice(0, 2).toUpperCase() : "";
  const interest = (portfolio.capital || 0) - (portfolio.invested || 0);

  const showSuccess = msg => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 3500); };

  const loadData = async (sess) => {
    setTxLoading(true);
    try {
      let port = await sb.getPortfolio(sess.token, sess.uid);
      if (!port) { await sb.createPortfolio(sess.token, sess.uid); port = { invested: 0, capital: 0 }; }
      setPortfolio(port);
      const t = await sb.getTransactions(sess.token, sess.uid);
      setTxs(Array.isArray(t) ? t : []);
    } catch(e) { console.error(e); }
    setTxLoading(false);
  };

  const handleSignUp = async () => {
    setErr(""); setInfo("");
    if (!name || !email || !password) { setErr("Please fill in all fields."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr("Enter a valid email address."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await sb.signUp(email, password, name);
      setLoading(false);
      if (res.error) { setErr(res.error.message || "Sign up failed."); return; }
      if (res.user && res.access_token) {
        await sb.createProfile(res.access_token, res.user.id, email, name);
        await sb.createPortfolio(res.access_token, res.user.id);
        const sess = { token: res.access_token, uid: res.user.id, email };
        setSession(sess);
        await loadData(sess);
        setScreen("dashboard");
      } else {
        setInfo("Account created! Please check your email to confirm, then sign in.");
        setScreen("login");
      }
    } catch(e) {
      setLoading(false);
      setErr("Network error: " + e.message);
    }
  };

  const handleSignIn = async () => {
    setErr(""); setInfo("");
    if (!email || !password) { setErr("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await sb.signIn(email, password);
      setLoading(false);
      if (res.error) { setErr(res.error.message || "Sign in failed. Check your credentials."); return; }
      const sess = { token: res.access_token, uid: res.user.id, email: res.user.email };
      setSession(sess);
      await loadData(sess);
      setScreen("dashboard");
    } catch(e) {
      setLoading(false);
      setErr("Network error: " + e.message);
    }
  };

  const handleSignOut = async () => {
    if (session) await sb.signOut(session.token);
    setSession(null); setPortfolio({ invested: 0, capital: 0 }); setTxs([]);
    setEmail(""); setPassword(""); setName(""); setErr(""); setInfo("");
    setScreen("login");
  };

  const handleDeposit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    setSubmitting(true);
    const newInvested = (portfolio.invested || 0) + val;
    const newCapital = (portfolio.capital || 0) + val;
    await sb.updatePortfolio(session.token, session.uid, newInvested, newCapital);
    await sb.addTransaction(session.token, session.uid, "deposit", val, "Bank transfer");
    setPortfolio({ invested: newInvested, capital: newCapital });
    const t = await sb.getTransactions(session.token, session.uid);
    setTxs(Array.isArray(t) ? t : []);
    setModal(null); setAmount(""); setSubmitting(false);
    showSuccess(`$${fmt(val)} deposited successfully!`);
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0 || val > portfolio.capital) return;
    setSubmitting(true);
    const newCapital = (portfolio.capital || 0) - val;
    const newInvested = Math.max(0, (portfolio.invested || 0) - val);
    await sb.updatePortfolio(session.token, session.uid, newInvested, newCapital);
    await sb.addTransaction(session.token, session.uid, "withdrawal", -val, "Withdrawal to bank");
    setPortfolio({ invested: newInvested, capital: newCapital });
    const t = await sb.getTransactions(session.token, session.uid);
    setTxs(Array.isArray(t) ? t : []);
    setModal(null); setAmount(""); setSubmitting(false);
    showSuccess(`$${fmt(val)} withdrawal initiated!`);
  };

  const filteredTxs = txs.filter(t => {
    if (txFilter !== "all" && t.type !== txFilter) return false;
    if (dateFrom && t.date < dateFrom) return false;
    if (dateTo && t.date > dateTo) return false;
    return true;
  });

  if (screen === "login" || screen === "signup") {
    const isLogin = screen === "login";
    return (
      <div style={S.app}>
        <div style={S.authWrap}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={S.logoIcon}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4L24 9.5V18.5L14 24L4 18.5V9.5L14 4Z" fill="#4f46e5"/><path d="M14 9L19 11.75V17.25L14 20L9 17.25V11.75L14 9Z" fill="white" opacity="0.8"/></svg>
            </div>
            <p style={{ fontSize: 22, fontWeight: 600, color: "#1a1a2e", margin: 0 }}>Invest</p>
            <p style={{ fontSize: 14, color: "#888", margin: "4px 0 0" }}>Grow your money, effortlessly</p>
          </div>
          <div style={S.card}>
            <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 16px" }}>{isLogin ? "Welcome back" : "Create your account"}</p>
            {err && <div style={S.err}>{err}</div>}
            {info && <div style={S.info}>{info}</div>}
            {!isLogin && <>
              <label style={S.label}>Full name</label>
              <input style={S.input} placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} />
            </>}
            <label style={S.label}>Email address</label>
            <input style={S.input} placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <label style={S.label}>Password</label>
            <input style={S.input} placeholder={isLogin ? "Your password" : "Min. 6 characters"} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && (isLogin ? handleSignIn() : handleSignUp())} />
            <button style={loading ? S.btnDisabled : S.btn} onClick={isLogin ? handleSignIn : handleSignUp} disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#888" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <span style={{ color: "#4f46e5", fontWeight: 500, cursor: "pointer", marginLeft: 4 }} onClick={() => { setScreen(isLogin ? "signup" : "login"); setErr(""); setInfo(""); }}>
              {isLogin ? " Sign up" : " Sign in"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "dashboard") {
    return (
      <div style={S.app}>
        {modal && (
          <div style={S.modalOverlay} onClick={() => { setModal(null); setAmount(""); }}>
            <div style={S.modalSheet} onClick={e => e.stopPropagation()}>
              <p style={S.modalTitle}>{modal === "deposit" ? "Deposit funds" : "Withdraw funds"}</p>
              <p style={S.modalSub}>{modal === "deposit" ? "Transfer from your bank account" : "Transfer to your bank account"}</p>
              <input style={S.amountInput} type="number" placeholder="$0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
              {modal === "withdraw" && <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", margin: "-8px 0 12px" }}>Available: ${fmt(portfolio.capital)}</p>}
              <button style={submitting ? S.btnDisabled : S.btn} onClick={modal === "deposit" ? handleDeposit : handleWithdraw} disabled={submitting}>
                {submitting ? "Processing..." : modal === "deposit" ? "Confirm deposit" : "Confirm withdrawal"}
              </button>
              <button style={S.cancelBtn} onClick={() => { setModal(null); setAmount(""); }}>Cancel</button>
            </div>
          </div>
        )}
        <div style={S.header}>
          <div>
            <p style={S.headerTitle}>Good morning 👋</p>
            <p style={S.headerSub}>{session?.email}</p>
          </div>
          <div style={S.avatar}>{initials}</div>
        </div>
        <div style={S.dashBody}>
          {successMsg && <div style={S.success}>{successMsg}</div>}
          <div style={S.kpiCard}>
            <p style={S.kpiLabel}>Current capital</p>
            <p style={S.kpiValue}>${fmt(portfolio.capital)}</p>
            <p style={S.kpiSub}>{interest >= 0 ? "+" : ""}${fmt(interest)} interest earned</p>
          </div>
          <div style={S.kpiRow}>
            <div style={S.kpiSmall}>
              <p style={S.kpiSmallLabel}>Invested</p>
              <p style={S.kpiSmallValue}>${fmt(portfolio.invested)}</p>
            </div>
            <div style={S.kpiSmall}>
              <p style={S.kpiSmallLabel}>Daily rate</p>
              <p style={{ ...S.kpiSmallValue, color: "#4f46e5" }}>{aaveRate}% APY</p>
            </div>
          </div>
          <div style={S.actionsRow}>
            <button style={S.actionBtn} onClick={() => setModal("deposit")}>
              <div style={{ ...S.actionIcon, background: "#f0fdf4" }}><span style={{ fontSize: 20, color: "#16a34a" }}>↓</span></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Deposit</span>
            </button>
            <button style={S.actionBtn} onClick={() => setModal("withdraw")}>
              <div style={{ ...S.actionIcon, background: "#fef2f2" }}><span style={{ fontSize: 20, color: "#dc2626" }}>↑</span></div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>Withdraw</span>
            </button>
          </div>
          <p style={S.sectionTitle}>Recent activity</p>
          {txLoading && <p style={S.center}>Loading...</p>}
          {!txLoading && txs.length === 0 && <p style={S.center}>No transactions yet. Make your first deposit!</p>}
          {!txLoading && txs.slice(0, 5).map(t => (
            <div key={t.id} style={S.txItem}>
              <div style={S.txLeft}>
                <div style={{ ...S.txDot, background: txBg(t.type), color: txColor(t.type) }}>{txEmoji(t.type)}</div>
                <div>
                  <p style={S.txDesc}>{t.description}</p>
                  <p style={S.txDate}>{t.date}</p>
                </div>
              </div>
              <span style={{ ...S.txAmount, color: txColor(t.type) }}>
                {t.amount > 0 ? "+" : ""}${fmt(Math.abs(t.amount))}
              </span>
            </div>
          ))}
        </div>
        <div style={S.nav}>
          <button style={S.navItem} onClick={() => setScreen("dashboard")}>
            <span style={{ ...S.navIcon, color: "#4f46e5" }}>⌂</span>
            <span style={{ ...S.navLabel, color: "#4f46e5" }}>Home</span>
          </button>
          <button style={S.navItem} onClick={() => setScreen("history")}>
            <span style={{ ...S.navIcon, color: "#aaa" }}>☰</span>
            <span style={{ ...S.navLabel, color: "#aaa" }}>History</span>
          </button>
          <button style={S.navItem} onClick={handleSignOut}>
            <span style={{ ...S.navIcon, color: "#aaa" }}>⎋</span>
            <span style={{ ...S.navLabel, color: "#aaa" }}>Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div>
          <p style={S.headerTitle}>Transaction history</p>
          <p style={S.headerSub}>{filteredTxs.length} transactions</p>
        </div>
        <div style={S.avatar}>{initials}</div>
      </div>
      <div style={S.dashBody}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...S.label, marginBottom: 4 }}>From</label>
            <input style={{ ...S.input, marginBottom: 0, fontSize: 13 }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...S.label, marginBottom: 4 }}>To</label>
            <input style={{ ...S.input, marginBottom: 0, fontSize: 13 }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div style={S.filterRow}>
          {["all","deposit","interest","withdrawal"].map(f => (
            <button key={f} style={{ ...S.filterChip, background: txFilter === f ? "#1a1a2e" : "#fff", color: txFilter === f ? "#fff" : "#555", borderColor: txFilter === f ? "#1a1a2e" : "#e0e0e0" }} onClick={() => setTxFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {txLoading && <p style={S.center}>Loading...</p>}
        {!txLoading && filteredTxs.length === 0 && <p style={S.center}>No transactions found.</p>}
        {!txLoading && filteredTxs.map(t => (
          <div key={t.id} style={S.txItem}>
            <div style={S.txLeft}>
              <div style={{ ...S.txDot, background: txBg(t.type), color: txColor(t.type) }}>{txEmoji(t.type)}</div>
              <div>
                <p style={S.txDesc}>{t.description}</p>
                <p style={S.txDate}>{t.date}</p>
              </div>
            </div>
            <span style={{ ...S.txAmount, color: txColor(t.type) }}>
              {t.amount > 0 ? "+" : ""}${fmt(Math.abs(t.amount))}
            </span>
          </div>
        ))}
      </div>
      <div style={S.nav}>
        <button style={S.navItem} onClick={() => setScreen("dashboard")}>
          <span style={{ ...S.navIcon, color: "#aaa" }}>⌂</span>
          <span style={{ ...S.navLabel, color: "#aaa" }}>Home</span>
        </button>
        <button style={S.navItem} onClick={() => setScreen("history")}>
          <span style={{ ...S.navIcon, color: "#4f46e5" }}>☰</span>
          <span style={{ ...S.navLabel, color: "#4f46e5" }}>History</span>
        </button>
        <button style={S.navItem} onClick={handleSignOut}>
          <span style={{ ...S.navIcon, color: "#aaa" }}>⎋</span>
          <span style={{ ...S.navLabel, color: "#aaa" }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}