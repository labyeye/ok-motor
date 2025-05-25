import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import StaffPage from "./pages/StaffPage";
import BuyLetterForm from "./components/BuyLetterPDF";
import SellLetterForm from "./components/SellLetterPDF";
import BuyLetterHistory from "./components/BuyLetterHistory";
import SellLetterHistory from "./components/SellLetterHistory";
import ServiceBillForm from "./components/ServiceBillForm";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LoginPage />} />

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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
