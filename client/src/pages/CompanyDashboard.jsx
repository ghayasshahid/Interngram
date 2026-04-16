import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const EMPTY_FORM = { title: "", description: "", location: "", duration: "", stipend: "", requiredSkills: "", tags: "", deadline: "" };
const TABS = [
  { id: "jobs",   label: "My Internships", icon: "💼" },
  { id: "post",   label: "Post New",       icon: "➕" },
];

export default function CompanyDashboard() {
  const { user, token, userType, logout } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState("jobs");
  const [jobs, setJobs]             = useState([]);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId]   = useState(null);

  useEffect(() => {
    if (!token || userType !== "company") { navigate("/login"); return; }
    fetchJobs();
  }, [token, userType]);

  const fetchJobs = async () => {
    const res = await fetch("/api/company/jobs", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setJobs(await res.json());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    const body = {
      ...form,
      requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(editingId ? `/api/jobs/${editingId}` : "/api/jobs", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editingId ? "Internship updated!" : "Internship posted!");
        setForm(EMPTY_FORM);
        setEditingId(null);
        setActiveTab("jobs");
        fetchJobs();
      } else {
        setFormError(data.message || "Failed to save");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (job) => {
    setForm({
      title: job.title || "", description: job.description || "",
      location: job.location || "", duration: job.duration || "",
      stipend: job.stipend || "",
      requiredSkills: (job.requiredSkills || []).join(", "),
      tags: (job.tags || []).join(", "),
      deadline: job.deadline ? job.deadline.substring(0, 10) : "",
    });
    setEditingId(job._id);
    setActiveTab("post");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (jobId) => {
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { toast.success("Internship deleted"); fetchJobs(); }
    else toast.error("Failed to delete");
  };

  const cancelEdit = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(""); };

  const totalApplications = jobs.reduce((acc, j) => acc + (j._appCount || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-brand">
          <span>🏢</span>
          <span>{user?.companyName || user?.name || "Company"}</span>
          <span className="brand-dot" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
          <div style={styles.userChip}>
            <span style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "C"}</span>
            <span style={{ fontSize: ".875rem", fontWeight: 500 }}>{user?.name}</span>
          </div>
          <button onClick={() => { logout(); toast.info("Signed out."); navigate("/login"); }} className="btn btn-secondary btn-sm">Sign out</button>
        </div>
      </header>

      {/* TABS */}
      <div style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
          <div className="tabs">
            {TABS.map(t => (
              <button key={t.id} className={`tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => { setActiveTab(t.id); if (t.id !== "post") cancelEdit(); }}>
                {t.icon} {t.label}
                {t.id === "jobs" && jobs.length > 0 && (
                  <span style={styles.tabBadge}>{jobs.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>

        {/* MY INTERNSHIPS */}
        {activeTab === "jobs" && (
          <div className="anim-slide-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2>My Internships</h2>
                <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>
                  {jobs.length} posting{jobs.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab("post")}>+ Post New</button>
            </div>

            {jobs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💼</div>
                <h3>No internships posted yet</h3>
                <p>Post your first internship to start receiving applications</p>
                <button className="btn btn-primary" style={{ marginTop: ".5rem" }} onClick={() => setActiveTab("post")}>Post New Internship</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1.25rem" }} className="stagger">
                {jobs.map(job => (
                  <JobCard key={job._id} job={job} token={token} onEdit={() => handleEdit(job)} onDelete={() => handleDelete(job._id)} toast={toast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* POST / EDIT FORM */}
        {activeTab === "post" && (
          <div className="anim-slide-up" style={{ maxWidth: "720px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>{editingId ? "Edit Internship" : "Post New Internship"}</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>
                {editingId ? "Update the details below" : "Fill in the details to publish your opening"}
              </p>
            </div>

            {formError && <div className="alert alert-error anim-slide-down" style={{ marginBottom: "1.25rem" }}>{formError}</div>}

            <form onSubmit={handleSubmit} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Job Title *</label>
                  <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Developer Intern" required />
                </div>
                <div className="field">
                  <label className="label">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Lahore / Remote" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Duration</label>
                  <input className="input" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 3 months" />
                </div>
                <div className="field">
                  <label className="label">Stipend</label>
                  <input className="input" value={form.stipend} onChange={e => setForm({ ...form, stipend: e.target.value })} placeholder="e.g. PKR 30,000/month" />
                </div>
              </div>
              <div className="field">
                <label className="label">Description *</label>
                <textarea className="textarea" rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and requirements…" required style={{ minHeight: 120 }} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="label">Required Skills <span className="text-muted text-xs">(comma-separated)</span></label>
                  <input className="input" value={form.requiredSkills} onChange={e => setForm({ ...form, requiredSkills: e.target.value })} placeholder="React, Node.js, Python…" />
                </div>
                <div className="field">
                  <label className="label">Tags <span className="text-muted text-xs">(comma-separated)</span></label>
                  <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Frontend, Remote, Full-Stack…" />
                </div>
              </div>
              <div className="field" style={{ maxWidth: "220px" }}>
                <label className="label">Application Deadline</label>
                <input className="input" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="submit" disabled={formLoading} className="btn btn-primary">
                  {formLoading ? <><span className="spinner" />Saving…</> : editingId ? "Save Changes" : "Post Internship"}
                </button>
                {editingId && <button type="button" className="btn btn-secondary" onClick={() => { cancelEdit(); setActiveTab("jobs"); }}>Cancel</button>}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── JOB CARD WITH APPLICANTS ─── */
function JobCard({ job, token, onEdit, onDelete, toast }) {
  const [apps, setApps]         = useState([]);
  const [showApps, setShowApps] = useState(false);
  const [appCount, setAppCount] = useState(null);
  const [actionState, setActionState] = useState({});

  useEffect(() => { loadCount(); }, []);

  const loadCount = async () => {
    const res = await fetch(`/api/company/applications/${job._id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setApps(d); setAppCount(d.length); }
  };

  const getAS = (id) => actionState[id] || { showInterview: false, showOffer: false, interviewDate: "", offerDetails: "" };
  const setAS = (id, patch) => setActionState(p => ({ ...p, [id]: { ...getAS(id), ...patch } }));

  const updateStatus = async (appId, status, interviewDate, offerDetails) => {
    const res = await fetch(`/api/applications/${appId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, interviewDate, offerDetails }),
    });
    if (res.ok) { setAS(appId, { showInterview: false, showOffer: false }); loadCount(); toast.success("Status updated"); }
    else toast.error("Failed to update status");
  };

  const STATUS_META = {
    pending:            { label: "Applied",            cls: "badge-gray"   },
    reviewing:          { label: "Under Review",       cls: "badge-blue"   },
    interview_scheduled:{ label: "Interview Scheduled",cls: "badge-yellow" },
    offer_received:     { label: "Offer Sent",         cls: "badge-purple" },
    accepted:           { label: "Accepted",           cls: "badge-green"  },
    rejected:           { label: "Rejected",           cls: "badge-red"    },
  };

  return (
    <div className="card anim-slide-up">
      <div style={styles.jobCardHead}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>{job.title}</h3>
            {job.deadline && (
              <span className={`badge ${new Date(job.deadline) < new Date() ? "badge-red" : "badge-gray"}`}>
                {new Date(job.deadline) < new Date() ? "Expired" : `Deadline ${new Date(job.deadline).toLocaleDateString()}`}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".5rem" }}>
            {job.location  && <span className="chip">📍 {job.location}</span>}
            {job.duration  && <span className="chip">⏱ {job.duration}</span>}
            {job.stipend   && <span className="chip">💰 {job.stipend}</span>}
          </div>
          {job.requiredSkills?.length > 0 && (
            <div className="chip-list" style={{ marginTop: ".5rem" }}>
              {job.requiredSkills.map(sk => <span key={sk} className="chip chip-blue">{sk}</span>)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: ".5rem", flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
        </div>
      </div>

      <div style={styles.jobCardFoot}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { if (!showApps) loadCount(); setShowApps(v => !v); }}
        >
          {showApps ? "▲ Hide" : "▼ View"} Applicants
          {appCount !== null && (
            <span style={{ marginLeft: ".4rem", padding: ".1rem .5rem", background: appCount > 0 ? "var(--primary)" : "var(--slate-300)", color: appCount > 0 ? "#fff" : "var(--slate-600)", borderRadius: "var(--radius-full)", fontSize: ".75rem", fontWeight: 700 }}>
              {appCount}
            </span>
          )}
        </button>
      </div>

      {showApps && (
        <div style={styles.appsPanel} className="anim-slide-down">
          {apps.length === 0 ? (
            <div className="empty-state" style={{ padding: "2rem" }}>
              <div className="empty-state-icon" style={{ fontSize: "2rem" }}>📭</div>
              <p>No applications yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: ".75rem" }}>
              {apps.map(app => {
                const as = getAS(app._id);
                const meta = STATUS_META[app.status] || { label: app.status, cls: "badge-gray" };
                return (
                  <div key={app._id} style={styles.appCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: ".75rem" }}>
                      <div>
                        <strong>{app.studentId?.name}</strong>
                        <span style={{ color: "var(--text-muted)", fontSize: ".85rem", marginLeft: ".5rem" }}>{app.studentId?.email}</span>
                        <p style={{ margin: ".25rem 0 0", fontSize: ".8rem", color: "var(--text-muted)" }}>
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`badge ${meta.cls}`}>{meta.label}</span>
                    </div>

                    {app.coverLetter && (
                      <div style={styles.coverLetterBox}>
                        <p style={{ margin: 0, fontSize: ".85rem" }}>{app.coverLetter}</p>
                      </div>
                    )}
                    {app.interviewDate && (
                      <p style={{ margin: ".5rem 0 0", fontSize: ".85rem" }}>
                        <strong>Interview:</strong> {new Date(app.interviewDate).toLocaleDateString()}
                      </p>
                    )}
                    {app.offerDetails && (
                      <p style={{ margin: ".25rem 0 0", fontSize: ".85rem" }}>
                        <strong>Offer:</strong> {app.offerDetails}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginTop: ".75rem" }}>
                      {[
                        { status: "reviewing",   label: "Review",   color: null },
                        { status: "accepted",    label: "Accept",   color: "#16a34a" },
                        { status: "rejected",    label: "Reject",   color: "#dc2626" },
                      ].map(({ status, label, color }) => (
                        <button key={status}
                          disabled={app.status === status}
                          onClick={() => updateStatus(app._id, status)}
                          className="btn btn-sm"
                          style={{ background: app.status === status ? "var(--slate-200)" : (color || "var(--slate-900)"), color: app.status === status ? "var(--slate-400)" : "#fff", cursor: app.status === status ? "not-allowed" : "pointer", border: "none" }}
                        >{label}</button>
                      ))}
                      <button
                        disabled={app.status === "interview_scheduled"}
                        onClick={() => setAS(app._id, { showInterview: !as.showInterview, showOffer: false })}
                        className="btn btn-sm"
                        style={{ background: app.status === "interview_scheduled" ? "var(--slate-200)" : "#d97706", color: app.status === "interview_scheduled" ? "var(--slate-400)" : "#fff", border: "none" }}
                      >Interview</button>
                      <button
                        disabled={app.status === "offer_received"}
                        onClick={() => setAS(app._id, { showOffer: !as.showOffer, showInterview: false })}
                        className="btn btn-sm"
                        style={{ background: app.status === "offer_received" ? "var(--slate-200)" : "#7c3aed", color: app.status === "offer_received" ? "var(--slate-400)" : "#fff", border: "none" }}
                      >Send Offer</button>
                    </div>

                    {as.showInterview && (
                      <div style={styles.inlineForm} className="anim-slide-down">
                        <label className="label">Interview Date</label>
                        <input type="date" className="input" value={as.interviewDate} onChange={e => setAS(app._id, { interviewDate: e.target.value })} style={{ maxWidth: 200, marginTop: ".35rem" }} />
                        <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => updateStatus(app._id, "interview_scheduled", as.interviewDate)} disabled={!as.interviewDate}>Confirm</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setAS(app._id, { showInterview: false })}>Cancel</button>
                        </div>
                      </div>
                    )}
                    {as.showOffer && (
                      <div style={styles.inlineForm} className="anim-slide-down">
                        <label className="label">Offer Details</label>
                        <textarea className="textarea" rows="3" value={as.offerDetails} onChange={e => setAS(app._id, { offerDetails: e.target.value })} placeholder="Describe the offer (salary, start date, role details…)" style={{ marginTop: ".35rem" }} />
                        <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => updateStatus(app._id, "offer_received", null, as.offerDetails)} disabled={!as.offerDetails.trim()}>Send Offer</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setAS(app._id, { showOffer: false })}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  userChip:    { display: "flex", alignItems: "center", gap: ".5rem", padding: ".25rem .75rem .25rem .25rem", background: "var(--slate-100)", borderRadius: "var(--radius-full)" },
  avatar:      { width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 700, flexShrink: 0 },
  tabBadge:    { marginLeft: ".4rem", padding: ".1rem .45rem", background: "var(--primary)", color: "#fff", borderRadius: "var(--radius-full)", fontSize: ".7rem", fontWeight: 700 },
  jobCardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", padding: "1.25rem 1.25rem 0" },
  jobCardFoot: { padding: ".75rem 1.25rem 1.25rem", borderTop: "1px solid var(--border)", marginTop: "1rem" },
  appsPanel:   { borderTop: "1px solid var(--border)", padding: "1.25rem", background: "var(--slate-50)" },
  appCard:     { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" },
  coverLetterBox: { margin: ".5rem 0 0", padding: ".75rem", background: "var(--slate-50)", borderRadius: "var(--radius-sm)", borderLeft: "3px solid var(--primary-border)" },
  inlineForm:  { marginTop: ".75rem", padding: ".75rem", background: "var(--slate-100)", borderRadius: "var(--radius)" },
};
