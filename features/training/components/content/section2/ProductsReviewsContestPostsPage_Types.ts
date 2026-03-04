// =====================================================================
// Типы для страницы «Посты конкурса отзывов товаров»
// =====================================================================

/** Статус участника конкурса */
export type ParticipantStatus = 'new' | 'processing' | 'commented' | 'error' | 'winner' | 'used';

/** Тип результата розыгрыша */
export type ResultType = 'success' | 'error' | 'skipped';

/** Запись участника конкурса (mock-данные) */
export interface MockEntry {
    id: string;
    entry_number?: number;
    user_photo?: string;
    user_name: string;
    user_vk_id: number;
    post_text: string;
    post_link: string;
    status: ParticipantStatus;
    created_at: string;
}
