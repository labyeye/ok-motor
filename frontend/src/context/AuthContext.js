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
      const res = await axios.get('https://ok-motor-51l3.vercel.app/api/auth/me');
      // server may return user inside data or data.data depending on implementation
      setUser(res.data?.data || res.data || null);
    } else {
      setUser(null);
    }
  } catch (err) {
    console.error(err);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password) => {
    try {
      const res = await axios.post('https://ok-motor-51l3.vercel.app/api/auth/login', { email, password });
      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        // set axios default header
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }
      // set user from response (handle different response shapes)
      setUser(res.data?.data || res.data || null);
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cachedUser');
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