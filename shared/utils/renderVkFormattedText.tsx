// renderVkFormattedText — утилита для парсинга VK-разметки в React-элементы.
// Поддерживает:
//   - Упоминания пользователей: @id12345 (Текст ссылки)
//   - Упоминания сообществ: @club12345 (Текст ссылки)
//   - Упоминания по screen_name: @testagencymvp (Текст ссылки)
//   - Альтернативный синтаксис: [id12345|Текст ссылки], [club12345|Текст ссылки]
//   - Произвольные ссылки: [https://example.com|Текст ссылки]
//   - Обычные URL: https://example.com, vk.cc/xxx
//   - Хэштеги: #тег, #тег@club

import React from 'react';

/**
 * Регулярное выражение для парсинга VK-разметки.
 * 
 * Группы:
 * 1. @-синтаксис: тип сущности (id, club, public, event)
 * 2. @-синтаксис: числовой идентификатор
 * 3. @-синтаксис: текст ссылки (в скобках)
 * 4. []-синтаксис: тип сущности
 * 5. []-синтаксис: числовой идентификатор
 * 6. []-синтаксис: текст ссылки (после |)
 * 7. [URL|Текст]-синтаксис: произвольная ссылка (URL)
 * 8. [URL|Текст]-синтаксис: текст ссылки
 * 9. @screen_name-синтаксис: короткое имя сообщества/пользователя (латиница, цифры, _, .)
 * 10. @screen_name-синтаксис: текст ссылки (в скобках)
 * 11. Обычный URL: с протоколом (https://...) или короткий домен с путём (vk.cc/xxx)
 * 12. Хэштег: полный текст тега (включая @club часть)
 */
const VK_MARKUP_REGEX = /@(id|club|public|event)(\d+)\s*\(([^)]+)\)|\[(id|club|public|event)(\d+)\|([^\]]+)\]|\[(https?:\/\/[^|\]]+)\|([^\]]+)\]|@([a-zA-Z][\w.]{2,31})\s*\(([^)]+)\)|(https?:\/\/[^\s<>\[\]]+|[a-zA-Z0-9][a-zA-Z0-9.-]*\.(?:cc|ly|me|ru|com|net|org|io|co|pro|link|рф)\/[^\s<>\[\]]+)|#([\wа-яёА-ЯЁ]+(?:@[\wа-яёА-ЯЁ]+)?)/g;

/**
 * Формирует URL профиля VK по типу и ID.
 */
function buildVkUrl(type: string, id: string): string {
    return `https://vk.com/${type}${id}`;
}

/**
 * Парсит текст с VK-разметкой и возвращает массив React-элементов.
 * Обычный текст остаётся как есть, а упоминания и хэштеги — как кликабельные ссылки.
 * 
 * @param text — исходный текст с VK-разметкой
 * @returns массив ReactNode для рендера
 */
export function renderVkFormattedText(text: string, linkClassName?: string): React.ReactNode[] {
    if (!text) return [];

    // Стиль ссылок по умолчанию — стандартный синий
    const cls = linkClassName || 'text-blue-600 hover:underline cursor-pointer';

    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIndex = 0;

    // Сбрасываем lastIndex регулярки (она глобальная)
    VK_MARKUP_REGEX.lastIndex = 0;

    while ((match = VK_MARKUP_REGEX.exec(text)) !== null) {
        // Добавляем обычный текст перед найденным совпадением
        if (match.index > lastIndex) {
            result.push(text.slice(lastIndex, match.index));
        }

        // Определяем, какой синтаксис сработал
        if (match[1] && match[2] && match[3]) {
            // @-синтаксис: @id12345 (Текст ссылки)
            const type = match[1];
            const id = match[2];
            const linkText = match[3].trim();
            const url = buildVkUrl(type, id);

            result.push(
                <a
                    key={`vk-link-${keyIndex++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </a>
            );
        } else if (match[4] && match[5] && match[6]) {
            // []-синтаксис: [id12345|Текст ссылки]
            const type = match[4];
            const id = match[5];
            const linkText = match[6].trim();
            const url = buildVkUrl(type, id);

            result.push(
                <a
                    key={`vk-link-${keyIndex++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </a>
            );
        } else if (match[7] && match[8]) {
            // [URL|Текст]-синтаксис: [https://example.com|Текст ссылки]
            const url = match[7].trim();
            const linkText = match[8].trim();

            result.push(
                <a
                    key={`vk-link-${keyIndex++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </a>
            );
        } else if (match[9] && match[10]) {
            // @screen_name-синтаксис: @testagencymvp (Тестовое сообщество)
            const screenName = match[9];
            const linkText = match[10].trim();
            const url = `https://vk.com/${screenName}`;

            result.push(
                <a
                    key={`vk-link-${keyIndex++}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    {linkText}
                </a>
            );
        } else if (match[11]) {
            // Обычный URL: https://example.com или vk.cc/xxx
            let rawUrl = match[11];
            // Убираем завершающую пунктуацию (точка, запятая и т.д.), которая не является частью URL
            const trailingPunct = rawUrl.match(/[.,;:!?)]+$/);
            if (trailingPunct) {
                rawUrl = rawUrl.slice(0, -trailingPunct[0].length);
                // Сдвигаем lastIndex назад, чтобы пунктуация попала в обычный текст
                VK_MARKUP_REGEX.lastIndex -= trailingPunct[0].length;
            }
            // Добавляем протокол, если его нет
            const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

            result.push(
                <a
                    key={`vk-url-${keyIndex++}`}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    {rawUrl}
                </a>
            );
        } else if (match[12]) {
            // Хэштег: #тег или #тег@club
            const tag = match[12];
            // Формируем ссылку поиска VK по хэштегу
            const hashtagUrl = `https://vk.com/feed?section=search&q=%23${encodeURIComponent(tag)}`;

            result.push(
                <a
                    key={`vk-hashtag-${keyIndex++}`}
                    href={hashtagUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                    onClick={(e) => e.stopPropagation()}
                >
                    #{tag}
                </a>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Добавляем оставшийся текст после последнего совпадения
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result.length > 0 ? result : [text];
}
