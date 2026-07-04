let activeRequests = [];
let onChangeCallbacks = [];

export const loadingService = {
  subscribe(callback) {
    onChangeCallbacks.push(callback);
    // Call immediately with current state
    callback(activeRequests);
    return () => {
      onChangeCallbacks = onChangeCallbacks.filter(cb => cb !== callback);
    };
  },
  start(url = "", method = "GET", loadingMode = "normal") {
    // Prevent duplicate entries of the same operation url
    const exists = activeRequests.some(r => r.url === url && r.method === method);
    if (!exists) {
      activeRequests.push({ url, method, timestamp: Date.now(), loadingMode });
      this.notify();
    }
  },
  stop(url = "", method = "GET") {
    activeRequests = activeRequests.filter(r => !(r.url === url && r.method === method));
    this.notify();
  },
  notify() {
    onChangeCallbacks.forEach(cb => cb([...activeRequests]));
  }
};
