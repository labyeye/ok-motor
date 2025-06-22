import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token) {
        // Set authorization header immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Immediately set the user from localStorage while we verify
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
            // Set loading to false here so user doesn't see login page
            setLoading(false);
          } catch (e) {
            console.error('Error parsing saved user:', e);
            localStorage.removeItem('user');
          }
        }

        // Verify token in the background
        try {
          const res = await axios.get('https://ok-motor.onrender.com/api/auth/me');
          const userData = res.data.user || res.data;
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (err) {
          console.error('Token verification failed:', err);
          // Only logout if it's definitely an auth error
          if (err.response?.status === 401 || err.response?.status === 403) {
            performLogout();
          }
          // For other errors (network, etc.), keep the user logged in
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('https://ok-motor.onrender.com/api/auth/login', { 
        email, 
        password 
      });
      
      const token = res.data.token;
      const userData = res.data.user || res.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set state
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      return res.data;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  const performLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const logout = () => {
    performLogout();
  };

  // Function to check if user is really authenticated
  const verifyAuthentication = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      performLogout();
      return false;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await axios.get('https://ok-motor.onrender.com/api/auth/me');
      const userData = res.data.user || res.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return true;
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        performLogout();
        return false;
      }
      // For other errors, assume user is still authenticated
      return isAuthenticated;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated,
      login, 
      logout,
      checkUserLoggedIn,
      verifyAuthentication
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;