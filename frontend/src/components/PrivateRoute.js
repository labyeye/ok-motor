import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (process.env.NODE_ENV === "development") {
    console.log("PrivateRoute Debug:", { user, loading, roles });
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            border: "5px solid #e5e7eb",
            borderTop: "5px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  let effectiveUser = user;
  if (!effectiveUser) {
    const cached = localStorage.getItem("cachedUser");
    if (cached) {
      try {
        const parsedUser = JSON.parse(cached);
        if (parsedUser) {
          effectiveUser = parsedUser;
          effectiveUser._offline = true;
        } else {
          return <Navigate to="/login" replace />;
        }
      } catch (e) {
        return <Navigate to="/login" replace />;
      }
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  if (
    roles &&
    (!effectiveUser ||
      !effectiveUser?.role ||
      !roles.includes(effectiveUser?.role))
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
