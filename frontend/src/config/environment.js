// Environment configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const config = {
  API_BASE_URL:
    isProduction && !isLocalhost
      ? "https://ok-motor.onrender.com/api"
      : "http://localhost:2500/api",

  FULL_API_URL:
    isProduction && !isLocalhost
      ? "https://ok-motor.onrender.com"
      : "http://localhost:2500",

  SW_URL: "/sw.js",

  // Cache names with environment suffix
  CACHE_PREFIX: isProduction && !isLocalhost ? "ok-motor-prod" : "ok-motor-dev",

  // Timeouts
  API_TIMEOUT: isProduction && !isLocalhost ? 15000 : 10000,

  // Debug logging
  DEBUG: isDevelopment || isLocalhost,

  // PWA settings
  PWA_ENABLED: true,
  OFFLINE_ENABLED: true,

  // Environment info
  IS_PRODUCTION: isProduction && !isLocalhost,
  IS_DEVELOPMENT: isDevelopment || isLocalhost,
};

// Log current environment
if (config.DEBUG) {
  console.log("Environment Config:", {
    ...config,
    hostname: window.location.hostname,
    NODE_ENV: process.env.NODE_ENV,
  });
}

export default config;
