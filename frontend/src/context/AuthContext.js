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

      // If a token exists but there's no sessionStorage flag, the previous tab was closed.
      // In that case, treat the user as logged out (do not keep token across closed tabs).
      if (token && !hasSession) {
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        setUser(null);
        setLoading(false);
        return;
      }

      if (token) {
        // mark this tab/session as active
        try {
          sessionStorage.setItem("okm_session", "1");
        } catch (e) {
          /* ignore */
        }
        // Set default Authorization header for axios so all requests include the token
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          const res = await axios.get(
            "https://ok-motor-51l3.vercel.app/api/auth/me",
          );
          // server may return user inside data or data.data depending on implementation
          const fetchedUser = res.data?.data || res.data || null;
          setUser(fetchedUser);
          // ensure cached user is present for offline
          if (fetchedUser)
            localStorage.setItem("userData", JSON.stringify(fetchedUser));
        } catch (apiError) {
          // If API call fails (offline or server error), keep user logged in with cached data
          console.log("Cannot verify user online, using cached login");

          // Try to get cached user data from localStorage
          const cachedUser = localStorage.getItem("userData");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            // No cached data, but keep token for when they go online
            setUser({ email: "offline-user" }); // Placeholder user
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      // Don't remove token on error - only on explicit logout
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "https://ok-motor-51l3.vercel.app/api/auth/login",
        {
          email,
          password,
        },
      );
      const token = res.data?.token || res.data?.data?.token;
      const userData = res.data?.data || res.data || null;

      if (token) {
        localStorage.setItem("token", token);
        // set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        try {
          sessionStorage.setItem("okm_session", "1");
        } catch (e) {
          /* ignore */
        }
      }

      // Cache user data for offline use
      if (userData) {
        localStorage.setItem("userData", JSON.stringify(userData));
      }

      // set user from response (handle different response shapes)
      setUser(userData);
      return res.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData"); // Fixed: was 'cachedUser', now matches 'userData'
    try {
      sessionStorage.removeItem("okm_session");
    } catch (e) {
      /* ignore */
    }
    // remove default header so subsequent requests are unauthenticated
    try {
      delete axios.defaults.headers.common["Authorization"];
    } catch (e) {
      /* ignore */
    }
    setUser(null);
  };

  // Note: we rely on sessionStorage (`okm_session`) to detect closed tabs.
  // sessionStorage persists across reloads but is cleared when the tab/window is closed.
  // Therefore we don't perform synchronous cleanup on unload (which triggers on refresh too).

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
