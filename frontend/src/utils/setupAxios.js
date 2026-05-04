import axios from "axios";
import config from "../config/environment";

axios.defaults.baseURL =
  config.FULL_API_URL || config.API_BASE_URL.replace(/\/api$/, "");
axios.defaults.timeout = config.API_TIMEOUT || 30000;

axios.interceptors.request.use(
  (req) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        req.headers = req.headers || {};
        req.headers.Authorization = `Bearer ${token}`;
      } else {
        if (req.headers && req.headers.Authorization)
          delete req.headers.Authorization;
      }
    } catch (e) {}
    return req;
  },
  (error) => Promise.reject(error),
);

export default axios;
