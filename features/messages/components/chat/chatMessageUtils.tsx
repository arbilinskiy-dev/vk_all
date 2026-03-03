/**
 * Утилиты для компонента ChatMessage.
 * Форматирование длительности, размера файла, подсветка поиска,
 * рендер VK-разметки (ссылки, упоминания, хэштеги).
 */
import React from 'react';
import { renderVkFormattedText } from '../../../../shared/utils/renderVkFormattedText';

/** Форматирование длительности видео (пусто если нет) */
export function formatDuration(seconds?: number): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Форматирование длительности аудио (0:00 если нет) */
export function formatAudioDuration(seconds?: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Форматирование размера файла */
export function formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

/** Подсветка совпадений поискового запроса в тексте сообщения */
export function highlightText(text: string, query: string, isOutgoing: boolean): React.ReactNode {
    const q = query.trim().toLowerCase();
    if (!q) return text;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const lowerText = text.toLowerCase();
    
    let idx = lowerText.indexOf(q, lastIndex);
    while (idx !== -1) {
        // Текст до совпадения
        if (idx > lastIndex) {
            parts.push(text.slice(lastIndex, idx));
        }
        // Само совпадение — выделяем
        parts.push(
            <mark
                key={idx}
                className={`px-0.5 rounded-sm ${
                    isOutgoing 
                        ? 'bg-yellow-300/40 text-white' 
                        : 'bg-yellow-200 text-gray-900'
                }`}
            >
                {text.slice(idx, idx + q.length)}
            </mark>
        );
        lastIndex = idx + q.length;
        idx = lowerText.indexOf(q, lastIndex);
    }
    
    // Остаток текста
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
}

/**
 * Рендер текста сообщения с VK-разметкой и (опционально) подсветкой поиска.
 * Обрабатывает: упоминания (@id, [club|Текст]), произвольные ссылки ([url|Текст]),
 * обычные URL, хэштеги (#тег). Стили ссылок адаптируются под тему бабла.
 */
export function renderChatMessageText(
    text: string,
    searchQuery: string | undefined,
    isOutgoing: boolean
): React.ReactNode {
    // Стиль ссылок: для исходящих (тёмный фон) — светлые, для входящих — стандартные синие
    const linkClassName = isOutgoing
        ? 'text-blue-200 hover:text-blue-100 underline cursor-pointer'
        : 'text-blue-600 hover:underline cursor-pointer';

    // Парсим VK-разметку
    const formatted = renderVkFormattedText(text, linkClassName);

    // Если нет поискового запроса — возвращаем как есть
    if (!searchQuery?.trim()) {
        return <>{formatted}</>;
    }

    // Совмещаем: для текстовых узлов применяем подсветку поиска,
    // для JSX-элементов (ссылки) — оставляем без изменений
    return <>{formatted.map((node, i) => {
        if (typeof node === 'string') {
            return <React.Fragment key={`hl-${i}`}>{highlightText(node, searchQuery, isOutgoing)}</React.Fragment>;
        }
        return node;
    })}</>;
}
