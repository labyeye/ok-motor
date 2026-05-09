# OK Motor Dashboard — Security Audit & Vulnerability Report

> Generated: 2026-04-29  
> Scope: `backend/`, `frontend/`, `website/`  
> Stack: Node.js / Express, React 19, MongoDB (Mongoose), JWT, Electron

---

## Summary Table

| #   | Vulnerability                                                         | Severity    | Location                                      | Status |
| --- | --------------------------------------------------------------------- | ----------- | --------------------------------------------- | ------ |
| 1   | Secrets committed to `.env` files (DB password, JWT secret, API keys) | 🔴 CRITICAL | `backend/.env`                                | Open   |
| 2   | Weak JWT secret                                                       | 🔴 CRITICAL | `backend/.env`                                | Open   |
| 3   | No rate limiting on login endpoint                                    | 🔴 CRITICAL | `backend/routes/authRoutes.js`                | Open   |
| 4   | User enumeration via distinct error messages                          | 🟠 HIGH     | `backend/controllers/authController.js:11,23` | Open   |
| 5   | JWT stored in `localStorage` (XSS-accessible)                         | 🟠 HIGH     | `frontend/src/context/AuthContext.js:16`      | Open   |
| 6   | 30-day JWT expiry with no refresh/revocation                          | 🟠 HIGH     | `backend/controllers/authController.js:61`    | Open   |
| 7   | Unauthenticated `/debug` endpoint exposes server info                 | 🟠 HIGH     | `backend/routes/serviceBillRoutes.js:6`       | Open   |
| 8   | 50 MB JSON body limit enables DoS                                     | 🟡 MEDIUM   | `backend/server.js:81-82`                     | Open   |
| 9   | No security headers (Helmet not used)                                 | 🟡 MEDIUM   | `backend/server.js`                           | Open   |
| 10  | CORS error leaks full allowed-origins list                            | 🟡 MEDIUM   | `backend/server.js:186-189`                   | Open   |
| 11  | No input validation / NoSQL injection risk                            | 🟡 MEDIUM   | All controllers                               | Open   |
| 12  | No account lockout after failed logins                                | 🟡 MEDIUM   | `backend/controllers/authController.js`       | Open   |
| 13  | Offline fallback sets fake "offline-user" object                      | 🟡 MEDIUM   | `frontend/src/context/AuthContext.js:59`      | Open   |
| 14  | Public registration toggle on login page                              | 🟡 MEDIUM   | `frontend/src/pages/LoginPage.js:19`          | Open   |
| 15  | Hardcoded production API URL in frontend source                       | 🟢 LOW      | `frontend/src/context/AuthContext.js:41,77`   | Open   |
| 16  | No password complexity requirement in backend                         | 🟢 LOW      | `backend/models/User.js`                      | Open   |
| 17  | Public `/api/sell-request` POST has no rate limiting                  | 🟢 LOW      | `backend/routes/sellRequestRoutes.js`         | Open   |
| 18  | Verbose 404 handler leaks route path                                  | 🟢 LOW      | `backend/server.js:171-177`                   | Open   |

---

## Detailed Findings & Solutions

---

### 🔴 CRITICAL-1 — Secrets committed to `.env` files

**File:** `backend/.env`

**What is exposed:**

```
MONGO_URI=mongodb+srv://okmotors7860:okmotors1234@...   ← full DB credentials
JWT_SECRET=fdsinaf327fdjk                               ← signing key
ADMIN_EMAIL=admin@example.com                           ← default admin account
ADMIN_PASSWORD=admin123                                  ← trivial password
IMAGEKIT_PRIVATE_KEY=private_j6F4qkkMp76+...           ← cloud storage key
```

**Risk:** Anyone with repository access (GitHub, git log) can authenticate to MongoDB directly, forge any JWT, or manage ImageKit storage.

**Solution:**

