import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userType, setUserType] = useState(localStorage.getItem("userType"));

  useEffect(() => {
    if (token) {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, [token]);

  const login = (token, user, type) => {
    setToken(token);
    setUser(user);
    setUserType(type);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("userType", type);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserType(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userType");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, userType, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
