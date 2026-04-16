import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";

function PrivateRoute({ children, requiredType }) {
  const { token, userType } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (requiredType && userType !== requiredType) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/student/dashboard"
            element={
              <PrivateRoute requiredType="student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/dashboard"
            element={
              <PrivateRoute requiredType="company">
                <CompanyDashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
