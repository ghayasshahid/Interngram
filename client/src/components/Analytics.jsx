import { useMemo } from "react";

const STATS = [
  { key: "total",     label: "Total Applied",  color: "var(--slate-900)", bg: "var(--slate-50)"   },
  { key: "pending",   label: "Pending",        color: "var(--slate-500)", bg: "var(--slate-100)"  },
  { key: "reviewing", label: "Under Review",   color: "var(--primary)",   bg: "var(--primary-light)" },
  { key: "interview", label: "Interview",      color: "var(--warning)",   bg: "var(--warning-light)" },
  { key: "offer",     label: "Offer Received", color: "var(--purple)",    bg: "var(--purple-light)"  },
  { key: "accepted",  label: "Accepted",       color: "var(--success)",   bg: "var(--success-light)" },
  { key: "rejected",  label: "Rejected",       color: "var(--danger)",    bg: "var(--danger-light)"  },
  { key: "rate",      label: "Success Rate",   color: "var(--slate-900)", bg: "var(--slate-50)", isRate: true },
];

export default function Analytics({ applications = [] }) {
  const stats = useMemo(() => {
    const n = applications.length;
    const count = (s) => applications.filter(a => a.status === s).length;
    const accepted = count("accepted");
    return {
      total:     n,
      pending:   count("pending"),
      reviewing: count("reviewing"),
      interview: count("interview_scheduled"),
      offer:     count("offer_received"),
      accepted,
      rejected:  count("rejected"),
      rate:      n > 0 ? Math.round((accepted / n) * 100) : 0,
    };
  }, [applications]);

  return (
    <div>
      <div style={s.grid} className="stagger">
        {STATS.map(({ key, label, color, bg, isRate }) => (
          <div key={key} className="stat-card anim-slide-up" style={{ background: bg, borderColor: "transparent" }}>
            <p className="stat-value" style={{ color }}>{isRate ? `${stats[key]}%` : stats[key]}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>
      {applications.length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
            <span className="text-sm text-muted">Application progress</span>
            <span className="text-sm text-muted">{stats.accepted + stats.offer} advanced</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${stats.total > 0 ? ((stats.accepted + stats.offer) / stats.total) * 100 : 0}%`, background: "var(--success)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: ".75rem" },
};
