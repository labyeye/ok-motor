import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import BuyLetterForm from "./components/BuyLetterPDF";
import SellLetterForm from "./components/SellLetterPDF";
import BuyLetterHistory from "./components/BuyLetterHistory";
import SellLetterHistory from "./components/SellLetterHistory";
import ServiceBillForm from "./components/ServiceBillForm";
import BikeHistory from "./components/BikeHistory";
import CreateStaff from "./components/CreateStaff";
import StaffList from "./components/StaffList";
import ServiceHistory from "./components/ServiceHistory";
import AdvancePayBillForm from "./components/AdvancePayBillForm";
import AdvanceHistory from "./components/AdvanceHistory";
import { useState,useEffect } from "react";

const RootRedirect = () => {
  const { user, loading } = useAuth();

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

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, redirect based on role
  const redirectPath = user.role === "admin" ? "/admin" : "/staff";
  return <Navigate to={redirectPath} replace />;
};

function App() {
   const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return (
    <AuthProvider>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          padding: "8px 16px",
          background: isOnline ? "#4caf50" : "#f44336",
          color: "#fff",
          zIndex: 1000,
          borderRadius: "0 0 0 8px",
          fontWeight: "bold",
        }}
      >
        {isOnline ? "Online" : "Offline"}
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={["admin"]}>
                <AdminPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <StaffPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/buy/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <BuyLetterForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <SellLetterForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/buy/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <BuyLetterHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/sell/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <SellLetterHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/service/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <ServiceBillForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/bike-history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <BikeHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <CreateStaff />
              </PrivateRoute>
            }
          />
          <Route
            path="/staff/list"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <StaffList />
              </PrivateRoute>
            }
          />
          <Route
            path="/service/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <ServiceHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/advance/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <AdvancePayBillForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/advance/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <AdvanceHistory />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
