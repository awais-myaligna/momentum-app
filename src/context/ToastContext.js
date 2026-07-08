import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import Toast from '../components/Toast';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 3000;

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message, { type = 'info', duration = DEFAULT_DURATION } = {}) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, type, id: Date.now() });
    timeoutRef.current = setTimeout(hideToast, duration);
  }, [hideToast]);

  const value = useMemo(() => ({ showToast, hideToast }), [showToast, hideToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toast={toast} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
