import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const token = localStorage.getItem("token");
      const hasSession = sessionStorage.getItem("okm_session");

      if (token && !hasSession) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setUser(null);
        setLoading(false);
        return;
      }

      if (token) {
        try {
          sessionStorage.setItem("okm_session", "1");
        } catch (e) {}

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          const res = await axios.get(
            "https://ok-motor-backend.vercel.app/api/auth/me",
          );

          const fetchedUser = res.data?.data || res.data || null;
          setUser(fetchedUser);

          if (fetchedUser)
            localStorage.setItem("userData", JSON.stringify(fetchedUser));
        } catch (apiError) {
          console.log("Cannot verify user online, using cached login");

          const cachedUser = localStorage.getItem("userData");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser({ email: "offline-user" });
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);

      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "https://ok-motor-backend.vercel.app/api/auth/login",
        {
          email,
          password,
        },
      );
      const token = res.data?.token || res.data?.data?.token;
      const userData = res.data?.data || res.data || null;

      if (token) {
        localStorage.setItem("token", token);

        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          sessionStorage.setItem("okm_session", "1");
        } catch (e) {}
      }

      if (userData) {
        localStorage.setItem("userData", JSON.stringify(userData));
      }

      setUser(userData);
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    try {
      sessionStorage.removeItem("okm_session");
    } catch (e) {}

    try {
      delete axios.defaults.headers.common["Authorization"];
    } catch (e) {}
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
