const STATUS_MAP = {
  pending:             { label: "Applied",            badgeCls: "badge-gray",   progress: 20 },
  reviewing:           { label: "Under Review",       badgeCls: "badge-blue",   progress: 40 },
  interview_scheduled: { label: "Interview Scheduled",badgeCls: "badge-yellow", progress: 60 },
  offer_received:      { label: "Offer Received",     badgeCls: "badge-purple", progress: 80 },
  accepted:            { label: "Accepted",           badgeCls: "badge-green",  progress: 100 },
  rejected:            { label: "Rejected",           badgeCls: "badge-red",    progress: 0  },
};

const PROGRESS_COLORS = {
  pending:             "var(--slate-400)",
  reviewing:           "var(--primary)",
  interview_scheduled: "var(--warning)",
  offer_received:      "var(--purple)",
  accepted:            "var(--success)",
  rejected:            "var(--danger)",
};

const ORDER = ["pending", "reviewing", "interview_scheduled", "offer_received", "accepted", "rejected"];

export default function ApplicationStatus({ applications = [] }) {
  const sorted = [...applications].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No applications yet</h3>
        <p>Start applying to internships to track your progress here</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: ".75rem" }} className="stagger">
      {sorted.map(app => {
        const meta     = STATUS_MAP[app.status] || { label: app.status, badgeCls: "badge-gray", progress: 0 };
        const progress = meta.progress;
        const color    = PROGRESS_COLORS[app.status] || "var(--slate-400)";
        const company  = app.jobId?.company || app.jobId?.companyId?.companyName || "—";
        const date     = app.createdAt || app.appliedAt;

        return (
          <div key={app._id} className="card card-hover anim-slide-up" style={s.card}>
            <div style={s.top}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, lineHeight: 1.3 }}>{app.jobId?.title || "Untitled Role"}</h4>
                <p style={{ margin: ".2rem 0 0", fontSize: ".85rem", color: "var(--text-muted)" }}>{company}</p>
              </div>
              <span className={`badge ${meta.badgeCls}`}>{meta.label}</span>
            </div>

            {/* Progress bar */}
            {app.status !== "rejected" ? (
              <div style={{ margin: ".9rem 0 .5rem" }}>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: color }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: ".35rem" }}>
                  {["Applied", "Review", "Interview", "Offer", "Accepted"].map((step, i) => (
                    <span key={step} style={{ fontSize: ".7rem", color: progress >= (i + 1) * 20 ? color : "var(--slate-300)", fontWeight: progress >= (i + 1) * 20 ? 600 : 400 }}>{step}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ margin: ".75rem 0", padding: ".5rem .75rem", background: "var(--danger-light)", borderRadius: "var(--radius-sm)", fontSize: ".85rem", color: "var(--danger)" }}>
                Application was not selected this time
              </div>
            )}

            <div style={s.meta}>
              {date && <span className="text-xs text-muted">Applied {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              {app.interviewDate && (
                <span style={s.metaChip}>📅 Interview: {new Date(app.interviewDate).toLocaleDateString()}</span>
              )}
              {app.offerDetails && (
                <span style={{ ...s.metaChip, background: "var(--purple-light)", color: "var(--purple)" }}>🎁 {app.offerDetails}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  card:     { padding: "1.25rem" },
  top:      { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: ".75rem" },
  meta:     { display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" },
  metaChip: { display: "inline-flex", alignItems: "center", gap: ".3rem", padding: ".2rem .6rem", background: "var(--warning-light)", color: "var(--warning)", borderRadius: "var(--radius-full)", fontSize: ".78rem", fontWeight: 500 },
};
