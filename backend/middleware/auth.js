const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  console.log("Auth middleware - Headers:", {
    authorization: req.headers.authorization ? "Present" : "Missing",
    "content-type": req.headers["content-type"],
    "user-agent": req.headers["user-agent"]?.substring(0, 50) + "...",
  });

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token extracted:", token.substring(0, 20) + "...");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded successfully for user ID:", decoded.id);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.log("User not found in database for ID:", decoded.id);
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      console.log("User authenticated successfully:", req.user.email);
      next();
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    console.log("No authorization header or Bearer token found");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Not authorized as admin" });
  }
};

module.exports = { protect, admin };
