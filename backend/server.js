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
const { protect } = require("./middleware/auth");
const cors = require("cors");
const app = express();
connectDB();

// Dynamic CORS configuration for different environments
const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:3000", // Local development
    "http://127.0.0.1:3000", // Local development
    "https://ok-motor.vercel.app", // Production
    "https://ok-motor-git-main-ok-motor.vercel.app", // Vercel preview
    "https://ok-motor-ok-motor.vercel.app" // Vercel deployment
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
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log('CORS: Checking origin:', origin);
    console.log('CORS: Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('CORS: Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Cache-Control", 
    "X-Requested-With",
    "Accept",
    "Origin"
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  preflightContinue: false
};

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests to 60 seconds
  req.setTimeout(60000);
  res.setTimeout(60000);
  next();
});

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'No origin'}`);
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint for debugging
app.get("/test", (req, res) => {
  res.json({ 
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin,
      'user-agent': req.headers['user-agent']?.substring(0, 50) + '...'
    }
  });
});

// 404 handler
app.use("*", (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: getAllowedOrigins()
    });
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Use PORT from environment variable (Render sets this automatically)
const PORT = process.env.PORT || 2500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Allowed CORS origins:', getAllowedOrigins());
  console.log('Environment:', process.env.NODE_ENV || 'development');
});



