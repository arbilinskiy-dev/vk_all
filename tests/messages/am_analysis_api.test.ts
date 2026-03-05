/**
 * Тесты: API-сервис АМ-аналитики (am_analysis.api.ts).
 * Проверяем:
 * — типы экспортируются корректно
 * — getAmAnalysisDashboard вызывает callApi с правильными параметрами
 * — обработка ошибок
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем callApi перед импортом модуля
vi.mock('../../shared/utils/apiClient', () => ({
    callApi: vi.fn(),
}));

import { getAmAnalysisDashboard } from '../../services/api/am_analysis.api';
import { callApi } from '../../shared/utils/apiClient';

const mockCallApi = vi.mocked(callApi);

describe('am_analysis.api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // --- getAmAnalysisDashboard ---

    describe('getAmAnalysisDashboard', () => {
        it('вызывает callApi с правильным endpoint и дефолтным периодом', async () => {
            const mockResponse = {
                summary: { total_actions: 10, active_users: 2, total_dialogs_read: 5, total_unread_dialogs_read: 3, total_messages_sent: 3, total_labels_actions: 1, total_templates_actions: 1, period_days: 30 },
                user_stats: [],
                action_distribution: [],
                group_distribution: [],
                daily_chart: [],
                action_type_labels: {},
            };
            mockCallApi.mockResolvedValue(mockResponse);

            const result = await getAmAnalysisDashboard();

            expect(mockCallApi).toHaveBeenCalledTimes(1);
            expect(mockCallApi).toHaveBeenCalledWith(
                'messages/actions-analysis/dashboard',
                { period_days: 30 },
            );
            expect(result).toEqual(mockResponse);
        });

        it('передаёт кастомный period_days', async () => {
            mockCallApi.mockResolvedValue({
                summary: { period_days: 7 },
                user_stats: [],
                action_distribution: [],
                group_distribution: [],
                daily_chart: [],
                action_type_labels: {},
            });

            await getAmAnalysisDashboard({ period_days: 7 });

            expect(mockCallApi).toHaveBeenCalledWith(
                'messages/actions-analysis/dashboard',
                { period_days: 7 },
            );
        });

        it('передаёт period_days=90', async () => {
            mockCallApi.mockResolvedValue({
                summary: { period_days: 90 },
                user_stats: [],
                action_distribution: [],
                group_distribution: [],
                daily_chart: [],
                action_type_labels: {},
            });

            await getAmAnalysisDashboard({ period_days: 90 });

            expect(mockCallApi).toHaveBeenCalledWith(
                'messages/actions-analysis/dashboard',
                { period_days: 90 },
            );
        });

        it('пробрасывает ошибку при неудачном запросе', async () => {
            mockCallApi.mockRejectedValue(new Error('Not Found'));

            await expect(getAmAnalysisDashboard()).rejects.toThrow('Not Found');
        });

        it('возвращает полную структуру ответа с данными', async () => {
            const fullResponse = {
                summary: {
                    total_actions: 150,
                    active_users: 5,
                    total_dialogs_read: 80,
                    total_unread_dialogs_read: 45,
                    total_messages_sent: 30,
                    total_labels_actions: 25,
                    total_templates_actions: 15,
                    period_days: 30,
                },
                user_stats: [
                    {
                        user_id: 'u1',
                        username: 'admin',
                        full_name: 'Admin User',
                        role_name: 'Администратор',
                        role_color: '#6366f1',
                        total_actions: 100,
                        dialogs_read: 50,
                        unread_dialogs_read: 30,
                        messages_sent: 20,
                        mark_unread: 5,
                        toggle_important: 3,
                        labels: 15,
                        templates: 5,
                        promocodes: 2,
                        last_action_at: '2026-03-01T12:00:00',
                    },
                ],
                action_distribution: [
                    { action_type: 'message_dialog_read', label: 'Прочтение диалога', count: 80 },
                ],
                group_distribution: [
                    { group: 'dialogs', label: 'Работа с диалогами', count: 90 },
                ],
                daily_chart: [
                    { date: '2026-03-01', total: 30, dialogs_read: 15, unread_dialogs_read: 8, messages_sent: 10, labels: 3, templates: 2, unique_users: 3 },
                ],
                action_type_labels: { message_dialog_read: 'Вход в диалог', message_unread_dialog_read: 'Прочтение непрочитанного' },
            };
            mockCallApi.mockResolvedValue(fullResponse);

            const result = await getAmAnalysisDashboard({ period_days: 30 });

            expect(result.summary.total_actions).toBe(150);
            expect(result.user_stats).toHaveLength(1);
            expect(result.user_stats[0].username).toBe('admin');
            expect(result.action_distribution).toHaveLength(1);
            expect(result.group_distribution).toHaveLength(1);
            expect(result.daily_chart).toHaveLength(1);
        });
    });
});