1. **Rotate all credentials immediately** — change DB password, regenerate JWT secret, cycle ImageKit keys.
2. Add `.env` to `.gitignore` and purge it from git history (`git filter-repo` or BFG Repo Cleaner).
3. Use a secrets manager (Vercel env vars, AWS Secrets Manager) — never commit secrets.
4. Use a strong random JWT secret: `openssl rand -hex 64`

---

### 🔴 CRITICAL-2 — Weak JWT Secret

**File:** `backend/.env` → `backend/controllers/authController.js:61`

**Current value:** `fdsinaf327fdjk` (14 chars, partially guessable)

**Risk:** An attacker who knows or brute-forces the secret can forge tokens for any user, including admin.

**Solution:**

```bash
# Generate a strong secret
openssl rand -hex 64
# e.g.: a3f8c...long...random...string
```

Set this in your environment and never hardcode it.

---

### 🔴 CRITICAL-3 — No Rate Limiting on Login Endpoint

**File:** `backend/routes/authRoutes.js`

**Risk:** An attacker can try unlimited password combinations against `POST /api/auth/login`. With a common password list, any account with a weak password will be compromised within minutes.

**Solution:** Install `express-rate-limit` and apply it to auth routes:

```js
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per window
  message: { message: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, loginUser);
```

---

### 🟠 HIGH-4 — User Enumeration via Distinct Error Messages

**File:** `backend/controllers/authController.js:11,23`

**Current code:**

```js
throw new Error("User not found"); // line 11 — reveals the email doesn't exist
throw new Error("Password is incorrect"); // line 23 — reveals email exists but password wrong
```

**Risk:** An attacker can use these different messages to build a list of valid email addresses registered in the system.

**Solution:** Return the **same** message for both cases:

```js
// Replace both with:
res.status(401);
throw new Error("Invalid email or password");
```

---

### 🟠 HIGH-5 — JWT Stored in `localStorage` (XSS-Accessible)

**File:** `frontend/src/context/AuthContext.js:16,87`

**Risk:** Any JavaScript running on your page (including injected scripts from XSS or malicious npm packages) can read `localStorage.getItem('token')` and steal the session.

**Solution:** Move token to an `httpOnly` cookie, which JavaScript cannot access:

_Backend — set cookie on login:_

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});
```

_Frontend — remove all `localStorage.setItem('token', ...)` calls; cookies are sent automatically._

---

### 🟠 HIGH-6 — 30-Day JWT Expiry with No Revocation

**File:** `backend/controllers/authController.js:61-63`

**Current:** Tokens expire in 30 days; there is no blacklist or refresh-token system.

**Risk:** If a token is stolen (e.g., via XSS, shared computer), the attacker has up to 30 days of access. There is no way to invalidate a specific token without changing the global secret for all users.

**Solution (short-term):** Reduce expiry to 1–2 hours and implement a refresh-token rotation pattern, or store issued tokens in Redis and validate on each request.

```js
// Shorter access token
expiresIn: "1h";

// Issue a separate refresh token (stored in httpOnly cookie) that lasts 7d
// On /api/auth/refresh, validate refresh token and issue new access token
```

---

### 🟠 HIGH-7 — Unauthenticated `/debug` Endpoint Leaks Server Info

**File:** `backend/routes/serviceBillRoutes.js:6-16`

**Current code:**

```js
router.get("/debug", (req, res) => {
  res.json({
    message: "Service bill API is working",
    timestamp: new Date().toISOString(),
    headers: { authorization: ..., 'user-agent': ... }
  });
});
```

**Risk:** This endpoint is publicly accessible with no auth. It exposes server header information that helps attackers fingerprint your API. In production there is zero reason for it to exist.

**Solution:** Delete this route entirely, or at minimum add `protect` middleware:

```js
// Either delete it, or:
router.get("/debug", protect, admin, (req, res) => { ... });
```

---

### 🟡 MEDIUM-8 — 50 MB JSON Body Limit Enables DoS

**File:** `backend/server.js:81-82`

```js
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
```

**Risk:** Any unauthenticated requester can POST 50 MB of JSON repeatedly, exhausting memory and crashing the server.

**Solution:** Use a small default limit (1 MB) and only raise it for specific file-upload routes:

```js
app.use(express.json({ limit: "1mb" }));

