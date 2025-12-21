import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  
const checkUserLoggedIn = async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Set default Authorization header for axios so all requests include the token
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      try {
        const res = await axios.get('http://localhost:3500/api/auth/me');
        // server may return user inside data or data.data depending on implementation
        setUser(res.data?.data || res.data || null);
      } catch (apiError) {
        // If API call fails (offline or server error), keep user logged in with cached data
        console.log('Cannot verify user online, using cached login');
        
        // Try to get cached user data from localStorage
        const cachedUser = localStorage.getItem('userData');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        } else {
          // No cached data, but keep token for when they go online
          setUser({ email: 'offline-user' }); // Placeholder user
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
      const res = await axios.post('http://localhost:3500/api/auth/login', { email, password });
      const token = res.data?.token || res.data?.data?.token;
      const userData = res.data?.data || res.data || null;
      
      if (token) {
        localStorage.setItem('token', token);
        // set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      
      // Cache user data for offline use
      if (userData) {
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // set user from response (handle different response shapes)
      setUser(userData);
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData'); // Fixed: was 'cachedUser', now matches 'userData'
    // remove default header so subsequent requests are unauthenticated
    try {
      delete axios.defaults.headers.common["Authorization"];
    } catch (e) {
      /* ignore */
    }
    setUser(null);
  };

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