import { useState, useEffect, useCallback } from "react";
import httpClient from "../utils/offlineHttpClient";
import swManager from "../utils/serviceWorkerManager";

// Custom hook for offline-aware data fetching
export const useOfflineData = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const {
    refetchOnOnline = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    retry = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const fetchData = useCallback(
    async (attempt = 1) => {
      try {
        setLoading(true);
        setError(null);

        const response = await httpClient.get(url, fetchOptions);
        const responseData = response.data;

        setData(responseData);
        setIsCached(!!responseData._cached);
        setIsStale(!!responseData._stale);

        // Check if data is stale
        if (responseData._timestamp) {
          const age = Date.now() - responseData._timestamp;
          setIsStale(age > staleTime);
        }
      } catch (err) {
        console.error(`Fetch attempt ${attempt} failed:`, err);

        // If we have cached data, show it instead of error
        if (err.response?.data?._cached) {
          const cachedData = err.response.data;
          setData(cachedData);
          setIsCached(true);
          setIsStale(true);
        } else if (attempt < retry) {
          // Retry with exponential backoff
          setTimeout(() => {
            fetchData(attempt + 1);
          }, retryDelay * Math.pow(2, attempt - 1));
          return;
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    },
    [url, fetchOptions, retry, retryDelay, staleTime]
  );

  // Refetch data
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when back online
  useEffect(() => {
    if (!refetchOnOnline) return;

    const handleNetworkChange = ({ type }) => {
      if (type === "ONLINE" && (isStale || isCached)) {
        console.log("Back online, refetching stale data for:", url);
        fetchData();
      }
    };

    swManager.addCallback(handleNetworkChange);

    return () => {
      swManager.removeCallback(handleNetworkChange);
    };
  }, [fetchData, refetchOnOnline, isStale, isCached, url]);

  return {
    data,
    loading,
    error,
    isStale,
    isCached,
    refetch,
    isOnline: navigator.onLine,
  };
};

// Hook for offline-aware mutations (POST, PUT, DELETE)
export const useOfflineMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (method, url, payload, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (method.toLowerCase()) {
        case "post":
          response = await httpClient.post(url, payload, options);
          break;
        case "put":
          response = await httpClient.put(url, payload, options);
          break;
        case "delete":
          response = await httpClient.delete(url, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err);

      // If offline, the request is queued
      if (err.message === "Request queued for when online") {
        return {
          queued: true,
          message: "Request will be processed when back online",
        };
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(
    (url, payload, options) => mutate("post", url, payload, options),
    [mutate]
  );

  const put = useCallback(
    (url, payload, options) => mutate("put", url, payload, options),
    [mutate]
  );

  const del = useCallback(
    (url, options) => mutate("delete", url, null, options),
    [mutate]
  );

  return {
    mutate,
    post,
    put,
    delete: del,
    loading,
    error,
    data,
  };
};

// Hook for managing offline queue
export const useOfflineQueue = () => {
  const [queueStatus, setQueueStatus] = useState({ count: 0, requests: [] });

  useEffect(() => {
    const updateQueueStatus = () => {
      const storedQueue = JSON.parse(localStorage.getItem("httpQueue") || "[]");
      setQueueStatus({
        count: storedQueue.length,
        requests: storedQueue,
      });
    };

    // Initial update
    updateQueueStatus();

    // Update when queue changes
    const interval = setInterval(updateQueueStatus, 2000);

    // Listen for queue changes
    const handleStorageChange = (e) => {
      if (e.key === "httpQueue") {
        updateQueueStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const clearQueue = useCallback(() => {
    localStorage.removeItem("httpQueue");
    setQueueStatus({ count: 0, requests: [] });
  }, []);

  return {
    queueStatus,
    clearQueue,
  };
};
