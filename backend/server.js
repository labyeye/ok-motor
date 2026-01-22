require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const buyLetterRoutes = require("./routes/buyLetter");
const sellLetterRoutes = require("./routes/selLetter");
const dashboardRoutes = require("./routes/dashboard");
const serviceBillRoutes = require("./routes/serviceBillRoutes");
const advanceBillRoutes = require("./routes/advanceBillRoutes");
const syncRoutes = require("./routes/syncRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const sellRequestRoutes = require("./routes/sellRequestRoutes");
const updatesRoutes = require("./routes/updatesRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const bikeRoutes = require("./routes/bikeRoutes");
const { protect } = require("./middleware/auth");
const cors = require("cors");
const app = express();
connectDB();

// Dynamic CORS configuration for different environments
const getAllowedOrigins = () => {
  const origins = [
    "http://127.0.0.1:5500",
    "http://localhost:3000", // Local development
    "http://127.0.0.1:3000", // Local development
    "https://ok-motor.vercel.app", // Production
    "https://ok-motor-git-main-ok-motor.vercel.app", // Vercel preview
    "https://ok-motor-ok-motor.vercel.app", // Vercel deployment
    "https://okmotors.in",
    "https://www.okmotors.in",
  ];

  // Add production origins from environment
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Cache-Control",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Methods",
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false,
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests to 60 seconds
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "No origin"
    }`,
  );
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/buy-letter", buyLetterRoutes);
app.use("/api/buy-letters", buyLetterRoutes); // Add alias for compatibility
app.use("/api/sell-letters", sellLetterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/service-bills", serviceBillRoutes);
app.use("/api/advance-bills", advanceBillRoutes);
app.use("/api/sync", syncRoutes); // Sync routes
app.use("/api/vehicles", vehicleRoutes); // Vehicle routes
app.use("/api/gallery", require("./routes/galleryRoutes")); // Gallery routes
app.use("/api/sell-request", sellRequestRoutes); // Sell form endpoints
app.use("/api/updates", updatesRoutes); // Updates endpoints
app.use("/api/announcements", announcementRoutes); // Announcements endpoints
app.use("/api/bikes", bikeRoutes); // Bike API endpoints
app.use("/api/insurance", require("./routes/insuranceRoutes")); // Insurance endpoints
app.use("/api/puc", require("./routes/pucRoutes")); // PUC endpoints

// Health check endpoint (also in syncRoutes but duplicated here for convenience)
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/letter-heads", require("./routes/letterHeadRoutes"));

// Public root route
app.get("/", (req, res) => {
  // Ensure index.html is not aggressively cached by browsers/proxies
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    message: "OK Motor Backend API",
    status: "Running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      test: "/test",
      api: "/api",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Test endpoint for debugging
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      "user-agent": req.headers["user-agent"]?.substring(0, 50) + "...",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "CORS error: Origin not allowed",
      origin: req.headers.origin,
      allowedOrigins: getAllowedOrigins(),
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

// Use PORT from environment variable (Render sets this automatically)
// Default to 3500 to match frontend development configuration
const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
