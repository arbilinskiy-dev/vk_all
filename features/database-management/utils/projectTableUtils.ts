/**
 * Маскирование токена для отображения в таблице.
 * Показывает первые 7 и последние 4 символа, остальное заменяет на ****.
 */
export const maskToken = (token: string | undefined | null): string => {
    if (!token || token.length < 12) {
        return '••••••••••••';
    }
    return `${token.substring(0, 7)}****${token.substring(token.length - 4)}`;
};
