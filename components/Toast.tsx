
import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-[90vw] sm:max-w-md w-full pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onRemove]);

    const styles = {
        success: 'bg-white border-l-4 border-emerald-500 text-slate-800 shadow-lg shadow-emerald-500/10',
        error: 'bg-white border-l-4 border-red-500 text-slate-800 shadow-lg shadow-red-500/10',
        warning: 'bg-white border-l-4 border-amber-500 text-slate-800 shadow-lg shadow-amber-500/10',
        info: 'bg-white border-l-4 border-blue-500 text-slate-800 shadow-lg shadow-blue-500/10',
    };

    const icons = {
        success: <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        error: <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        warning: <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
        info: <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    };

    return (
        <div className={`${styles[toast.type]} p-4 rounded-lg flex items-start gap-3 pointer-events-auto transform transition-all duration-500 animate-in slide-in-from-right-full`}>
            <div className="shrink-0 pt-0.5">{icons[toast.type]}</div>
            <div className="flex-1">
                <h4 className="font-bold text-sm">{toast.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={onRemove} className="shrink-0 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};

export default Toast;
