import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Recommendations  from "../components/Recommendations";
import ApplicationStatus from "../components/ApplicationStatus";
import Notifications     from "../components/Notifications";
import Analytics         from "../components/Analytics";
import StudentProfile    from "../components/StudentProfile";
import SkillTracker      from "../components/SkillTracker";

const TABS = [
  { id: "overview",     label: "Overview",        icon: "📊" },
  { id: "browse",       label: "Browse Jobs",     icon: "🔍" },
  { id: "applications", label: "My Applications", icon: "📋" },
  { id: "recommended",  label: "Recommended",     icon: "✨" },
  { id: "skills",       label: "Skills",          icon: "🛠" },
  { id: "profile",      label: "Profile",         icon: "👤" },
];

export default function StudentDashboard() {
  const { user, token, userType, logout } = useAuth();
  const toast   = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]       = useState("overview");
  const [jobs, setJobs]                 = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch]             = useState("");
  const [filterLoc, setFilterLoc]       = useState("");
  const [showNotifs, setShowNotifs]     = useState(false);
  const [unreadCount, setUnreadCount]   = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!token || userType !== "student") { navigate("/login"); return; }
    fetchJobs();
    fetchApplications();
  }, [token, userType]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs?limit=50");
      if (res.ok) { const d = await res.json(); setJobs(d.jobs ?? d); }
    } catch { /* silent */ }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/student/applications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setApplications(await res.json());
    } catch { /* silent */ }
  };

  const handleLogout = () => { logout(); toast.info("Signed out."); navigate("/login"); };

  const filteredJobs = jobs.filter(job => {
    const kw = search.toLowerCase();
    const matchSearch = !kw || job.title?.toLowerCase().includes(kw) || job.company?.toLowerCase().includes(kw) || job.companyId?.companyName?.toLowerCase().includes(kw);
    const matchLoc = !filterLoc || job.location?.toLowerCase().includes(filterLoc.toLowerCase());
    return matchSearch && matchLoc;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── STICKY HEADER ── */}
      <header className="app-header">
        <div className="app-header-brand">
          <span>🎓</span>
          <span>InternPortal</span>
          <span className="brand-dot" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Notifications bell */}
          <div ref={notifRef} className="relative">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setShowNotifs(v => !v)}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="notif-dot" />}
            </button>
            {showNotifs && (
              <div style={styles.notifDropdown} className="anim-slide-down">
                <Notifications onUnreadChange={setUnreadCount} />
              </div>
            )}
          </div>
          <div style={styles.userChip}>
            <span style={styles.avatar}>{user?.name?.[0]?.toUpperCase() || "S"}</span>
            <span style={{ fontSize: ".875rem", fontWeight: 500 }}>{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">Sign out</button>
        </div>
      </header>

      {/* ── TABS ── */}
      <div style={{ background: "var(--surface)", borderBottom: "2px solid var(--border)", overflowX: "auto" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem" }}>
          <div className="tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab${activeTab === t.id ? " active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon} {t.label}
                {t.id === "applications" && applications.length > 0 && (
                  <span style={styles.tabBadge}>{applications.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="anim-slide-up">
            <div style={{ marginBottom: "1.75rem" }}>
              <h2>Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>Here's what's happening with your applications</p>
            </div>
            <Analytics applications={applications} />
            <div style={{ marginTop: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3>Recent Applications</h3>
                {applications.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab("applications")}>View all →</button>
                )}
              </div>
              <ApplicationStatus applications={applications.slice(0, 3)} />
            </div>
          </div>
        )}

        {/* BROWSE JOBS */}
        {activeTab === "browse" && (
          <div className="anim-slide-up">
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>Browse Internships</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>
                {jobs.length} opportunities available
              </p>
            </div>

            {/* Search + filter bar */}
            <div style={styles.searchBar}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  className="input"
                  style={{ paddingLeft: "2.5rem" }}
                  placeholder="Search by title or company…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <input
                className="input"
                style={{ width: "200px" }}
                placeholder="Filter by location…"
                value={filterLoc}
                onChange={e => setFilterLoc(e.target.value)}
              />
              {(search || filterLoc) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setFilterLoc(""); }}>
                  Clear
                </button>
              )}
            </div>

            {jobs.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">💼</div><h3>No jobs available yet</h3><p>Check back soon — companies are posting internships</p></div>
            ) : filteredJobs.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">🔎</div><h3>No matches found</h3><p>Try adjusting your search terms</p></div>
            ) : (
              <div className="grid-auto stagger">
                {filteredJobs.map(job => (
                  <JobCard key={job._id} job={job} token={token} applications={applications} onApply={fetchApplications} toast={toast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="anim-slide-up">
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>My Applications</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>
                {applications.length} application{applications.length !== 1 ? "s" : ""} submitted
              </p>
            </div>
            {applications.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No applications yet</h3><p>Browse jobs and start applying!</p><button className="btn btn-primary" style={{ marginTop: ".5rem" }} onClick={() => setActiveTab("browse")}>Browse Jobs</button></div>
              : <ApplicationStatus applications={applications} />
            }
          </div>
        )}

        {/* RECOMMENDED */}
        {activeTab === "recommended" && (
          <div className="anim-slide-up">
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>Recommended for You</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>Based on your skills, major, and location preferences</p>
            </div>
            <Recommendations onApply={fetchApplications} applications={applications} />
          </div>
        )}

        {/* SKILLS */}
        {activeTab === "skills" && (
          <div className="anim-slide-up">
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>Skill Tracker</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>Track and showcase your technical skills</p>
            </div>
            <SkillTracker />
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="anim-slide-up" style={{ maxWidth: "640px" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h2>My Profile</h2>
              <p className="text-muted text-sm" style={{ marginTop: ".25rem" }}>Keep your profile up-to-date to get better recommendations</p>
            </div>
            <StudentProfile />
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── JOB CARD ─── */
function JobCard({ job, token, applications, onApply, toast }) {
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const hasApplied = applications.some(a => a.jobId?._id === job._id);

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job._id, coverLetter }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowForm(false);
        setCoverLetter("");
        onApply();
        toast.success("Application submitted!");
      } else {
        toast.error(data.message || "Failed to apply");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const companyName = job.company || job.companyId?.companyName || "Unknown Company";
  const desc = job.description || "";

  return (
    <div className="card card-hover anim-slide-up" style={styles.jobCard}>
      <div style={styles.jobCardTop}>
        <div style={styles.companyAvatar}>{companyName[0]?.toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ margin: 0, lineHeight: 1.3 }}>{job.title}</h4>
          <p style={{ margin: ".2rem 0 0", fontSize: ".85rem", color: "var(--text-muted)" }}>{companyName}</p>
        </div>
        {hasApplied && <span className="badge badge-green">Applied ✓</span>}
      </div>

      <div style={styles.jobMeta}>
        {job.location  && <span className="chip">📍 {job.location}</span>}
        {job.duration  && <span className="chip">⏱ {job.duration}</span>}
        {job.stipend   && <span className="chip">💰 {job.stipend}</span>}
        {job.deadline  && <span className="chip">📅 {new Date(job.deadline).toLocaleDateString()}</span>}
      </div>

      {job.requiredSkills?.length > 0 && (
        <div className="chip-list" style={{ marginTop: ".75rem" }}>
          {job.requiredSkills.map(sk => <span key={sk} className="chip chip-blue">{sk}</span>)}
        </div>
      )}

      <p style={{ margin: ".75rem 0 0", fontSize: ".875rem", color: "var(--slate-600)", lineHeight: 1.6 }}>
        {expanded ? desc : desc.substring(0, 120)}
        {desc.length > 120 && (
          <button onClick={() => setExpanded(v => !v)} style={styles.readMore}>
            {expanded ? " Show less" : "… Read more"}
          </button>
        )}
      </p>

      {!hasApplied && (
        <div style={{ marginTop: "1rem" }}>
          {!showForm ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>Apply Now</button>
          ) : (
            <form onSubmit={handleApply} className="anim-slide-down">
              <textarea
                className="textarea"
                rows="3"
                placeholder="Cover letter (optional)"
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                style={{ marginBottom: ".5rem" }}
              />
              <div style={{ display: "flex", gap: ".5rem" }}>
                <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
                  {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Submitting…</> : "Submit"}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  notifDropdown: { position: "absolute", top: "calc(100% + 8px)", right: 0, width: "360px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", zIndex: 200, overflow: "hidden" },
  userChip:   { display: "flex", alignItems: "center", gap: ".5rem", padding: ".25rem .75rem .25rem .25rem", background: "var(--slate-100)", borderRadius: "var(--radius-full)" },
  avatar:     { width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 700, flexShrink: 0 },
  tabBadge:   { marginLeft: ".4rem", padding: ".1rem .45rem", background: "var(--primary)", color: "#fff", borderRadius: "var(--radius-full)", fontSize: ".7rem", fontWeight: 700 },
  searchBar:  { display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" },
  searchIcon: { position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", fontSize: ".9rem", pointerEvents: "none" },
  jobCard:    { padding: "1.25rem", display: "flex", flexDirection: "column", gap: 0 },
  jobCardTop: { display: "flex", gap: ".75rem", alignItems: "flex-start", marginBottom: ".75rem" },
  companyAvatar: { width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--slate-900)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 },
  jobMeta:    { display: "flex", flexWrap: "wrap", gap: ".4rem" },
  readMore:   { background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: ".875rem", padding: 0, fontWeight: 500 },
};
