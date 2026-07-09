import { createContext, useContext, useRef, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const toast = useCallback((msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2800);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast ${visible ? 'show' : ''} ${isError ? 'error' : ''}`}>{message}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
