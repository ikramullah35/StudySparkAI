"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let counter = 0;

const STYLES = {
  success: { icon: CheckCircle2, ring: "border-emerald-200", color: "text-emerald-600" },
  error: { icon: AlertCircle, ring: "border-rose-200", color: "text-rose-600" },
  info: { icon: Info, ring: "border-indigo-200", color: "text-indigo-600" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++counter;
      setToasts((list) => [...list, { id, type, message }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const toast = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {toasts.map((t) => {
          const { icon: Icon, ring, color } = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${ring} bg-white p-4 shadow-lg`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
