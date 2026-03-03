/**
 * Утилита для генерации/получения уникального ID менеджера (вкладки браузера).
 * 
 * Хранится в sessionStorage — каждая вкладка получает свой уникальный ID.
 * Это критично для корректной работы dialog_focus: если две вкладки одного
 * браузера (одного origin) используют один ID, фильтрация "свой менеджер"
 * и cleanup при disconnect ломаются.
 * 
 * Используется в useMessagesSSE и MessagesPage для идентификации менеджера.
 */

const STORAGE_KEY = 'vk_planner_manager_id';

export function getManagerId(): string {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = `mgr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}
