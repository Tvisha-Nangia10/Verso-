import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: number; msg: string; type: ToastType; going: boolean };

const ICONS: Record<ToastType, string> = { success: '✓', error: '✕', info: '✦' };

type ToastApi = (msg: string, type?: ToastType, dur?: number) => void;

const ToastContext = createContext<ToastApi>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback<ToastApi>((msg, type = 'info', dur = 3000) => {
    const id = nextId++;
    setItems(prev => [...prev, { id, msg, type, going: false }]);
    window.setTimeout(() => {
      setItems(prev => prev.map(t => (t.id === id ? { ...t, going: true } : t)));
      window.setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 300);
    }, dur);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toastContainer">
        {items.map(t => (
          <div key={t.id} className={t.going ? 'toast going' : 'toast'}>
            <div className={`toast-icon ${t.type}`}>{ICONS[t.type]}</div>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
