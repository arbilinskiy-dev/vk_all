// =====================================================================
// Типы данных для моков участников списков (Центр обучения)
// =====================================================================

/**
 * Пропсы для базовой строки таблицы участника (раздел 3.2.1)
 */
export interface MockMemberRowProps {
    user: {
        photo_url?: string;
        first_name: string;
        last_name: string;
        vk_user_id: number;
        domain?: string;
        has_mobile?: boolean;
        sex?: number;
        bdate?: string;
        city?: string;
        last_seen?: number;
        platform?: number;
        deactivated?: string;
        is_closed?: boolean;
        added_at: string;
        source?: string;
    };
}

/**
 * Тип участника для расширенных компонентов (раздел 3.2.3)
 * На основе реального SystemListSubscriber
 */
export interface MockMember {
    id: string;
    vk_user_id: number;
    first_name: string;
    last_name: string;
    domain?: string;
    photo_url?: string;
    sex?: number;              // 1 - женский, 2 - мужской
    bdate?: string;            // Формат: "15.3.1995"
    city?: string;
    country?: string;
    has_mobile?: boolean;
    last_seen?: number;        // Unix timestamp
    platform?: number;         // 1-m.vk, 2-iOS, 3-iPad, 4-Android, 6-Win, 7-Web
    added_at: string;          // ISO дата
    deactivated?: string;      // "banned" | "deleted"
    is_closed?: boolean;
    source: string;            // "manual" | "callback" | "conversation" | "posts_sync"
}