// Only on the specific route that needs it:
router.post("/upload", express.json({ limit: "50mb" }), protect, uploadHandler);
```

---

### 🟡 MEDIUM-9 — No Security Headers (Helmet Not Used)

**File:** `backend/server.js` — Helmet is absent

**Risk:** Browser-based attacks (clickjacking, MIME sniffing, XSS via reflected content) go unmitigated.

**Solution:**

```bash
npm install helmet
```

```js
const helmet = require("helmet");
app.use(helmet()); // sets X-Frame-Options, CSP, HSTS, X-Content-Type-Options, etc.
```

---

### 🟡 MEDIUM-10 — CORS Error Leaks Full Allowed-Origins List

**File:** `backend/server.js:186-189`

```js
return res.status(403).json({
  message: "CORS error: Origin not allowed",
  origin: req.headers.origin,
  allowedOrigins: getAllowedOrigins(), // ← exposes all allowed origins
});
```

**Risk:** An attacker can probe the CORS handler to enumerate all internal origins and craft targeted attacks.

**Solution:**

```js
return res.status(403).json({
  message: "CORS error: Origin not allowed",
  // remove origin and allowedOrigins fields
});
```

---

### 🟡 MEDIUM-11 — No Input Validation / NoSQL Injection Risk

**Affected files:** All controllers that use `req.body` directly with MongoDB

**Risk:** MongoDB operators (`$where`, `$gt`, `$regex`) can be injected via JSON body. Example:

```json
{ "email": { "$gt": "" }, "password": { "$gt": "" } }
```

This could match any user if not sanitized.

**Solution:** Install `express-validator` or `joi`, and sanitize inputs with `mongo-sanitize`:

```bash
npm install express-mongo-sanitize joi
```

```js
const mongoSanitize = require("express-mongo-sanitize");
app.use(mongoSanitize()); // strips $ and . from req.body, req.query, req.params
```

---

### 🟡 MEDIUM-12 — No Account Lockout After Failed Logins

**File:** `backend/controllers/authController.js`

**Risk:** Without lockout, brute-force can continue even with rate limiting in place if the attacker uses distributed IPs.

**Solution:** Track failed attempts in the User model and lock the account:

```js
// In User.js schema:
failedLoginAttempts: { type: Number, default: 0 },
lockUntil: { type: Date },

// In authController.js loginUser():
if (user.lockUntil && user.lockUntil > Date.now()) {
  throw new Error('Account locked. Try again later.');
}
if (!passwordMatch) {
  await User.findByIdAndUpdate(user._id, {
    $inc: { failedLoginAttempts: 1 },
    ...(user.failedLoginAttempts >= 4 && { lockUntil: Date.now() + 15 * 60 * 1000 })
  });
  throw new Error('Invalid email or password');
}
// On success: reset failedLoginAttempts to 0, clear lockUntil
```

---

### 🟡 MEDIUM-13 — Offline Fallback Creates a Fake User Object

**File:** `frontend/src/context/AuthContext.js:59`

```js
setUser({ email: "offline-user" }); // Placeholder user
```

**Risk:** Components that check `if (user)` to gate access will pass with this fake object. If any component additionally checks `user.role`, this has no role and could cause unexpected behavior or access path bypasses.

**Solution:** Keep the token present for reconnection but set `user` to `null` when there is no cached real user data:

```js
const cachedUser = localStorage.getItem("userData");
if (cachedUser) {
  setUser(JSON.parse(cachedUser));
} else {
  setUser(null); // Don't create a fake user object
}
```

---

### 🟡 MEDIUM-14 — Public Registration Toggle on Login Page

**File:** `frontend/src/pages/LoginPage.js:19`

```jsx
<button onClick={() => setShowLogin(!showLogin)}>
  {showLogin ? "Need to register?" : "Already have an account?"}
