class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.apiHealthCheckUrl = null;
    this.healthCheckInterval = null;
    this.healthCheckIntervalTime = 30000;

    this.init();
  }

  init() {
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));

    this.checkConnection();
  }

  setApiUrl(url) {
    this.apiHealthCheckUrl = url;
    this.startHealthCheck();
  }

  startHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.checkConnection();
    }, this.healthCheckIntervalTime);
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  handleOnline() {
    console.log("Browser detected online");
    this.checkConnection();
  }

  handleOffline() {
    console.log("Browser detected offline");
    this.updateStatus(false);
  }

  async checkConnection() {
    if (!navigator.onLine) {
      this.updateStatus(false);
      return false;
    }

    if (this.apiHealthCheckUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(this.apiHealthCheckUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
          },
        });

        clearTimeout(timeoutId);

        const online = response.ok || response.status === 401;
        this.updateStatus(online);
        return online;
      } catch (error) {
        console.log("API health check failed:", error.message);
        this.updateStatus(false);
        return false;
      }
    } else {
      this.updateStatus(navigator.onLine);
      return navigator.onLine;
    }
  }

  updateStatus(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    this.listeners.forEach((callback) => {
      try {
        callback(isOnline, wasOnline);
      } catch (error) {
        console.error("Error in network status listener:", error);
      }
    });

    window.dispatchEvent(
      new CustomEvent("network-status-change", {
        detail: { isOnline, wasOnline },
      }),
    );
  }

  subscribe(callback) {
    this.listeners.push(callback);

    callback(this.isOnline, this.isOnline);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getStatus() {
    return this.isOnline;
  }

  async forceCheck() {
    return await this.checkConnection();
  }

  destroy() {
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
    this.stopHealthCheck();
    this.listeners = [];
  }
}

const networkServiceInstance = new NetworkService();
export default networkServiceInstance;
