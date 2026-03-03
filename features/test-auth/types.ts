// Типы для VK Test Auth модуля

// VK ID SDK — глобальное объявление
declare global {
  interface Window {
    VKIDSDK: any;
  }
}

// Интерфейс для VK пользователя из БД
export interface VkUserFromDb {
    vk_user_id: string;
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    email: string | null;
    scope: string | null;
    app_id: string | null;
    is_active: boolean;
    access_token: string | null;
    last_login: string | null;
    created_at: string | null;
    token_expires_at: string | null;
}

// Интерфейс для VK группы
export interface VkGroup {
    id: number;
    name: string;
    screen_name: string;
    is_closed: number;
    type: string;
    photo_200?: string;
    members_count?: number;
    description?: string;
}
