let listeners = [];

export const toastService = {
  subscribe(callback) {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(cb => cb !== callback);
    };
  },
  show(message, type = "success") {
    const id = Date.now() + Math.random();
    listeners.forEach(cb => cb({ id, message, type }));
  }
};
