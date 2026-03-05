/**
 * Утилиты форматирования для DLVRY-страниц.
 */

/** Форматирование денежных сумм: 52 014 035 ₽ */
export function formatMoney(value: number | null | undefined): string {
    if (value == null) return '0';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

/** Короткая дата со временем: 04.03.26, 14:30 */
export function formatShortDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/** Дата + день недели: 04.03.26 (Ср) */
export function formatDateRu(iso: string): string {
    try {
        const d = new Date(iso + 'T00:00:00');
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const day = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
        return `${day} (${weekdays[d.getDay()]})`;
    } catch {
        return iso;
    }
}

/** Полная дата со временем: 04.03.2026, 14:30 */
export function formatDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/**
 * Склонение числительных для русского языка.
 * @param n — число
 * @param forms — три формы: [именительный ед., родительный ед., родительный мн.]
 * @example plural(1,  ['день', 'дня', 'дней']) → '1 день'
 * @example plural(23, ['день', 'дня', 'дней']) → '23 дня'
 * @example plural(5,  ['день', 'дня', 'дней']) → '5 дней'
 */
export function plural(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} ${forms[0]}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${forms[1]}`;
    return `${n} ${forms[2]}`;
}
