import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 4500;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200',
            error: 'bg-rose-950/90 border-rose-500/40 text-rose-200',
            warning: 'bg-amber-950/90 border-amber-500/40 text-amber-200',
            info: 'bg-slate-900/90 border-brand-cyan/40 text-slate-100',
          }[toast.type];

          const IconComponent = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${bgColors}`}
            >
              <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5 text-brand-cyan" />
              <div className="flex-1">
                <p className="text-sm font-semibold tracking-wide">{toast.title}</p>
                {toast.message && <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 transition-opacity"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

