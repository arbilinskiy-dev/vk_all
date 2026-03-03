import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastItem {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    timeout?: number;
}

/** Максимальное количество видимых уведомлений */
const MAX_VISIBLE_TOASTS = 5;

const ToastContext = createContext<{
    push: (t: Omit<ToastItem, 'id'>) => string;
    remove: (id: string) => void;
    removeAll: () => void;
} | null>(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    const { push, remove, removeAll } = ctx;
    return {
        push,
        remove,
        removeAll,
        info: (message: string, title?: string, timeout?: number) => push({ type: 'info', message, title, timeout }),
        success: (message: string, title?: string, timeout?: number) => push({ type: 'success', message, title, timeout }),
        error: (message: string, title?: string, timeout?: number) => push({ type: 'error', message, title, timeout }),
        warning: (message: string, title?: string, timeout?: number) => push({ type: 'warning', message, title, timeout }),
    };
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const push = useCallback((t: Omit<ToastItem, 'id'>) => {
        const id = Math.random().toString(36).slice(2, 9);
        const item: ToastItem = { id, timeout: 5000, ...t };
        setToasts(prev => [...prev, item]);
        return id;
    }, []);

    const remove = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    /** Закрыть все уведомления разом */
    const removeAll = useCallback(() => {
        setToasts([]);
    }, []);

    useEffect(() => {
        const timers: Array<{ id: string; timer: any }> = [];
        toasts.forEach(t => {
            if (t.timeout && t.timeout > 0) {
                const timer = setTimeout(() => remove(t.id), t.timeout);
                timers.push({ id: t.id, timer });
            }
        });
        return () => timers.forEach(x => clearTimeout(x.timer));
    }, [toasts, remove]);

    useEffect(() => {
        const handler = (e: Event) => {
            try {
                // @ts-ignore
                const d = (e as CustomEvent).detail || {};
                const message = String(d.message || '');
                const type = d.type || 'info';
                push({ message, type: type as ToastType });
            } catch (err) {
                // ignore
            }
        };
        window.addEventListener('app-toast', handler as EventListener);
        return () => window.removeEventListener('app-toast', handler as EventListener);
    }, [push]);

    /** Показываем только последние MAX_VISIBLE_TOASTS уведомлений */
    const visibleToasts = useMemo(() => {
        return toasts.slice(-MAX_VISIBLE_TOASTS);
    }, [toasts]);

    /** Количество скрытых уведомлений */
    const hiddenCount = toasts.length - visibleToasts.length;

    return (
        <ToastContext.Provider value={{ push, remove, removeAll }}>
            {children}
            {toasts.length > 0 && (
                <div aria-live="polite" className="fixed right-4 bottom-4 z-50 flex flex-col-reverse items-end gap-2" style={{ maxHeight: '60vh' }}>
                    {/* Кнопка «Скрыть все» — показывается когда больше 1 уведомления */}
                    {toasts.length > 1 && (
                        <button
                            onClick={removeAll}
                            className="mb-1 px-3 py-1.5 text-xs font-medium text-gray-500 bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow hover:bg-gray-50 hover:text-gray-700 transition-colors"
                        >
                            Скрыть все ({toasts.length})
                        </button>
                    )}

                    {/* Индикатор скрытых уведомлений */}
                    {hiddenCount > 0 && (
                        <div className="text-xs text-gray-400 px-3 py-1">
                            +{hiddenCount} ещё...
                        </div>
                    )}

                    {/* Видимые уведомления */}
                    {visibleToasts.map(t => (
                        <div key={t.id} className={`max-w-sm w-full text-sm rounded shadow-lg overflow-hidden border ${t.type === 'success' ? 'bg-white border-green-100' : t.type === 'error' ? 'bg-white border-red-100' : 'bg-white border-gray-100'}`}>
                            <div className="p-3 flex items-start gap-3">
                                <div className="flex-1">
                                    {t.title && <div className="font-semibold text-gray-800">{t.title}</div>}
                                    <div className="text-gray-700">{t.message}</div>
                                </div>
                                <div className="ml-2 flex-shrink-0">
                                    <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">✕</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
};

export default ToastProvider;
