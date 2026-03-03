/** Максимальная длина текста поста VK */
export const MAX_TEXT_LENGTH = 8206;

/** Пары авто-закрывающихся символов */
export const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '«': '»',
};
