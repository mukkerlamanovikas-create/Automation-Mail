const listeners = new Set();

export const toastEmitter = {
  emit: (type, message) => listeners.forEach(fn => fn({ type, message, id: Date.now() + Math.random() })),
  subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
};

export const toast = {
  success: msg => toastEmitter.emit('success', msg),
  error: msg => toastEmitter.emit('error', msg),
  info: msg => toastEmitter.emit('info', msg),
};
