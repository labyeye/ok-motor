import axios from "axios";
import offlineStorage from "./offlineStorage";
import networkService from "./networkService";

class ApiService {
  constructor() {
    this.baseURL = "https://backend.okmotors.in";
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });

    this.setupInterceptors();

    networkService.setApiUrl(`${this.baseURL}/api/health`);
  }

  setupInterceptors() {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          !networkService.getStatus() &&
          (error.code === "ERR_NETWORK" ||
            error.message.includes("Network Error"))
        ) {
          console.log("Network error detected - using offline mode");
        }
        return Promise.reject(error);
      },
    );
  }

  shouldUseOffline() {
    return !networkService.getStatus();
  }

  async request(method, endpoint, data = null, useOffline = null) {
    const offline = useOffline !== null ? useOffline : this.shouldUseOffline();

    if (offline) {
      return this.handleOfflineRequest(method, endpoint, data);
    }

    try {
      const response = await this.axiosInstance({
        method,
        url: endpoint,
        data,
      });
      return response.data;
    } catch (error) {
      if (error.code === "ERR_NETWORK" || !networkService.getStatus()) {
        console.log("Network error - falling back to offline mode");
        return this.handleOfflineRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  async handleOfflineRequest(method, endpoint, data) {
    const parts = endpoint.split("/").filter((p) => p);
    const collection = this.getCollectionFromEndpoint(
      parts[parts.length - 1] || parts[0],
    );

    switch (method.toUpperCase()) {
      case "GET":
        return this.handleOfflineGet(collection, endpoint);
      case "POST":
        return this.handleOfflinePost(collection, data);
      case "PUT":
      case "PATCH":
        return this.handleOfflinePut(collection, endpoint, data);
      case "DELETE":
        return this.handleOfflineDelete(collection, endpoint);
      default:
        throw new Error(`Unsupported offline method: ${method}`);
    }
  }

  getCollectionFromEndpoint(endpoint) {
    const mapping = {
      "buy-letters": "buyLetters",
      "buy-letter": "buyLetters",
      "sell-letters": "sellLetters",
      "sell-letter": "sellLetters",
      "service-bills": "serviceBills",
      "service-bill": "serviceBills",
      "advance-bills": "advanceBills",
      "advance-bill": "advanceBills",
      users: "users",
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (endpoint.includes(key)) {
        return value;
      }
    }

    if (endpoint.includes("buy")) return "buyLetters";
    if (endpoint.includes("sell")) return "sellLetters";
    if (endpoint.includes("service")) return "serviceBills";
    if (endpoint.includes("advance")) return "advanceBills";

    return endpoint;
  }

  async handleOfflineGet(collection, endpoint) {
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);

    if (idMatch) {
      const id = idMatch[1];
      const result = await offlineStorage.findById(collection, id);

      if (result.success && result.data) {
        return { success: true, data: result.data };
      } else {
        throw new Error("Document not found");
      }
    } else {
      const result = await offlineStorage.find(collection);
      return { success: true, data: result.data || [] };
    }
  }

  async handleOfflinePost(collection, data) {
    const result = await offlineStorage.create(collection, data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error);
    }
  }

  async handleOfflinePut(collection, endpoint, data) {
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);

    if (!idMatch) {
      throw new Error("ID required for update");
    }

    const id = idMatch[1];
    const result = await offlineStorage.updateById(collection, id, data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      throw new Error(result.error);
    }
  }

  async handleOfflineDelete(collection, endpoint) {
    const idMatch = endpoint.match(/\/([a-f0-9]{24}|\w+)$/);

    if (!idMatch) {
      throw new Error("ID required for delete");
    }

    const id = idMatch[1];
    const result = await offlineStorage.deleteById(collection, id);

    if (result.success) {
      return { success: true, message: "Document deleted" };
    } else {
      throw new Error(result.error);
    }
  }

  async get(endpoint) {
    return this.request("GET", endpoint);
  }

  async post(endpoint, data) {
    return this.request("POST", endpoint, data);
  }

  async put(endpoint, data) {
    return this.request("PUT", endpoint, data);
  }

  async patch(endpoint, data) {
    return this.request("PATCH", endpoint, data);
  }

  async delete(endpoint) {
    return this.request("DELETE", endpoint);
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
