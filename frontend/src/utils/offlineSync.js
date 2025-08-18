// offlineSync.js
// Utility for offline/online sync for buy, sell, service, advance bills

export const OFFLINE_KEYS = {
  buy: 'offline_buy_letters',
  sell: 'offline_sell_letters',
  service: 'offline_service_bills',
  advance: 'offline_advance_bills',
};

export function saveToLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function getFromLocal(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function addPendingRecord(key, record) {
  const records = getFromLocal(key);
  records.push({ ...record, pendingSync: true });
  saveToLocal(key, records);
}

export function markSynced(key, id) {
  const records = getFromLocal(key);
  saveToLocal(key, records.map(r => r._id === id ? { ...r, pendingSync: false } : r));
}

export function getPendingSync(key) {
  return getFromLocal(key).filter(r => r.pendingSync);
}

export function isOnline() {
  return window.navigator.onLine;
}

export function syncPending(key, apiUrl, token) {
  const pending = getPendingSync(key);
  if (!pending.length || !isOnline()) return Promise.resolve([]);
  return Promise.all(
    pending.map(async (record) => {
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : undefined,
          },
          body: JSON.stringify(record),
        });
        if (res.ok) {
          markSynced(key, record._id);
          return await res.json();
        }
      } catch (e) {}
      return null;
    })
  );
}
