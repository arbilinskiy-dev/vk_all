/**
 * Универсальная плюрализация для русского языка.
 * @param n — число
 * @param forms — три формы: [именительный ед., родительный ед., родительный мн.]
 * @example plural(1,  ['проект', 'проекта', 'проектов']) → '1 проект'
 * @example plural(23, ['команда', 'команды', 'команд']) → '23 команды'
 * @example plural(35, ['проект', 'проекта', 'проектов']) → '35 проектов'
 * @example plural(11, ['проект', 'проекта', 'проектов']) → '11 проектов'
 */
export function plural(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} ${forms[0]}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${forms[1]}`;
    return `${n} ${forms[2]}`;
}