</button>
```

**Risk:** Any visitor can switch to the registration form. Even though `AuthForm` currently logs `"Registration not implemented yet"`, this UI path exists and can accidentally be activated if the backend register endpoint is called directly. The backend's `POST /api/auth/register` is only protected if correctly mounted with `protect` + `admin` — any misconfiguration opens self-registration.

**Solution:** Remove the registration toggle from `LoginPage.js` entirely. New accounts should only be created by an admin from the admin panel.

---

### 🟢 LOW-15 — Hardcoded API URL in Frontend Source

**File:** `frontend/src/context/AuthContext.js:41,77`

```js
const res = await axios.get("https://backend.okmotors.in/api/auth/me");
const res = await axios.post("https://backend.okmotors.in/api/auth/login", ...);
```

**Risk:** URL changes require code changes, and the production URL is embedded in source. Less a security risk, more a maintenance and accidental-data-exposure risk.

**Solution:**

```js
const API_URL = process.env.REACT_APP_API_URL;
axios.get(`${API_URL}/api/auth/me`);
```

---

### 🟢 LOW-16 — No Password Complexity Requirement in Backend

**File:** `backend/models/User.js` (implicit — no validation)

**Risk:** Users can be created with passwords like `123456` or `aaaaaa`.

**Solution:** Add validation in the controller or model:

```js
// In authController.js registerUser():
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
  res.status(400);
  throw new Error(
    "Password must be at least 8 characters and include a letter and a number",
  );
}
```

---

### 🟢 LOW-17 — Public Sell-Request POST Has No Rate Limiting

**File:** `backend/routes/sellRequestRoutes.js`

**Risk:** The public form submission endpoint can be spammed to flood the admin's sell request list.

**Solution:** Apply a rate limiter (5–10 requests per hour per IP) to this route.

---

### 🟢 LOW-18 — Verbose 404 Handler Leaks Route Path

**File:** `backend/server.js:171-177`

```js
res.status(404).json({
  message: "Route not found",
  path: req.originalUrl, // ← echoes the attempted path back
  method: req.method,
});
```

**Risk:** Confirms to attackers which paths do and do not exist (path enumeration).

**Solution:**

```js
res.status(404).json({ message: "Not found" });
```

---

## Planned Feature — Security Access Lock (Pre-Login PIN Gate)

You mentioned wanting a **security lock screen** that appears before the login page — a PIN or access code users must enter before they can even see the login form.

### How it will work

```
App Launch
    ↓
AccessLockScreen   ← new component — asks for access code
    ↓ (correct code entered, stored in sessionStorage)
LoginPage          ← existing email/password login
    ↓ (JWT issued)
Admin / Staff Dashboard
```

### Implementation plan

1. **Store the access code** in `frontend/.env` as `REACT_APP_ACCESS_CODE=YOUR_CODE`.
2. **Create `AccessLockScreen.js`** — a simple PIN entry screen shown before anything else.
3. **Wrap `App.js`** — before rendering any route, check `sessionStorage.getItem('okm_access')`. If absent, render `<AccessLockScreen />` instead.
4. On correct entry, save `sessionStorage.setItem('okm_access', '1')` and proceed.
5. Lock clears automatically when the browser tab/window is closed (sessionStorage behavior).

> This provides a lightweight physical-access layer — good for shared office computers where you don't want a passerby to even reach the login screen. It is **not** a replacement for proper authentication; it is a first-layer deterrent.

---

## Priority Fix Order

1. **Do now:** Rotate all credentials (DB password, JWT secret, ImageKit keys). They are in your `.env` which may be in git history.
2. **Do now:** Add `express-rate-limit` to the login route.
3. **This week:** Add `helmet` and `express-mongo-sanitize`, remove the `/debug` endpoint, fix user enumeration messages.
4. **This week:** Move JWT to httpOnly cookie.
5. **Soon:** Account lockout, input validation, reduce body size limit.
6. **When ready:** Implement the Access Lock screen (see above plan).
