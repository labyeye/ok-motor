import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Bike } from "lucide-react";

const AuthForm = ({ isLogin }) => {
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "staff",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { email, password} = formData;

  useEffect(() => {
    if (user && !authLoading) {
      navigate(user.role === "admin" ? "/admin" : "/staff", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        console.log("Registration not implemented yet");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div>Loading...</div>;
  return (
    <div className="auth-container">
      <div className="auth-form-section">
        <div className="auth-content">
          <div className="auth-header">
            <div className="brand-logo">
              <Bike className="brand-icon" />
              <span className="brand-text">OK Motors</span>
            </div>
            <h1 className="auth-title">Welcome back</h1>
          </div>
          {error && (
            <div className="auth-error">
              <div className="error-content">{error}</div>
            </div>
          )}

          <div className="auth-form">
            <div
              className={`input-group ${
                focusedField === "email" ? "focused" : ""
              } ${email ? "filled" : ""}`}
            >
              <Mail className="input-icon" />
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
                className="form-input"
              />
              <label className="input-label">Email Address</label>
            </div>

            {/* Password Field */}
            <div
              className={`input-group ${
                focusedField === "password" ? "focused" : ""
              } ${password ? "filled" : ""}`}
            >
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={onChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
                minLength="6"
                className="form-input"
              />
              <label className="input-label">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={loading}
              className={`submit-button ${loading ? "loading" : ""}`}
            >
              <span className="button-text">
                {loading ? "Signing in..." : "Sign In"}
              </span>
              {!loading && <ArrowRight className="button-icon" />}
              {loading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              )}
            </button>
          </div>

          {/* Footer */}
        </div>
      </div>

      {/* Image Section */}
      <div className="auth-image-section">
        <div className="image-overlay">
          <div className="overlay-content">
            <h2 className="overlay-title">Start Your Ride</h2>
            <p className="overlay-text">
              Join thousands of riders in the ultimate biking experience
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex;
          min-height: 100vh;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-form-section {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          position: relative;
        }

        .auth-form-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.05) 100%
          );
          pointer-events: none;
        }

        .auth-content {
          width: 100%;
          max-width: 420px;
          z-index: 1;
          position: relative;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .brand-icon {
          width: 2.5rem;
          height: 2.5rem;
          color: #7c3aed;
        }

        .brand-text {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .auth-subtitle {
          color: #6b7280;
          font-size: 1rem;
          line-height: 1.5;
        }

        .auth-error {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          border: 1px solid #fecaca;
          border-radius: 0.75rem;
          animation: slideIn 0.3s ease-out;
        }

        .error-content {
          color: #dc2626;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .input-group {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .form-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          background: rgba(255, 255, 255, 0.95);
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
          transition: color 0.3s ease;
          z-index: 1;
        }

        .input-group.focused .input-icon,
        .input-group.filled .input-icon {
          color: #7c3aed;
        }

        .input-label {
          position: absolute;
          left: 3rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          background: transparent;
        }

        .input-group.focused .input-label,
        .input-group.filled .input-label {
          top: 0;
          left: 0.75rem;
          font-size: 0.75rem;
          color: #7c3aed;
          background: rgba(255, 255, 255, 0.9);
          padding: 0 0.5rem;
          border-radius: 0.25rem;
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.3s ease;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .password-toggle:hover {
          color: #7c3aed;
        }

        .submit-button {
          position: relative;
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          color: white;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          overflow: hidden;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .button-text {
          transition: transform 0.3s ease;
        }

        .button-icon {
          width: 1.25rem;
          height: 1.25rem;
          transition: transform 0.3s ease;
        }

        .submit-button:hover:not(:disabled) .button-icon {
          transform: translateX(4px);
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-footer {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .auth-link {
          color: #7c3aed;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .auth-link:hover {
          color: #5b21b6;
          text-decoration: underline;
        }

        .auth-image-section {
          flex: 1;
          background-image: url("https://cdn.bikedekho.com/processedimages/yamaha/mt-15-2-0/source/mt-15-2-06613f885e681c.jpg");
          background-size: cover;
          background-position: center;
          position: relative;
          display: none;
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.8),
            rgba(59, 130, 246, 0.6)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
        }

        .overlay-content {
          max-width: 400px;
          padding: 2rem;
        }

        .overlay-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: -0.025em;
        }

        .overlay-text {
          font-size: 1.125rem;
          line-height: 1.6;
          opacity: 0.9;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile Responsive */
        @media (min-width: 768px) {
          .auth-image-section {
            display: flex;
          }

          .auth-form-section {
            background: white;
          }

          .auth-form-section::before {
            display: none;
          }
        }

        @media (max-width: 767px) {
          .auth-container {
            flex-direction: column;
          }

          .auth-form-section {
            min-height: 100vh;
            padding: 1.5rem;
          }

          .auth-title {
            font-size: 1.75rem;
          }

          .overlay-title {
            font-size: 2rem;
          }

          .overlay-text {
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .auth-form-section {
            padding: 1rem;
          }

          .auth-content {
            max-width: 100%;
          }

          .form-input {
            padding: 0.875rem 0.875rem 0.875rem 2.5rem;
            font-size: 0.875rem;
          }

          .input-icon {
            left: 0.75rem;
            width: 1rem;
            height: 1rem;
          }

          .input-label {
            left: 2.5rem;
            font-size: 0.875rem;
          }

          .input-group.focused .input-label,
          .input-group.filled .input-label {
            font-size: 0.6875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
