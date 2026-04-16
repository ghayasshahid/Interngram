import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const EMPTY = { name: "", email: "", password: "", companyName: "" };

export default function Register() {
  const [step, setStep]         = useState("pick");
  const [userType, setUserType] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const pick = (type) => { setUserType(type); setStep("form"); setError(""); };
  const back = () => { setStep("pick"); setUserType(null); setForm(EMPTY); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const isCompany = userType === "company";
    const endpoint  = isCompany ? "/api/company/register" : "/api/student/register";
    const body      = isCompany
      ? { name: form.name, email: form.email, password: form.password, companyName: form.companyName }
      : { name: form.name, email: form.email, password: form.password };
    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const key = isCompany ? "company" : "student";
        login(data.token, data[key], userType);
        toast.success("Account created! Welcome aboard.");
        navigate(isCompany ? "/company/dashboard" : "/student/dashboard");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <Link to="/" style={s.brand}>🎓 InternPortal</Link>
        <span style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login"><strong>Sign in</strong></Link>
        </span>
      </div>

      <div style={s.center}>
        {step === "pick" ? (
          <div className="anim-scale-in" style={s.pickBox}>
            <h2 style={{ textAlign: "center", marginBottom: ".5rem" }}>Create your account</h2>
            <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2rem", fontSize: ".9rem" }}>
              Choose how you'll use InternPortal
            </p>
            <div style={s.typePicker}>
              {[
                { type: "student", icon: "🎓", title: "Student", desc: "Browse internships, apply, and track your progress" },
                { type: "company", icon: "🏢", title: "Company", desc: "Post openings and review applicants" },
              ].map(({ type, icon, title, desc }) => (
                <button
                  key={type}
                  style={s.typeCard}
                  onClick={() => pick(type)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--primary-light)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: ".75rem" }}>{icon}</div>
                  <h3 style={{ margin: 0 }}>{title}</h3>
                  <p style={{ margin: ".5rem 0 0", color: "var(--text-muted)", fontSize: ".85rem", lineHeight: 1.5 }}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card anim-slide-up" style={s.formCard}>
            <button onClick={back} className="btn btn-ghost btn-sm" style={{ marginBottom: "1.25rem" }}>← Back</button>
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "2rem" }}>{userType === "company" ? "🏢" : "🎓"}</span>
              <div>
                <h2 style={{ margin: 0 }}>Register as {userType === "company" ? "Company" : "Student"}</h2>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: ".875rem" }}>Fill in your details below</p>
              </div>
            </div>

            {error && <div className="alert alert-error anim-slide-down" style={{ marginBottom: "1.25rem" }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: ".9rem" }}>
              <div className="field">
                <label className="label">{userType === "company" ? "Your Full Name" : "Full Name"}</label>
                <input className="input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required />
              </div>
              {userType === "company" && (
                <div className="field">
                  <label className="label">Company Name</label>
                  <input className="input" type="text" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Corp" required />
                </div>
              )}
              <div className="field">
                <label className="label">Email Address</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
              </div>
              <div className="field">
                <label className="label">Password</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ marginTop: ".5rem" }}>
                {loading ? <><span className="spinner" />Creating account…</> : "Create account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:    { minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" },
  topBar:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  brand:   { fontSize: "1.1rem", fontWeight: 700, color: "var(--slate-900)", textDecoration: "none" },
  center:  { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  pickBox: { width: "100%", maxWidth: "540px" },
  typePicker: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  typeCard: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2rem 1.5rem", border: "2px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--surface)", cursor: "pointer", transition: "border-color 200ms, box-shadow 200ms" },
  formCard: { width: "100%", maxWidth: "460px", padding: "2rem" },
};
