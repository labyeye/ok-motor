const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (isLocalhost) {
    return "https://ok-motor-backend.vercel.app";
  }

  return window.location.origin;
};

const API_BASE_URL = getApiUrl();

export const config = {
  API_BASE_URL: `${API_BASE_URL}/api`,
  FULL_API_URL: API_BASE_URL,

  SW_URL: "/sw.js",

  CACHE_PREFIX: isProduction && !isLocalhost ? "ok-motor-prod" : "ok-motor-dev",

  API_TIMEOUT: isProduction && !isLocalhost ? 60000 : 30000,

  DEBUG: isDevelopment || isLocalhost,

  PWA_ENABLED: true,
  OFFLINE_ENABLED: true,

  IS_PRODUCTION: isProduction && !isLocalhost,
  IS_DEVELOPMENT: isDevelopment || isLocalhost,
};

if (config.DEBUG) {
  console.log("Environment Config:", {
    ...config,
    hostname: window.location.hostname,
    NODE_ENV: process.env.NODE_ENV,
  });
}

export default config;
