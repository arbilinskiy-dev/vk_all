/**
 * Тесты: apiClient — проверка auth-flow (X-Session-Token).
 *
 * Эти тесты ловят КРИТИЧНЫЕ проблемы, которые другие тесты НЕ видят:
 * - Не передаётся X-Session-Token → бэкенд отвечает 401
 * - Протухшая сессия → 401, диспатч события session-expired
 * - Отсутствие sessionStorage ключа → заголовок не добавляется
 *
 * Принцип: мокаем fetch, проверяем что callApi передаёт правильные headers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Мокаем config перед импортом
vi.mock('../../shared/config', () => ({
    API_BASE_URL: 'http://test-api.local/api',
}));

// Мокаем fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Мокаем sessionStorage
const mockSessionStorage: Record<string, string | null> = {};
vi.stubGlobal('sessionStorage', {
    getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockSessionStorage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockSessionStorage[key]; }),
});

// Мокаем window events
const mockDispatchEvent = vi.fn();
vi.stubGlobal('dispatchEvent', mockDispatchEvent);

// Мокаем localStorage (нужен для config.ts)
vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'local'),
    setItem: vi.fn(),
});

import { callApi } from '../../shared/utils/apiClient';

describe('apiClient auth-flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
    });

    // ─── X-Session-Token передача ────────────────────────────────

    describe('X-Session-Token', () => {
        it('добавляет X-Session-Token когда есть в sessionStorage', async () => {
            mockSessionStorage['vk-planner-session-token'] = 'test-token-123';
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ result: 'ok' }),
            });

            await callApi('messages/actions-analysis/dashboard', { period_days: 30 });

            const fetchCall = mockFetch.mock.calls[0];
            const headers = fetchCall[1].headers;
            expect(headers['X-Session-Token']).toBe('test-token-123');
        });

        it('НЕ добавляет X-Session-Token когда нет в sessionStorage', async () => {
            // sessionStorage пуст — нет ключа vk-planner-session-token
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ result: 'ok' }),
            });

            await callApi('messages/actions-analysis/dashboard', { period_days: 30 });

            const fetchCall = mockFetch.mock.calls[0];
            const headers = fetchCall[1].headers;
            expect(headers['X-Session-Token']).toBeUndefined();
        });

        it('всегда передаёт Content-Type: application/json', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({}),
            });

            await callApi('messages/send', { project_id: 'test' });

            const headers = mockFetch.mock.calls[0][1].headers;
            expect(headers['Content-Type']).toBe('application/json');
        });
    });

    // ─── 401 Handling ────────────────────────────────────────────

    describe('401 → session-expired event', () => {
        it('при 401 диспатчит vk-planner:session-expired', async () => {
            mockSessionStorage['vk-planner-session-token'] = 'expired-token';
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => JSON.stringify({ detail: 'Сессия истекла' }),
            });

            await expect(callApi('messages/send', {})).rejects.toThrow();

            // Проверяем, что был вызван window.dispatchEvent с событием session-expired
            expect(mockDispatchEvent).toHaveBeenCalled();
            const event = mockDispatchEvent.mock.calls[0][0];
            expect(event.type).toBe('vk-planner:session-expired');
        });

        it('при 401 на auth/ эндпоинте НЕ диспатчит session-expired', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => JSON.stringify({ detail: 'Неверный пароль' }),
            });

            await expect(callApi('auth/login', {})).rejects.toThrow();

            // НЕ должен диспатчить session-expired для auth/ эндпоинтов
            const sessionExpiredEvents = mockDispatchEvent.mock.calls.filter(
                (call: any[]) => call[0]?.type === 'vk-planner:session-expired'
            );
            expect(sessionExpiredEvents).toHaveLength(0);
        });

        it('при 401 без токена — ошибка выбрасывается', async () => {
            // Нет токена в sessionStorage
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => JSON.stringify({ detail: 'Сессия не найдена' }),
            });

            await expect(
                callApi('messages/actions-analysis/dashboard', { period_days: 30 })
            ).rejects.toThrow('Сессия не найдена');
        });
    });

    // ─── Правильный URL ──────────────────────────────────────────

    describe('URL формирование', () => {
        it('формирует правильный URL для dashboard', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({}),
            });

            await callApi('messages/actions-analysis/dashboard', { period_days: 30 });

            const url = mockFetch.mock.calls[0][0];
            expect(url).toBe('http://test-api.local/api/messages/actions-analysis/dashboard');
        });

        it('формирует правильный URL для send', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({}),
            });

            await callApi('messages/send', { project_id: 'test' });

            const url = mockFetch.mock.calls[0][0];
            expect(url).toBe('http://test-api.local/api/messages/send');
        });
    });

    // ─── 4xx не ретраится ────────────────────────────────────────

    describe('retry поведение', () => {
        it('401 НЕ ретраится (выбрасывается сразу)', async () => {
            mockSessionStorage['vk-planner-session-token'] = 'bad-token';
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => JSON.stringify({ detail: 'Сессия не найдена' }),
            });

            await expect(callApi('messages/send', {})).rejects.toThrow();

            // fetch вызван только 1 раз (нет ретрая для 4xx)
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('404 НЕ ретраится', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                text: async () => JSON.stringify({ detail: 'Not Found' }),
            });

            await expect(callApi('nonexistent/endpoint', {})).rejects.toThrow();

            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });

    // ─── POST метод по умолчанию ─────────────────────────────────

    describe('HTTP метод', () => {
        it('по умолчанию использует POST', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({}),
            });

            await callApi('messages/actions-analysis/dashboard', {});

            const method = mockFetch.mock.calls[0][1].method;
            expect(method).toBe('POST');
        });

        it('body содержит JSON payload для POST', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                text: async () => JSON.stringify({}),
            });

            await callApi('messages/send', { project_id: 'p1', user_id: 123, message: 'hi' });

            const body = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(body.project_id).toBe('p1');
            expect(body.user_id).toBe(123);
            expect(body.message).toBe('hi');
        });
    });
});
