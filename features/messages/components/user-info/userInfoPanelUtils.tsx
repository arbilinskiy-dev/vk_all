/**
 * Утилиты и вспомогательные компоненты для панели информации о пользователе.
 * Маппинг платформ, форматирование дат, расчёт возраста/lifetime, InfoRow.
 */

import React from 'react';

// =============================================================================
// КОНСТАНТЫ
// =============================================================================

/** Маппинг платформы VK (1-7) в человекопонятное название */
export const PLATFORM_MAP: Record<number, { name: string; icon: string }> = {
    1: { name: 'Мобильная версия', icon: 'mobile' },
    2: { name: 'iPhone', icon: 'apple' },
    3: { name: 'iPad', icon: 'tablet' },
    4: { name: 'Android', icon: 'android' },
    5: { name: 'Windows Phone', icon: 'mobile' },
    6: { name: 'Windows 10', icon: 'desktop' },
    7: { name: 'Полная версия', icon: 'desktop' },
};

/** SVG-иконка платформы */
export const PlatformIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'h-4 w-4' }) => {
    switch (type) {
        case 'apple':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
            );
        case 'android':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.35-.6-2.87-.95-4.45-.95s-3.1.35-4.45.95L5.73 5.71c-.16-.31-.54-.43-.86-.27-.31.16-.43.55-.27.86L6.44 9.48C3.08 11.32 .83 14.7.83 18.56h22.34c0-3.86-2.25-7.24-5.57-9.08M7 15.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1"/>
                </svg>
            );
        case 'tablet':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
        case 'desktop':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            );
        case 'mobile':
        default:
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            );
    }
};

// =============================================================================
// УТИЛИТЫ ФОРМАТИРОВАНИЯ
// =============================================================================

/** Форматирование даты в читаемый вид */
export function formatDate(isoDate?: string | null): string {
    if (!isoDate) return 'неизвестно';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'неизвестно';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Форматирование относительного времени "X дней назад" */
export function formatRelativeTime(isoDate?: string | null): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес. назад`;
    return `${Math.floor(diffDays / 365)} г. назад`;
}

/** Расчёт lifetime подписки */
export function calcLifetime(addedAt?: string | null): string {
    if (!addedAt) return 'неизвестно';
    const date = new Date(addedAt);
    if (isNaN(date.getTime())) return 'неизвестно';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (days < 1) return 'Менее дня';
    if (days === 1) return '1 день';
    if (days < 30) return `${days} дн.`;
    
    const months = Math.floor(days / 30);
    const remainDays = days % 30;
    if (months < 12) {
        return remainDays > 0 ? `${months} мес. ${remainDays} дн.` : `${months} мес.`;
    }
    
    const years = Math.floor(months / 12);
    const remainMonths = months % 12;
    return remainMonths > 0 ? `${years} г. ${remainMonths} мес.` : `${years} г.`;
}

/** Склонение слова «год» для возраста: 1 год, 2 года, 5 лет */
export function pluralAge(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} год`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} года`;
    return `${n} лет`;
}

/** Расчёт возраста по bdate */
export function calcAge(bdate?: string | null): { dateStr: string; age: number | null } {
    if (!bdate) return { dateStr: 'неизвестно', age: null };
    
    // bdate может быть: "15.2.1990" или "15.2" (без года)
    const parts = bdate.split('.');
    if (parts.length < 2) return { dateStr: bdate, age: null };
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    // Без года — только дата рождения
    if (parts.length === 2 || !parts[2]) {
        const monthNames = ['', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        return { dateStr: `${day} ${monthNames[month] || ''}`, age: null };
    }
    
    const year = parseInt(parts[2], 10);
    const birthDate = new Date(year, month - 1, day);
    const now = new Date();
    
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }
    
    const dateStr = birthDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    return { dateStr, age };
}

/** Форматирование unix timestamp (last_seen) */
export function formatLastSeen(unixTs?: number | null): string {
    if (!unixTs) return 'неизвестно';
    const date = new Date(unixTs * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) return 'только что';
    if (diffMin < 60) return `${diffMin} мин. назад`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + 
        ' в ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Форматирование unix timestamp в дату (для таблицы) */
export function formatLastSeenDate(unixTs?: number | null): string {
    if (!unixTs) return 'неизвестно';
    const date = new Date(unixTs * 1000);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// =============================================================================
// КОМПОНЕНТ СТРОКИ
// =============================================================================

/** Одна строка информации */
export const InfoRow: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    subValue?: string;
    valueColor?: string;
}> = ({ icon, label, value, subValue, valueColor }) => (
    <div className="flex items-start gap-3 py-2">
        <div className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
            <p className={`text-sm font-medium ${valueColor || 'text-gray-800'}`}>{value}</p>
            {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
    </div>
);
