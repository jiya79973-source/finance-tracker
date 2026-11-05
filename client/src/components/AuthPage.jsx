import { useState } from "react";
import { ArrowRight, BarChart3, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "../AuthContext.jsx";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await (mode === "login" ? login({ email: form.email, password: form.password }) : register(form));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand brand-light" href="/" aria-label="Pocket Ledger home"><span className="brand-mark">p.</span> pocket ledger</a>
        <div className="story-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE MORE CLARITY</span>
          <h1>Your money,<br />in a better <em>light.</em></h1>
          <p>Feel good about where your money goes. A clear, calm space to see the whole picture.</p>
          <div className="story-points">
            <span><Check size={16} /> Everything in one view</span>
            <span><Check size={16} /> Your data stays yours</span>
          </div>
        </div>
        <div className="story-chart" aria-hidden="true">
          <div className="story-chart-top"><span>Monthly overview</span><BarChart3 size={18} /></div>
          <div className="story-bars">{[38, 53, 43, 69, 58, 84, 66, 94, 72, 100, 79, 91].map((height, index) => <span key={index} style={{ height: `${height}%` }} />)}</div>
          <div className="story-chart-foot"><span>JAN</span><span>APR</span><span>JUL</span><span>OCT</span><span>DEC</span></div>
        </div>
        <div className="story-footer"><ShieldCheck size={15} /> Private by design</div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><span className="brand-mark">p.</span> pocket ledger</div>
          <span className="form-kicker">{mode === "login" ? "WELCOME BACK" : "A FRESH START"}</span>
          <h2>{mode === "login" ? "Good to see you." : "Make room for clarity."}</h2>
          <p className="form-intro">{mode === "login" ? "Sign in to pick up where you left off." : "Create your account. Your next chapter starts here."}</p>

          <div className="auth-tabs" role="tablist">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && <label>Your name<input autoComplete="name" required maxLength={60} placeholder="Jamie Parker" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
            <label>Email address<input type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={72} placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? "One moment…" : mode === "login" ? "Sign in to your account" : "Create my account"} <ArrowRight size={17} /></button>
          </form>
          <p className="privacy-note"><ShieldCheck size={15} /> Your financial data is private and encrypted.</p>
        </div>
        <div className="auth-bottom">Small steps. A clearer picture. <span>© {new Date().getFullYear()} Pocket Ledger</span></div>
      </section>
    </main>
  );
}
