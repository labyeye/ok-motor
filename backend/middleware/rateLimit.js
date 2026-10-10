const rateLimit = require("express-rate-limit");

// Brute-force protection for login: 10 attempts / 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again in 15 minutes." },
});

// Public, unauthenticated upload endpoint: 20 requests / hour per IP.
const publicUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

module.exports = { loginLimiter, publicUploadLimiter };
