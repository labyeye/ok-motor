import { useState, useRef, useEffect } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import logo from "../images/company.png";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute

const AccessLockScreen = ({ onUnlock }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer when locked out
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setTimeLeft(0);
        setError("");
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil) return;

    const correctCode = process.env.REACT_APP_ACCESS_CODE;
    if (code === correctCode) {
      try { sessionStorage.setItem("okm_access", "1"); } catch (_) {}
      onUnlock();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setCode("");
      triggerShake();

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setError(`Too many wrong attempts. Locked for 60 seconds.`);
      } else {
        setError(`Incorrect access code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts !== 1 ? "s" : ""} remaining.`);
      }
    }
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={{ ...styles.card, ...(shake ? styles.shake : {}) }}>
        <img src={logo} alt="OK Motors" style={styles.logo} />

        <div style={styles.lockIconWrap}>
          {isLocked
            ? <ShieldAlert size={36} color="#ef4444" />
            : <Lock size={36} color="rgba(255,255,255,0.85)" />
          }
        </div>

        <p style={styles.title}>
          {isLocked ? "Access Locked" : "Enter Access Code"}
        </p>
        <p style={styles.subtitle}>
          {isLocked
            ? `Try again in ${timeLeft}s`
            : "This dashboard is protected. Enter your access code to continue."}
        </p>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorText}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            ref={inputRef}
            type="password"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="Access code"
            disabled={!!isLocked}
            autoComplete="off"
            style={{
              ...styles.input,
              ...(isLocked ? styles.inputDisabled : {}),
            }}
          />
          <button
            type="submit"
            disabled={!!isLocked || code.length === 0}
            style={{
              ...styles.button,
              ...((isLocked || code.length === 0) ? styles.buttonDisabled : {}),
            }}
          >
            {isLocked ? `Locked (${timeLeft}s)` : "Unlock"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes okm-shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-10px); }
          30%      { transform: translateX(10px); }
          45%      { transform: translateX(-8px); }
          60%      { transform: translateX(8px); }
          75%      { transform: translateX(-4px); }
          90%      { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: 'url("https://ik.imagekit.io/okmotors/dash.png")',
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "340px",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "1.25rem",
    padding: "2.5rem 2rem",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  shake: {
    animation: "okm-shake 0.6s ease",
  },
  logo: {
    width: "220px",
    height: "auto",
    marginBottom: "0.5rem",
  },
  lockIconWrap: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.25rem",
  },
  title: {
    color: "white",
    fontSize: "1.25rem",
    fontWeight: "700",
    margin: 0,
    textAlign: "center",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.8125rem",
    margin: 0,
    textAlign: "center",
    lineHeight: "1.5",
  },
  errorBox: {
    width: "100%",
    padding: "0.75rem 1rem",
    background: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: "0.625rem",
    marginTop: "0.25rem",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: "0.8125rem",
    fontWeight: "500",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
    marginTop: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "1rem",
    letterSpacing: "0.2em",
    textAlign: "center",
    border: "2px solid rgba(255,255,255,0.25)",
    borderRadius: "0.75rem",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  inputDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  button: {
    width: "100%",
    padding: "0.9rem",
    fontSize: "1rem",
    fontWeight: "600",
    border: "none",
    borderRadius: "0.75rem",
    background: "linear-gradient(135deg, rgba(7,25,82,0.9), rgba(8,131,149,0.9))",
    color: "white",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

export default AccessLockScreen;
