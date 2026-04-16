import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, userType } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect to appropriate dashboard if logged in
      if (userType === "company") {
        navigate("/company/dashboard");
      } else if (userType === "student") {
        navigate("/student/dashboard");
      }
    } else {
      // Redirect to login if not logged in
      navigate("/login");
    }
  }, [user, userType, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Internship Portal</h1>
      <p>Loading...</p>
    </div>
  );
}

export default Home;
