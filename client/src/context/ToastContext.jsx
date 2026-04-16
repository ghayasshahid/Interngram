import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = "success", duration = 3500) => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const success = useCallback((msg) => push(msg, "success"), [push]);
  const error   = useCallback((msg) => push(msg, "error"),   [push]);
  const info    = useCallback((msg) => push(msg, "info"),    [push]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-dot" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
