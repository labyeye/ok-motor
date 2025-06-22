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
    
    // Set up tab close logout functionality
    setupTabCloseLogout();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Method 1: Logout when tab/browser is closed
  const handleBeforeUnload = (event) => {
    // This will logout when user closes tab/browser
    performLogout();
    
    // Optional: Show confirmation dialog (some browsers may ignore this)
    // event.preventDefault();
    // event.returnValue = 'Are you sure you want to leave? You will be logged out.';
  };

  // Method 2: Logout when tab becomes hidden (user switches tabs or minimizes)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden' && isAuthenticated) {
      // Optional: Add a delay before logout to avoid logging out when just switching tabs briefly
      setTimeout(() => {
        if (document.visibilityState === 'hidden') {
          performLogout();
        }
      }, 2000); // 2 second delay
    }
  };

  // Method 3: Use session storage instead of localStorage for auto-logout on tab close
  const setupTabCloseLogout = () => {
    // Option A: Use beforeunload event (logout immediately when closing)
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Option B: Use visibility change (logout when tab becomes hidden)
    // Uncomment the line below if you want to use this approach
    // window.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Option C: Use session storage check
    // This approach checks if the session is new or continued
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      // New session - generate a unique session ID
      const newSessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('sessionId', newSessionId);
    }
  };

  const checkUserLoggedIn = async () => {
    try {
      // Method 4: Check if we should use session-based auth
      const useSessionAuth = localStorage.getItem('useSessionAuth') === 'true';
      
      let token, savedUser;
      
      if (useSessionAuth) {
        // Use session storage - will logout when tab closes
        token = sessionStorage.getItem('token');
        savedUser = sessionStorage.getItem('user');
      } else {
        // Use local storage - persists across tab closes
        token = localStorage.getItem('token');
        savedUser = localStorage.getItem('user');
      }
      
      if (token) {
        // Set authorization header immediately
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Immediately set the user from storage while we verify
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
            // Set loading to false here so user doesn't see login page
            setLoading(false);
          } catch (e) {
            console.error('Error parsing saved user:', e);
            if (useSessionAuth) {
              sessionStorage.removeItem('user');
            } else {
              localStorage.removeItem('user');
            }
          }
        }

        // Verify token in the background
        try {
          const res = await axios.get('https://ok-motor.onrender.com/api/auth/me');
          const userData = res.data.user || res.data;
          setUser(userData);
          setIsAuthenticated(true);
          
          if (useSessionAuth) {
            sessionStorage.setItem('user', JSON.stringify(userData));
          } else {
            localStorage.setItem('user', JSON.stringify(userData));
          }
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

  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await axios.post('https://ok-motor.onrender.com/api/auth/login', { 
        email, 
        password 
      });
      
      const token = res.data.token;
      const userData = res.data.user || res.data;
      
      // Determine storage type based on rememberMe option
      const useSessionAuth = !rememberMe;
      
      if (useSessionAuth) {
        // Store in session storage - will logout when tab closes
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('useSessionAuth', 'true');
      } else {
        // Store in local storage - persists across tab closes
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('useSessionAuth', 'false');
      }
      
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
    // Clear both session and local storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionId');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('useSessionAuth');
    
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
    const useSessionAuth = localStorage.getItem('useSessionAuth') === 'true';
    const token = useSessionAuth ? 
      sessionStorage.getItem('token') : 
      localStorage.getItem('token');
      
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
      
      if (useSessionAuth) {
        sessionStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
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

  // Function to toggle between session and persistent auth
  const setRememberMe = (remember) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userData) {
      // Clear current storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Set in appropriate storage
      if (remember) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', userData);
        localStorage.setItem('useSessionAuth', 'false');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', userData);
        localStorage.setItem('useSessionAuth', 'true');
      }
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
      verifyAuthentication,
      setRememberMe
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