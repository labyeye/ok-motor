import { createContext, useState, useEffect, useContext } from 'react';
import httpClient from '../utils/offlineHttpClient';

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
      const res = await httpClient.get('https://ok-motor-51l3.vercel.app/api/auth/me');
      setUser(res.data);
    } else {
      setUser(null); // Explicitly set user to null if no token
    }
  } catch (err) {
    console.error(err);
    
    // Check if we have cached user data
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        setUser({ ...userData, _offline: true });
        console.log('Using cached user data for offline mode');
      } catch (parseError) {
        console.error('Failed to parse cached user data:', parseError);
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      localStorage.removeItem('token'); // Clear invalid token
      setUser(null); // Explicitly set user to null on error
    }
  } finally {
    setLoading(false);
  }
};

  const login = async (email, password) => {
    try {
      const res = await httpClient.post('https://ok-motor-51l3.vercel.app/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      // Cache user data for offline use after restart
      try {
        localStorage.setItem('cachedUser', JSON.stringify(res.data));
      } catch (err) {
        console.warn('Failed to store cachedUser for offline use:', err);
      }
      setUser(res.data);
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cachedUser');
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