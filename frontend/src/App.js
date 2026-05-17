import {
  HashRouter as Router,
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
import SellRequests from "./components/SellRequests";
import UpdatesList from "./components/UpdatesList";
import CreateUpdate from "./components/CreateUpdate";
import BuyLetterHistory from "./components/BuyLetterHistory";
import SellLetterHistory from "./components/SellLetterHistory";
import ServiceBillForm from "./components/ServiceBillForm";
import BikeHistory from "./components/BikeHistory";
import CreateStaff from "./components/CreateStaff";
import StaffList from "./components/StaffList";
import ServiceHistory from "./components/ServiceHistory";
import AdvancePayBillForm from "./components/AdvancePayBillForm";
import AdvanceHistory from "./components/AdvanceHistory";
import SettingsPage from "./pages/SettingsPage";
import AnnouncementPage from "./pages/AnnouncementPage";
import VehicleCreate from "./components/VehicleCreate";
import VehicleHistory from "./components/VehicleHistory";
import GalleryManagement from "./components/GalleryManagement";
import LetterHeadForm from "./components/LetterHeadForm";
import InsuranceForm from "./components/InsuranceForm";
import InsuranceHistory from "./components/InsuranceHistory";
import PUCForm from "./components/PUCForm";
import PUCHistory from "./components/PUCHistory";
import { useState, useEffect } from "react";
import networkService from "./services/networkService";
import "./services/syncService";
import AccessLockScreen from "./components/AccessLockScreen";

const Rootredirect = () => {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const redirectPath = user?.role === "admin" ? "/admin" : "/staff";
  return <Navigate to={redirectPath} replace />;
};

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUnlocked, setIsUnlocked] = useState(
    () => sessionStorage.getItem("okm_access") === "1",
  );

  useEffect(() => {
    const isElectron = window.electronAPI !== undefined;

    if (isElectron) {
      console.log("🚀 Initializing offline services in Electron...");

      networkService.checkConnection();

      const unsubscribeNetwork = networkService.subscribe((online) => {
        console.log(
          `📡 Network status changed: ${online ? "Online" : "Offline"}`,
        );
        setIsOnline(online);
      });

      console.log("✅ Offline services initialized successfully!");

      return () => {
        unsubscribeNetwork();
      };
    } else {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (!isUnlocked) {
    return <AccessLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <AuthProvider>
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          padding: "8px 16px",
          background: isOnline ? "#4caf50" : "#f44336",
          color: "#fff",
          zIndex: 1000,
          borderRadius: "8px 8px 8px 8px",
          fontWeight: "bold",
        }}
      >
        {isOnline ? "Online" : "Offline"}
      </div>
      <Router>
        <Routes>
          <Route path="/" element={<Rootredirect />} />
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
            path="/sell/requests"
            element={
              <PrivateRoute roles={["admin"]}>
                <SellRequests />
              </PrivateRoute>
            }
          />
          <Route
            path="/updates"
            element={
              <PrivateRoute roles={["admin"]}>
                <UpdatesList />
              </PrivateRoute>
            }
          />
          <Route
            path="/updates/create"
            element={
              <PrivateRoute roles={["admin"]}>
                <CreateUpdate />
              </PrivateRoute>
            }
          />
          <Route
            path="/updates/edit/:id"
            element={
              <PrivateRoute roles={["admin"]}>
                <CreateUpdate />
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
            path="/advance-pay-bill/:id"
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
          <Route
            path="/letter-head/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <LetterHeadForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/insurance/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <InsuranceForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/insurance/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <InsuranceHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/puc/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <PUCForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/puc/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <PUCHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <AnnouncementPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/gallery/manage"
            element={
              <PrivateRoute roles={["admin"]}>
                <GalleryManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicle/create"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <VehicleCreate />
              </PrivateRoute>
            }
          />
          <Route
            path="/vehicle/history"
            element={
              <PrivateRoute roles={["admin", "staff"]}>
                <VehicleHistory />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
