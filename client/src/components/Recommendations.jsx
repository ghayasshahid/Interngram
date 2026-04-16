import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Recommendations({ onApply, applications = [] }) {
  const { token } = useAuth();
  const toast = useToast();
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyState, setApplyState] = useState({});

  useEffect(() => { fetchRecs(); }, []);

  const fetchRecs = async () => {
    try {
      const res = await fetch("/api/recommendations", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRecs(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const getS  = (id) => applyState[id] || { show: false, text: "", loading: false };
  const setS  = (id, patch) => setApplyState(p => ({ ...p, [id]: { ...getS(id), ...patch } }));

  const handleApply = async (e, jobId) => {
    e.preventDefault();
    setS(jobId, { loading: true });
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId, coverLetter: getS(jobId).text }),
      });
      const data = await res.json();
      if (res.ok) { setS(jobId, { show: false, text: "", loading: false }); fetchRecs(); onApply?.(); toast.success("Application submitted!"); }
      else { toast.error(data.message || "Failed to apply"); setS(jobId, { loading: false }); }
    } catch { toast.error("Network error"); setS(jobId, { loading: false }); }
  };

  if (loading) return (
    <div className="grid-auto">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="skeleton" style={{ height: 18, width: "60%", borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, width: "40%", borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 60, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );

  if (recs.length === 0) return (
    <div className="empty-state">
      <div className="empty-state-icon">✨</div>
      <h3>No recommendations yet</h3>
      <p>Update your profile with skills, major, and location preferences to get personalised suggestions</p>
    </div>
  );

  return (
    <div className="grid-auto stagger">
      {recs.map(job => {
        const st = getS(job._id);
        const hasApplied = applications.some(a => a.jobId?._id === job._id);
        const company = job.company || job.companyId?.companyName || "Unknown Company";

        return (
          <div key={job._id} className="card card-hover anim-slide-up" style={s.card}>
            <div style={s.top}>
              <div style={s.companyAvatar}>{company[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, lineHeight: 1.3 }}>{job.title}</h4>
                <p style={{ margin: ".2rem 0 0", fontSize: ".85rem", color: "var(--text-muted)" }}>{company}</p>
              </div>
              {hasApplied && <span className="badge badge-green">Applied ✓</span>}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", margin: ".75rem 0" }}>
              {job.location && <span className="chip">📍 {job.location}</span>}
              {job.stipend  && <span className="chip">💰 {job.stipend}</span>}
            </div>

            {job.requiredSkills?.length > 0 && (
              <div className="chip-list" style={{ marginBottom: ".75rem" }}>
                {job.requiredSkills.map(sk => <span key={sk} className="chip chip-blue">{sk}</span>)}
              </div>
            )}

            <p style={{ fontSize: ".875rem", color: "var(--slate-600)", lineHeight: 1.6, margin: 0 }}>
              {job.description?.substring(0, 110)}{job.description?.length > 110 ? "…" : ""}
            </p>

            {!hasApplied && (
              <div style={{ marginTop: "1rem" }}>
                {!st.show ? (
                  <button className="btn btn-primary btn-sm" onClick={() => setS(job._id, { show: true })}>Apply Now</button>
                ) : (
                  <form onSubmit={e => handleApply(e, job._id)} className="anim-slide-down">
                    <textarea className="textarea" rows="3" placeholder="Cover letter (optional)" value={st.text}
                      onChange={e => setS(job._id, { text: e.target.value })} style={{ marginBottom: ".5rem" }} />
                    <div style={{ display: "flex", gap: ".5rem" }}>
                      <button type="submit" disabled={st.loading} className="btn btn-primary btn-sm">
                        {st.loading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Sending…</> : "Submit"}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setS(job._id, { show: false })}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const s = {
  card:          { padding: "1.25rem", display: "flex", flexDirection: "column" },
  top:           { display: "flex", gap: ".75rem", alignItems: "flex-start", marginBottom: 0 },
  companyAvatar: { width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--slate-900)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 },
};
