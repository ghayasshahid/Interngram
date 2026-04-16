import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function StudentProfile() {
  const { token, user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    major: "",
    skills: "",
    location: "",
    duration: "",
    stipend: ""
  });

  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* PREFILL FROM AUTH CONTEXT */
  useEffect(() => {
    if (user) {
      setProfile({
        major: user.major || "",
        skills: user.skills?.join(", ") || "",
        location: user.preferences?.location || "",
        duration: user.preferences?.duration || "",
        stipend: user.preferences?.stipend || ""
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        "/api/student/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            major: profile.major,
            skills: profile.skills
              .split(",")
              .map(s => s.trim())
              .filter(Boolean),
            preferences: {
              location: profile.location,
              duration: profile.duration,
              stipend: profile.stipend
            }
          }),
        }
      );

      const updatedStudent = await res.json();

      if (!res.ok) {
        throw new Error(updatedStudent.message || "Update failed");
      }

      updateUser(updatedStudent);
      setSaved(true);
      setShowForm(false);

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  /* VIEW MODE */
  if (!showForm) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <h2>My Profile</h2>
          <button style={styles.primaryBtn} onClick={() => setShowForm(true)}>
            Edit Profile
          </button>
        </div>

        {saved && <p style={{ color: "green" }}>Profile updated successfully</p>}

        <p><strong>Major:</strong> {profile.major || "—"}</p>
        <p><strong>Skills:</strong> {profile.skills || "—"}</p>
        <p><strong>Preferred Location:</strong> {profile.location || "—"}</p>
        <p><strong>Duration:</strong> {profile.duration || "—"}</p>
        <p><strong>Stipend:</strong> {profile.stipend || "—"}</p>
      </div>
    );
  }

  /* EDIT MODE */
  return (
    <div style={styles.card}>
      <h2>Edit Profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {["major", "skills", "location", "duration", "stipend"].map((field) => (
          <div key={field} style={{ marginBottom: "1rem" }}>
            <label style={styles.label}>{field.toUpperCase()}</label>
            <input
              value={profile[field]}
              onChange={(e) =>
                setProfile({ ...profile, [field]: e.target.value })
              }
              style={styles.input}
            />
          </div>
        ))}

        <button type="submit" style={styles.primaryBtn}>Save</button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          style={styles.secondaryBtn}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    padding: "1.5rem",
    border: "1px solid #000",
    marginBottom: "2rem"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: {
    display: "block",
    marginBottom: "0.3rem"
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #000"
  },
  primaryBtn: {
    padding: "0.5rem 1rem",
    background: "#000",
    color: "#fff",
    border: "none",
    marginRight: "0.5rem",
    cursor: "pointer"
  },
  secondaryBtn: {
    padding: "0.5rem 1rem",
    background: "#ccc",
    border: "none",
    cursor: "pointer"
  }
};

export default StudentProfile;
