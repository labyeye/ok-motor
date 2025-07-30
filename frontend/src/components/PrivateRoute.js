import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, isOffline } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow access if user is authenticated, even if offline with cached data
  if (user._cached || user._offline) {
    console.log("Allowing offline access with cached user data");
  }

  if (roles && !roles.includes(user.role)) {
    // If offline and user doesn't have the right role, still show a message instead of redirect
    if (isOffline) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "8px",
            margin: "20px",
          }}
        >
          <h3>⚠️ Limited Access (Offline)</h3>
          <p>
            You're currently offline and this section requires{" "}
            {roles.join(" or ")} access.
          </p>
          <p>Please connect to the internet to verify your permissions.</p>
        </div>
      );
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
