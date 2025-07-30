import { createContext, useState, useEffect, useContext } from "react";
import httpClient from "../utils/offlineHttpClient";
import swManager from "../utils/serviceWorkerManager";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    checkUserLoggedIn();

    // Listen for network status changes
    const handleNetworkChange = ({ type, isOnline }) => {
      setIsOffline(!isOnline);

      // When back online, refresh user data if we have cached data
      if (type === "ONLINE") {
        const currentUser = JSON.parse(
          localStorage.getItem("cachedUser") || "null"
        );
        if (currentUser?._cached) {
          console.log("Refreshing user data after coming back online");
          checkUserLoggedIn();
        }
      }
    };

    swManager.addCallback(handleNetworkChange);

    return () => {
      swManager.removeCallback(handleNetworkChange);
    };
  }, []); // Remove user dependency to prevent infinite re-renders

  const checkUserLoggedIn = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // No token, clear everything and set loading false
        localStorage.removeItem("cachedUser");
        setUser(null);
        setLoading(false);
        return;
      }

      // If offline, immediately try cached data
      if (!navigator.onLine) {
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log("Using cached user data - offline mode");
            setUser({ ...userData, _cached: true, _offline: true });
            setLoading(false);
            return;
          } catch (parseError) {
            console.error("Error parsing cached user data:", parseError);
            localStorage.removeItem("cachedUser");
          }
        }

        // No cached data but have token - show offline message but don't logout
        console.log("No cached user data available offline");
        setLoading(false);
        return;
      }

      // Online - try to fetch fresh data
      try {
        const res = await httpClient.get("/api/auth/me");
        const userData = res.data;

        // Cache user data for offline use
        localStorage.setItem("cachedUser", JSON.stringify(userData));
        setUser(userData);
      } catch (fetchError) {
        console.error("Failed to fetch user data:", fetchError);

        // Network error - try cached data as fallback
        const cachedUser = localStorage.getItem("cachedUser");
        if (cachedUser) {
          try {
            const userData = JSON.parse(cachedUser);
            console.log("Using cached user data as fallback");
            setUser({ ...userData, _cached: true, _stale: true });
          } catch (parseError) {
            console.error("Error parsing cached user data:", parseError);
            localStorage.removeItem("cachedUser");
            // Don't clear user/token here - might be temporary network issue
          }
        }
      }
    } catch (err) {
      console.error("Auth check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await httpClient.post("/api/auth/login", { email, password });
      const userData = res.data;

      localStorage.setItem("token", userData.token);
      // Cache user data for offline access
      localStorage.setItem("cachedUser", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cachedUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOffline }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add this custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
