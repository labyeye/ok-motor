import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useContext(AuthContext);

  // If no user in context, but we have cached user data in localStorage, allow offline access.
  if (!user) {
    const cached = localStorage.getItem('cachedUser');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // attach a lightweight offline flag so downstream code can know
        parsed._offline = true;
        // NOTE: We don't set context here to avoid side effects; we simply permit access.
      } catch (e) {
        // invalid cached data -> redirect to login
        return <Navigate to="/login" replace />;
      }
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;