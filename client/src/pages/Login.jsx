import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Try company first, then student
      for (const [endpoint, type, key] of [
        ["/api/company/login", "company", "company"],
        ["/api/student/login", "student", "student"],
      ]) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (res.ok) {
          const data = await res.json();
          login(data.token, data[key], type);
          toast.success(`Welcome back, ${data[key].name}!`);
          navigate(type === "company" ? "/company/dashboard" : "/student/dashboard");
          return;
        }
      }
      setError("Invalid email or password");
    } catch {
      setError("Cannot reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left} className="anim-fade-in">
        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <span style={styles.brandIcon}>🎓</span>
            <span style={styles.brandName}>InternPortal</span>
          </div>
          <h1 style={styles.heroTitle}>Find your next internship opportunity</h1>
          <p style={styles.heroSub}>Connect students with top companies. Track applications, get recommendations, and launch your career.</p>
          <div style={styles.featureList}>
            {["Smart job recommendations based on your skills", "Real-time application status tracking", "Skill progress tracker & analytics"].map(f => (
              <div key={f} style={styles.feature}>
                <span style={styles.featureCheck}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.formCard} className="anim-slide-up">
          <h2 style={{ marginBottom: "0.25rem" }}>Sign in</h2>
          <p style={{ color: "var(--text-muted)", fontSize: ".9rem", marginBottom: "1.75rem" }}>
            Welcome back — enter your credentials below
          </p>

          {error && (
            <div className="alert alert-error anim-slide-down" style={{ marginBottom: "1.25rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="field">
              <label className="label">Email address</label>
              <input
                className={`input${error ? " input-error" : ""}`}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label className="label">Password</label>
              <input
                className={`input${error ? " input-error" : ""}`}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ marginTop: "0.5rem", width: "100%" }}
            >
              {loading ? <><span className="spinner" />Signing in…</> : "Sign in"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: ".875rem", color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:  { display: "flex", minHeight: "100vh" },
  left:  {
    flex: 1,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "3rem",
  },
  leftInner: { maxWidth: "420px", color: "#fff" },
  brand: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem" },
  brandIcon: { fontSize: "1.75rem" },
  brandName: { fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-.02em" },
  heroTitle: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25, marginBottom: "1rem", color: "#fff" },
  heroSub:   { color: "rgba(255,255,255,.7)", fontSize: ".95rem", lineHeight: 1.7, marginBottom: "2rem" },
  featureList: { display: "flex", flexDirection: "column", gap: ".75rem" },
  feature: { display: "flex", alignItems: "flex-start", gap: ".75rem", fontSize: ".9rem", color: "rgba(255,255,255,.85)" },
  featureCheck: { width: "20px", height: "20px", borderRadius: "50%", background: "rgba(99,179,237,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: ".75rem", color: "#93c5fd", fontWeight: 700 },
  right: { width: "480px", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" },
  formCard: { width: "100%", maxWidth: "380px" },
};
