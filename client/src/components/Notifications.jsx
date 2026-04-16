import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const TYPE_ICON = {
  application_update: "📋",
  new_internship:     "💼",
  default:            "🔔",
};

export default function Notifications({ onUnreadChange }) {
  const { token } = useAuth();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setNotifs(data);
        onUnreadChange?.(data.filter(n => !n.isRead).length);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const markRead = async (notifId) => {
    await fetch(`/api/notifications/${notifId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifs(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    onUnreadChange?.(notifs.filter(n => !n.isRead && n._id !== notifId).length);
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <strong>Notifications</strong>
        {unread > 0 && <span className="badge badge-blue">{unread} new</span>}
      </div>
      <div style={s.list}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={s.item}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ height: 12, width: "70%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--text-muted)", fontSize: ".875rem" }}>
            No notifications yet
          </div>
        ) : (
          notifs.map(n => (
            <button key={n._id} onClick={() => markRead(n._id)}
              style={{ ...s.item, background: n.isRead ? "transparent" : "var(--primary-light)", textAlign: "left", border: "none", cursor: "pointer", width: "100%" }}>
              <div style={s.icon}>{TYPE_ICON[n.type] || TYPE_ICON.default}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: n.isRead ? 400 : 600, fontSize: ".875rem", lineHeight: 1.4 }}>{n.title}</p>
                <p style={{ margin: ".2rem 0 0", fontSize: ".8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{n.message}</p>
                <p style={{ margin: ".3rem 0 0", fontSize: ".75rem", color: "var(--text-subtle)" }}>
                  {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              {!n.isRead && <span style={s.dot} />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const s = {
  panel:  { background: "var(--surface)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".75rem 1rem", borderBottom: "1px solid var(--border)" },
  list:   { maxHeight: "360px", overflowY: "auto" },
  item:   { display: "flex", gap: ".75rem", padding: ".75rem 1rem", alignItems: "flex-start", borderBottom: "1px solid var(--border)", transition: "background var(--t-base)" },
  icon:   { width: 36, height: 36, borderRadius: "50%", background: "var(--slate-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 },
  dot:    { width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: 6 },
};
