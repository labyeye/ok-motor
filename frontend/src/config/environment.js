// Environment configuration
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Get API URL from environment variables or use defaults
const getApiUrl = () => {
  // For production deployments, use environment variable if available
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // For development or when running locally, use local backend
  if (isLocalhost) {
    return "https://ok-motor-51l3.vercel.app";
  }
  
  // For production, use the deployed backend
  return "https://ok-motor-51l3.vercel.app";
};

const API_BASE_URL = getApiUrl();

export const config = {
  API_BASE_URL: `${API_BASE_URL}/api`,
  FULL_API_URL: API_BASE_URL,

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
