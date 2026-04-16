import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const PROF_COLOR = { beginner: "badge-gray", intermediate: "badge-blue", advanced: "badge-green" };

export default function SkillTracker() {
  const { token } = useAuth();
  const toast = useToast();
  const [skills,      setSkills]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]     = useState(false);
  const [newSkill,    setNewSkill]     = useState("");
  const [proficiency, setProficiency] = useState("beginner");
  const [adding,      setAdding]       = useState(false);

  useEffect(() => { fetchSkills(); }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/skills", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSkills(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skillName: newSkill.trim(), proficiency }),
      });
      const data = await res.json();
      if (res.ok) { setNewSkill(""); setProficiency("beginner"); setShowForm(false); fetchSkills(); toast.success("Skill added!"); }
      else toast.error(data.message || "Failed to add skill");
    } catch { toast.error("Network error"); }
    finally { setAdding(false); }
  };

  const handleUpdate = async (skillId, updates) => {
    const res = await fetch(`/api/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    if (res.ok) fetchSkills();
    else toast.error("Failed to update skill");
  };

  const handleDelete = async (skillId) => {
    const res = await fetch(`/api/skills/${skillId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { setSkills(prev => prev.filter(s => s._id !== skillId)); toast.success("Skill removed"); }
    else toast.error("Failed to delete skill");
  };

  const completedCount = skills.filter(s => s.isCompleted).length;

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          {skills.length > 0 && (
            <p style={{ margin: ".2rem 0 0", fontSize: ".85rem", color: "var(--text-muted)" }}>
              {completedCount} of {skills.length} completed
            </p>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(v => !v); }}>
          {showForm ? "Cancel" : "+ Add Skill"}
        </button>
      </div>

      {/* Progress bar */}
      {skills.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(completedCount / skills.length) * 100}%`, background: "var(--success)", transition: "width .6s ease" }} />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="anim-slide-down" style={s.addForm}>
          <div className="grid-2">
            <div className="field">
              <label className="label">Skill Name</label>
              <input className="input" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. React, Python, SQL" required autoFocus />
            </div>
            <div className="field">
              <label className="label">Proficiency</label>
              <select className="select" value={proficiency} onChange={e => setProficiency(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={adding} className="btn btn-primary btn-sm" style={{ marginTop: ".75rem" }}>
            {adding ? <><span className="spinner" style={{ width: 14, height: 14 }} />Adding…</> : "Add Skill"}
          </button>
        </form>
      )}

      {/* Skill list */}
      {loading ? (
        <div style={{ display: "grid", gap: ".5rem" }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: "var(--radius)" }} />)}
        </div>
      ) : skills.length === 0 ? (
        <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
          <div className="empty-state-icon">🛠</div>
          <h3>No skills tracked yet</h3>
          <p>Add skills to showcase your expertise and get better job recommendations</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: ".6rem" }} className="stagger">
          {skills.map(skill => (
            <div key={skill._id} className="anim-slide-up" style={{ ...s.skillRow, opacity: skill.isCompleted ? .8 : 1 }}>
              <div style={{ flex: 1, display: "flex", align: "center", gap: ".75rem", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontWeight: 500, fontSize: ".9rem" }}>{skill.skillName}</span>
                <span className={`badge ${PROF_COLOR[skill.proficiency] || "badge-gray"}`}>{skill.proficiency}</span>
                {skill.isCompleted && <span className="badge badge-green">✓ Completed</span>}
                {skill.testScore !== undefined && <span className="badge badge-blue">Score: {skill.testScore}%</span>}
              </div>
              <div style={s.controls}>
                <select
                  className="select"
                  value={skill.proficiency}
                  onChange={e => handleUpdate(skill._id, { proficiency: e.target.value })}
                  style={{ width: "auto", fontSize: ".8rem", padding: ".25rem .5rem" }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button
                  className={`btn btn-sm ${skill.isCompleted ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => handleUpdate(skill._id, { isCompleted: !skill.isCompleted })}
                >
                  {skill.isCompleted ? "Undo" : "Mark Done"}
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(skill._id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: { display: "flex", flexDirection: "column", gap: "1rem" },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  addForm:   { padding: "1rem", background: "var(--slate-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", marginBottom: ".5rem" },
  skillRow:  { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: ".75rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", transition: "box-shadow var(--t-slow)" },
  controls:  { display: "flex", gap: ".4rem", alignItems: "center", flexShrink: 0 },
};
