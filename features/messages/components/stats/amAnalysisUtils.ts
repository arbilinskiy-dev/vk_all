/**
 * Утилиты для страницы «АМ Анализ».
 */

/** Форматирует ISO-строку в дд.мм.гггг чч:мм (ru-RU) */
export const formatDate = (isoString: string | null): string => {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return isoString; }
};

/** Форматирует дату в дд.мм (для оси X графика) */
export const formatShortDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch { return dateStr; }
};

/** Math.max с fallback на 1 (защита от пустого массива) */
export const safeMax = (arr: number[]): number => Math.max(...arr, 1);
