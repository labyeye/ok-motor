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

const getAllowedOrigins = () => {
  const origins = [
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ok-motor-frontend.vercel.app",
    "https://ok-motor-git-main-ok-motor.vercel.app",
    "https://ok-motor-ok-motor.vercel.app",
    "https://okmotors.in",
    "https://www.okmotors.in",
  ];

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
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => {
  req.setTimeout(290000);
  res.setTimeout(290000);
  next();
});

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin || "No origin"
    }`,
  );
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/buy-letter", buyLetterRoutes);
app.use("/api/buy-letters", buyLetterRoutes);
app.use("/api/sell-letters", sellLetterRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/service-bills", serviceBillRoutes);
app.use("/api/advance-bills", advanceBillRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.use("/api/sell-request", sellRequestRoutes);
app.use("/api/updates", updatesRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/bikes", bikeRoutes);
app.use("/api/insurance", require("./routes/insuranceRoutes"));
app.use("/api/puc", require("./routes/pucRoutes"));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/letter-heads", require("./routes/letterHeadRoutes"));

app.get("/", (req, res) => {
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

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

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

app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

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

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
