/**
 * Утилита для получения URL изображений эмоджи через Twemoji CDN.
 * Twemoji — открытый набор SVG-эмоджи от Twitter/X, одинаково красиво
 * отображается на всех платформах (включая Windows, где стандартные эмоджи выглядят плохо).
 *
 * Логика обработки FE0F (variation selector-16):
 * - Для ZWJ-последовательностей (содержат U+200D) FE0F **сохраняется**, т.к. Twemoji
 *   использует его в именах файлов (например: 2764-fe0f-200d-1f525.svg).
 * - Для обычных эмоджи (без ZWJ) FE0F **удаляется**, т.к. Twemoji его не использует
 *   (например: 263a.svg, а не 263a-fe0f.svg).
 * - При ошибке загрузки пробуем альтернативный URL с обратной логикой FE0F.
 */

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg';

/**
 * Извлекает массив hex-кодпоинтов из символа эмоджи.
 * Например: '😀' → ['1f600'], '❤️‍🔥' → ['2764', 'fe0f', '200d', '1f525']
 */
function getRawCodepoints(emoji: string): string[] {
    const codepoints: string[] = [];
    for (const char of emoji) {
        const cp = char.codePointAt(0);
        if (cp !== undefined) {
            codepoints.push(cp.toString(16));
        }
    }
    return codepoints;
}

/**
 * Конвертирует символ эмоджи в hex-codepoint строку для Twemoji URL.
 * Например: '😀' → '1f600', '👍' → '1f44d', '🇷🇺' → '1f1f7-1f1fa'
 *
 * Для ZWJ-эмоджи (содержащих 200d) сохраняет fe0f,
 * для обычных — убирает.
 */
export function emojiToCodepoint(emoji: string): string {
    const codepoints = getRawCodepoints(emoji);
    const hasZWJ = codepoints.includes('200d');

    if (hasZWJ) {
        // ZWJ-эмоджи: оставляем fe0f, т.к. Twemoji использует его в именах файлов
        return codepoints.join('-');
    }

    // Обычные эмоджи: убираем fe0f
    const withoutVS16 = codepoints.filter(cp => cp !== 'fe0f');
    return (withoutVS16.length > 0 ? withoutVS16 : codepoints).join('-');
}

/**
 * Возвращает альтернативный кодпоинт (с обратной логикой fe0f).
 * Если основной URL вернёт 404, этот вариант используется как fallback.
 */
export function emojiToCodepointAlt(emoji: string): string {
    const codepoints = getRawCodepoints(emoji);
    const hasZWJ = codepoints.includes('200d');

    if (hasZWJ) {
        // Альтернатива для ZWJ: убираем fe0f
        const withoutVS16 = codepoints.filter(cp => cp !== 'fe0f');
        return (withoutVS16.length > 0 ? withoutVS16 : codepoints).join('-');
    }

    // Альтернатива для обычных: оставляем fe0f (если он был)
    return codepoints.join('-');
}

/**
 * Возвращает URL SVG-изображения эмоджи через Twemoji CDN.
 */
export function getTwemojiUrl(emoji: string): string {
    return `${TWEMOJI_BASE}/${emojiToCodepoint(emoji)}.svg`;
}

/**
 * Возвращает альтернативный URL (с обратной логикой fe0f) для fallback.
 */
export function getTwemojiUrlAlt(emoji: string): string {
    return `${TWEMOJI_BASE}/${emojiToCodepointAlt(emoji)}.svg`;
}
