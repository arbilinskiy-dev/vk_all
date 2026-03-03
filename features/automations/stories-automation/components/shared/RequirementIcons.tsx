import React from 'react';

// ─── Иконки-индикаторы ────────────────────────────────────────────

/** Зелёная галочка — требование выполнено */
export const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

/** Красный крестик — требование не выполнено */
export const XIcon: React.FC = () => (
    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/** Серый кружок — требование не проверялось (зависимость не выполнена) */
export const PendingIcon: React.FC = () => (
    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
);

/** Спиннер загрузки */
export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-4 w-4' }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

// ─── Бейдж статуса callback-сервера ────────────────────────────────

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles: Record<string, string> = {
        ok: 'bg-green-100 text-green-700',
        wait: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700',
        unconfigured: 'bg-gray-100 text-gray-600',
    };
    const dotStyles: Record<string, string> = {
        ok: 'bg-green-500',
        wait: 'bg-yellow-500',
        failed: 'bg-red-400',
        unconfigured: 'bg-gray-400',
    };

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || styles.unconfigured}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotStyles[status] || dotStyles.unconfigured}`} />
            {status}
        </span>
    );
};

// ─── Иконки видимости токена ───────────────────────────────────────

export const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" /></svg>
);

export const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-2.572 4.293m-5.466-4.293a3 3 0 01-4.242-4.242" /></svg>
);
