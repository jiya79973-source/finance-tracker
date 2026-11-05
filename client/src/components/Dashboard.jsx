import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ArrowDownLeft, ArrowDownToLine, ArrowLeftRight, ArrowUpRight, CalendarDays,
  ChevronDown, CirclePlus, CreditCard, LogOut, Menu, Pencil, Plus,
  Search, Shapes, Trash2, TrendingUp, Wallet, X,
} from "lucide-react";
import { useAuth } from "../AuthContext.jsx";
import { apiRequest } from "../api.js";

const PALETTE = ["#64876b", "#d5a25f", "#8497b2", "#c77e65", "#8175a7", "#61a99a", "#c27691"];
const CATEGORIES = {
  expense: ["Food & dining", "Transport", "Shopping", "Housing", "Utilities", "Health", "Entertainment", "Other"],
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
};
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const currentMonth = localDateString().slice(0, 7);
const emptyForm = { type: "expense", category: "Food & dining", amount: "", description: "", date: localDateString() };
const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
const formatMoney = (value) => currency.format(value || 0);

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
}

function monthLabel(value) {
  return new Date(`${value}-02T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function TransactionModal({ transaction, onClose, onSave, busy }) {
  const [form, setForm] = useState(transaction ? {
    type: transaction.type,
    category: transaction.category,
    amount: String(transaction.amount),
    description: transaction.description || "",
    date: transaction.date.slice(0, 10),
  } : emptyForm);
  const [error, setError] = useState("");

  function changeType(type) {
    setForm({ ...form, type, category: CATEGORIES[type][0] });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
        <div className="modal-heading">
          <div><span className="form-kicker">{transaction ? "UPDATE YOUR RECORD" : "A NEW RECORD"}</span><h2 id="modal-heading">{transaction ? "Edit transaction" : "Add a transaction"}</h2></div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}><X size={19} /></button>
        </div>
        <form className="transaction-form" onSubmit={submit}>
          <div className="type-toggle">
            {["expense", "income"].map((type) => <button key={type} type="button" className={form.type === type ? `selected ${type}` : ""} onClick={() => changeType(type)}>{type === "expense" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}{type === "expense" ? "Expense" : "Income"}</button>)}
          </div>
          <label>Amount<div className="amount-field"><span>$</span><input autoFocus type="number" min="0.01" max="100000000" step="0.01" required placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div></label>
          <div className="form-grid">
            <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES[form.type].map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Date<input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          </div>
          <label>Note <span className="optional-label">OPTIONAL</span><input maxLength={120} placeholder="What was this for?" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy}>{busy ? "Saving…" : transaction ? "Save changes" : "Save transaction"} <ArrowDownToLine size={16} /></button></div>
        </form>
      </section>
    </div>
  );
}

function StatCard({ title, value, note, icon: Icon, tone }) {
  return <article className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={18} /></span></div><strong>{formatMoney(value)}</strong><span className="stat-note">{note}</span></article>;
}

function EmptyState({ onAdd }) {
  return <div className="empty-state"><div className="empty-icon"><Wallet size={23} /></div><h3>Nothing to see here just yet</h3><p>Add a transaction to start building a clearer picture of your money.</p><button className="secondary-button" onClick={onAdd}><Plus size={16} /> Add your first transaction</button></div>;
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadTransactions = useCallback(async () => {
    const data = await apiRequest("/transactions", { token });
    setTransactions(data.transactions);
  }, [token]);

  useEffect(() => {
    loadTransactions().catch((error) => setPageError(error.message));
  }, [loadTransactions]);

  const monthTransactions = useMemo(() => transactions.filter((item) => item.date.slice(0, 7) === month), [transactions, month]);
  const visibleTransactions = useMemo(() => monthTransactions.filter((item) => (
    (category === "all" || item.category === category)
    && (type === "all" || item.type === type)
    && `${item.category} ${item.description || ""}`.toLowerCase().includes(search.toLowerCase())
  )).sort((a, b) => new Date(b.date) - new Date(a.date)), [monthTransactions, category, type, search]);

  const totals = useMemo(() => monthTransactions.reduce((sum, item) => {
    sum[item.type] += item.amount;
    return sum;
  }, { income: 0, expense: 0 }), [monthTransactions]);

  const expenseCategories = useMemo(() => {
    const sums = new Map();
    monthTransactions.filter((item) => item.type === "expense").forEach((item) => sums.set(item.category, (sums.get(item.category) || 0) + item.amount));
    return [...sums].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const values = transactions.filter((item) => item.date.slice(0, 7) === key).reduce((sum, item) => {
      sum[item.type] += item.amount;
      return sum;
    }, { income: 0, expense: 0 });
    return { label: date.toLocaleDateString(undefined, { month: "short" }), ...values };
  }), [transactions, month]);

  async function saveTransaction(data) {
    setBusy(true);
    setPageError("");
    try {
      const editing = modal?._id;
      const result = await apiRequest(editing ? `/transactions/${editing}` : "/transactions", {
        token,
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      setTransactions((current) => editing
        ? current.map((item) => item._id === editing ? result.transaction : item)
        : [result.transaction, ...current]);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTransaction(id) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setPageError("");
    try {
      await apiRequest(`/transactions/${id}`, { token, method: "DELETE" });
      setTransactions((current) => current.filter((item) => item._id !== id));
    } catch (error) {
      setPageError(error.message);
    }
  }

  function exportCsv() {
    const rows = [["Date", "Type", "Category", "Note", "Amount"], ...visibleTransactions.map((item) => [
      item.date.slice(0, 10), item.type, item.category, item.description || "", item.amount.toFixed(2),
    ])];
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pocket-ledger-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const monthOptions = useMemo(() => {
    const keys = new Set([currentMonth, ...transactions.map((item) => item.date.slice(0, 7))]);
    return [...keys].sort().reverse();
  }, [transactions]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}><span className="brand-mark">p.</span> pocket ledger</a>
        <span className="nav-label">WORKSPACE</span>
        <nav className="side-nav"><a className="nav-link active" href="#overview" onClick={() => setMobileNavOpen(false)}><Shapes size={18} /> Overview</a><a className="nav-link" href="#transactions" onClick={() => setMobileNavOpen(false)}><ArrowLeftRight size={18} /> Transactions <span className="nav-count">{transactions.length}</span></a></nav>
        <div className="sidebar-bottom">
          <div className="side-note"><div className="side-note-icon"><TrendingUp size={18} /></div><p>Little by little adds up.</p><span>Keep checking in. You’re doing great.</span><div className="note-decoration">✳</div></div>
          <button className="profile-button" onClick={logout}><span className="avatar">{initials(user?.name)}</span><span className="profile-copy"><strong>{user?.name}</strong><small>Personal account</small></span><LogOut size={17} className="logout-icon" /></button>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content" id="overview">
        <header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumb">Your finances <span>/</span> <strong>Overview</strong></div><div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><span className="top-avatar">{initials(user?.name)}</span></div></header>

        <div className="page-content">
          <section className="welcome-row"><div><span className="eyebrow dark-eyebrow"><span className="eyebrow-dot" /> YOUR MONEY, AT A GLANCE</span><h1>A clearer picture, <em>{user?.name?.split(" ")[0] || "friend"}.</em></h1><p>Here’s how things are looking this month.</p></div><button className="primary-button add-button" onClick={() => setModal({})}><CirclePlus size={18} /> Add transaction</button></section>

          {pageError && <div className="page-error" role="alert"><span>{pageError}</span><button aria-label="Dismiss error" onClick={() => setPageError("")}><X size={16} /></button></div>}

          <div className="overview-toolbar"><div className="month-picker"><CalendarDays size={16} /><select aria-label="Select month" value={month} onChange={(event) => setMonth(event.target.value)}>{monthOptions.map((option) => <option value={option} key={option}>{monthLabel(option)}</option>)}</select><ChevronDown size={14} /></div><span className="overview-caption">MONTHLY OVERVIEW <span className="caption-dot" /></span></div>

          <section className="stats-grid" aria-label="Monthly summary"><StatCard title="Total income" value={totals.income} note={`${monthTransactions.filter((item) => item.type === "income").length} deposits this month`} icon={ArrowDownLeft} tone="income-tone" /><StatCard title="Total expenses" value={totals.expense} note={`${monthTransactions.filter((item) => item.type === "expense").length} payments this month`} icon={ArrowUpRight} tone="expense-tone" /><StatCard title="Net balance" value={totals.income - totals.expense} note={totals.income - totals.expense >= 0 ? "You’re in the green" : "A little over income"} icon={Wallet} tone="balance-tone" /></section>

          <section className="charts-grid">
            <article className="panel trend-panel"><div className="panel-heading"><div><span className="panel-kicker">THE BIG PICTURE</span><h2>Money in, money out</h2></div><span className="chart-period"><span className="caption-dot" /> LAST 6 MONTHS</span></div><div className="trend-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div><div className="trend-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyTrend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#64876b" stopOpacity={0.19} /><stop offset="95%" stopColor="#64876b" stopOpacity={0} /></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d5a25f" stopOpacity={0.18} /><stop offset="95%" stopColor="#d5a25f" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eceee9" strokeDasharray="3 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#92978f", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#92978f", fontSize: 10 }} tickFormatter={(value) => value === 0 ? "$0" : `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} /><Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ border: "1px solid #e8e9e4", borderRadius: 12, fontSize: 12 }} /><Area type="monotone" dataKey="income" name="Income" stroke="#64876b" strokeWidth={2.5} fill="url(#incomeFill)" /><Area type="monotone" dataKey="expense" name="Expenses" stroke="#d5a25f" strokeWidth={2.5} fill="url(#expenseFill)" /></AreaChart></ResponsiveContainer></div></article>

            <article className="panel category-panel"><div className="panel-heading"><div><span className="panel-kicker">WHERE IT GOES</span><h2>Spending by category</h2></div><span className="small-icon"><CreditCard size={16} /></span></div>{expenseCategories.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseCategories} dataKey="value" nameKey="name" innerRadius="69%" outerRadius="91%" paddingAngle={4} stroke="none" cornerRadius={4}>{expenseCategories.map((entry, index) => <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />)}</Pie><Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ border: "1px solid #e8e9e4", borderRadius: 12, fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{formatMoney(totals.expense)}</strong><span>THIS MONTH</span></div></div><div className="category-legend">{expenseCategories.slice(0, 4).map((item, index) => <div key={item.name}><span><i style={{ background: PALETTE[index % PALETTE.length] }} />{item.name}</span><strong>{formatMoney(item.value)}</strong></div>)}</div></> : <div className="chart-empty"><div className="empty-icon"><CreditCard size={20} /></div><p>No expenses for {monthLabel(month).toLowerCase()}.</p></div>}</article>
          </section>

          <section className="panel transactions-panel" id="transactions"><div className="transactions-heading"><div><span className="panel-kicker">YOUR ACTIVITY</span><h2>Recent transactions <span className="transaction-count">{visibleTransactions.length}</span></h2></div><button className="export-button" onClick={exportCsv} disabled={!visibleTransactions.length}><ArrowDownToLine size={16} /> <span>Export CSV</span></button></div>
            <div className="filters"><label className="search-field"><Search size={16} /><input placeholder="Search transactions…" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="filter-select"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{[...new Set(transactions.map((item) => item.category))].sort().map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label><label className="filter-select type-filter"><span className="sr-only">Filter by transaction type</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select><ChevronDown size={14} /></label></div>
            {visibleTransactions.length ? <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>CATEGORY</th><th>DATE</th><th>AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleTransactions.map((item, index) => <tr key={item._id}><td><div className="transaction-cell"><span className={`transaction-icon transaction-icon-${item.type}`}>{item.type === "income" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><span><strong>{item.description || item.category}</strong><small>{item.description ? item.category : item.type === "income" ? "Money received" : "Payment"}</small></span></div></td><td><span className="category-pill"><i style={{ background: PALETTE[[...new Set(transactions.map((entry) => entry.category))].indexOf(item.category) % PALETTE.length] }} />{item.category}</span></td><td className="date-cell">{new Date(`${item.date.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td><td className={`amount-cell ${item.type}`}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount)}</td><td><div className="row-actions"><button aria-label={`Edit ${item.description || item.category}`} onClick={() => setModal(item)}><Pencil size={15} /></button><button aria-label={`Delete ${item.description || item.category}`} onClick={() => deleteTransaction(item._id)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState onAdd={() => setModal({})} />}
            {visibleTransactions.length > 0 && <div className="table-footer"><span>Showing <strong>{visibleTransactions.length}</strong> transaction{visibleTransactions.length === 1 ? "" : "s"} for {monthLabel(month)}</span><span>All caught up <span className="footer-sparkle">✳</span></span></div>}
          </section>
          <footer className="page-footer"><span>Made for a little more peace of mind.</span><span><ShieldCheckIcon /> Your data is private</span></footer>
        </div>
      </main>
      {modal && <TransactionModal transaction={modal._id ? modal : null} onClose={() => setModal(null)} onSave={saveTransaction} busy={busy} />}
    </div>
  );
}

function ShieldCheckIcon() {
  return <span className="shield-check">✓</span>;
}
