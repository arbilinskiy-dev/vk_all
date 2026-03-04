/**
 * conversationsCache — in-memory кеш данных диалогов по проектам.
 *
 * Стратегия: stale-while-revalidate
 * - При переключении на ранее открытый проект — мгновенно возвращаем кешированные данные
 * - Фоново загружаем свежие данные и плавно ДООБНОВЛЯЕМ (без скелетонов)
 * - SSE-события (updateUnreadCount, updateLastMessage и т.д.) обновляют кеш инкрементально
 *
 * Кеш живёт на уровне модуля (синглтон) — не теряется при ремаунте хуков.
 * Макс. 20 проектов (LRU) чтобы не раздувать память.
 */

import { SystemListSubscriber } from '../../../../shared/types';
import { VkMessageItem } from '../../../../services/api/messages.api';
import { msgLog } from '../../utils/messagesLogger';

/** Снэпшот данных одного проекта */
export interface ConversationsCacheEntry {
    /** Подписчики (основные данные) */
    subscribers: SystemListSubscriber[];
    /** Общее кол-во пользователей в рассылке */
    totalCount: number;
    /** Общее кол-во непрочитанных диалогов */
    totalUnreadCount: number;
    /** Словарь непрочитанных: vk_user_id → count */
    unreadCountsMap: Record<number, number>;
    /** Словарь последних сообщений: vk_user_id → VkMessageItem */
    lastMessagesMap: Record<number, VkMessageItem>;
    /** Словарь пометок «Важное»: vk_user_id → true */
    importantMap: Record<number, boolean>;
    /** Словарь меток диалогов: vk_user_id → [label_id, ...] */
    dialogLabelsMap: Record<number, string[]>;
    /** Timestamp последнего обновления — для логов и диагностики */
    updatedAt: number;
    /** Последний активный фильтр */
    filterUnread: 'all' | 'unread' | 'important';
}

/** Максимальное количество кешированных проектов (LRU) */
const MAX_CACHE_SIZE = 20;

/** Хранилище: projectId → кеш */
const cache = new Map<string, ConversationsCacheEntry>();

/** 
 * Порядок доступа (LRU): последний обращённый проект — в конце массива.
 * При превышении MAX_CACHE_SIZE удаляем первый (самый давний).
 */
const accessOrder: string[] = [];

/** Обновить LRU-порядок: перенести projectId в конец */
function touchLRU(projectId: string) {
    const idx = accessOrder.indexOf(projectId);
    if (idx !== -1) accessOrder.splice(idx, 1);
    accessOrder.push(projectId);
}

/** Вытеснить самые старые записи если превышен лимит */
function evictIfNeeded() {
    while (accessOrder.length > MAX_CACHE_SIZE) {
        const oldest = accessOrder.shift();
        if (oldest) {
            cache.delete(oldest);
            msgLog('CONVERSATIONS', `🗑️ Кеш: вытеснен проект ${oldest.slice(0, 8)}… (LRU, макс. ${MAX_CACHE_SIZE})`);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// Публичный API
// ═══════════════════════════════════════════════════════════════

/** Получить кешированные данные проекта (или null) */
export function getCachedConversations(projectId: string): ConversationsCacheEntry | null {
    const entry = cache.get(projectId);
    if (entry) {
        touchLRU(projectId);
        const age = Math.round((Date.now() - entry.updatedAt) / 1000);
        msgLog('CONVERSATIONS', `📦 Кеш HIT: ${projectId.slice(0, 8)}…, ${entry.subscribers.length} подписчиков, возраст ${age}с`);
    }
    return entry ?? null;
}

/** Сохранить / обновить данные проекта в кеше */
export function setCachedConversations(projectId: string, data: Omit<ConversationsCacheEntry, 'updatedAt'>): void {
    cache.set(projectId, { ...data, updatedAt: Date.now() });
    touchLRU(projectId);
    evictIfNeeded();
    msgLog('CONVERSATIONS', `📦 Кеш SET: ${projectId.slice(0, 8)}…, ${data.subscribers.length} подписчиков, ${data.totalUnreadCount} непрочитанных`);
}

/** Удалить кеш конкретного проекта */
export function clearProjectCache(projectId: string): void {
    cache.delete(projectId);
    const idx = accessOrder.indexOf(projectId);
    if (idx !== -1) accessOrder.splice(idx, 1);
}

/** Очистить весь кеш (при логауте и т.п.) */
export function clearAllConversationsCache(): void {
    cache.clear();
    accessOrder.length = 0;
    msgLog('CONVERSATIONS', '🗑️ Кеш: полная очистка');
}

/** Проверить наличие кеша для проекта */
export function hasCachedConversations(projectId: string): boolean {
    return cache.has(projectId);
}
