/**
 * Константы и типы для ChatInput.
 */

/** Максимальная длина сообщения VK */
export const MAX_MESSAGE_LENGTH = 4096;

/** Пары авто-закрывающихся символов */
export const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '«': '»',
};

/** Частные переменные для сообщений */
export const MESSAGE_SPECIFIC_VARIABLES = [
    { name: 'Имя пользователя', value: '{username}', description: 'Имя собеседника из VK (first_name)' },
];

/** Тип прикреплённого файла */
export interface AttachedFile {
    id: string;
    file: File;
    previewUrl: string;
    type: 'photo' | 'video' | 'document';
}

/** Интервал throttle для отправки typing в VK (мс) */
export const TYPING_THROTTLE_MS = 10000;

/** Классы кнопок тулбара */
export const TOOLBAR_BTN_CLASS = "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors";
export const TOOLBAR_BTN_DISABLED_CLASS = "p-1.5 rounded text-gray-300 cursor-default";
