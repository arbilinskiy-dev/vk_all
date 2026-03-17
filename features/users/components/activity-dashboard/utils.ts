// ==========================================
// Вспомогательные функции дашборда активности
// ==========================================

/** Форматирование минут в читаемую длительность */
export const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0м';
    if (minutes < 60) return `${Math.round(minutes)}м`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h >= 24) {
        const d = Math.floor(h / 24);
        const remainH = h % 24;
        return remainH > 0 ? `${d}д ${remainH}ч` : `${d}д`;
    }
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
};

/** Форматирование даты */
export const formatDate = (isoString: string | null): string => {
    if (!isoString) return 'неизвестно';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return isoString; }
};

/** Форматирование короткой даты для графика */
export const formatShortDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch { return dateStr; }
};

/** Склонение числительных */
export const plural = (n: number, forms: [string, string, string]): string => {
    const abs = Math.abs(n) % 100;
    const n1 = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
};

/** Безопасный максимум массива (без spread) */
export const safeMax = (arr: number[], fallback = 1): number => {
    let max = fallback;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
};
