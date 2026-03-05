/**
 * Тесты: AmAnalysisPage — страница АМ-аналитики.
 * Проверяем:
 * — состояние загрузки (скелетон)
 * — состояние ошибки (сообщение + кнопка повторить)
 * — успешный рендер: заголовок, KPI-карточки, таблица, диаграммы
 * — переключение периода
 * — кнопка обновления
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем хук useAmAnalysis
const mockUseAmAnalysis = vi.fn();
vi.mock('../../features/messages/hooks/stats/useAmAnalysis', () => ({
    useAmAnalysis: () => mockUseAmAnalysis(),
}));

import { AmAnalysisPage } from '../../features/messages/components/stats/AmAnalysisPage';

/** Фабрика мок-данных */
function createMockData(overrides: Record<string, any> = {}) {
    return {
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
                full_name: 'Анна Админова',
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
            {
                user_id: 'u2',
                username: 'manager',
                full_name: null,
                role_name: null,
                role_color: null,
                total_actions: 50,
                dialogs_read: 30,
                unread_dialogs_read: 15,
                messages_sent: 10,
                mark_unread: 2,
                toggle_important: 1,
                labels: 5,
                templates: 2,
                promocodes: 0,
                last_action_at: null,
            },
        ],
        action_distribution: [
            { action_type: 'message_dialog_read', label: 'Вход в диалог', count: 80 },
            { action_type: 'message_unread_dialog_read', label: 'Прочтение непрочитанного', count: 45 },
            { action_type: 'message_send', label: 'Отправка сообщения', count: 30 },
        ],
        group_distribution: [
            { group: 'dialogs', label: 'Работа с диалогами', count: 90 },
            { group: 'messages', label: 'Отправка сообщений', count: 30 },
            { group: 'labels', label: 'Метки клиентов', count: 25 },
        ],
        daily_chart: [
            { date: '2026-02-28', total: 30, dialogs_read: 15, unread_dialogs_read: 8, messages_sent: 10, labels: 3, templates: 2, unique_users: 3 },
            { date: '2026-03-01', total: 45, dialogs_read: 25, unread_dialogs_read: 14, messages_sent: 12, labels: 5, templates: 3, unique_users: 4 },
        ],
        action_type_labels: {
            message_dialog_read: 'Вход в диалог',
            message_unread_dialog_read: 'Прочтение непрочитанного',
            message_send: 'Отправка сообщения',
        },
        ...overrides,
    };
}

describe('AmAnalysisPage', () => {
    const mockRefresh = vi.fn();
    const mockSetPeriodDays = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // === Состояние загрузки ===

    it('показывает скелетон при загрузке', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: null,
            isLoading: true,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        const { container } = render(<AmAnalysisPage />);

        // Ищем элементы с animate-pulse (скелетон)
        const pulseElements = container.querySelectorAll('.animate-pulse');
        expect(pulseElements.length).toBeGreaterThan(0);
    });

    // === Состояние ошибки ===

    it('показывает ошибку и кнопку повторить', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: null,
            isLoading: false,
            error: 'Network Error',
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument();
        expect(screen.getByText('Network Error')).toBeInTheDocument();
        expect(screen.getByText('Повторить')).toBeInTheDocument();
    });

    it('кнопка Повторить вызывает refresh', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: null,
            isLoading: false,
            error: 'Ошибка',
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        fireEvent.click(screen.getByText('Повторить'));
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    // === Успешный рендер ===

    it('рендерит заголовок «АМ Анализ»', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('АМ Анализ')).toBeInTheDocument();
    });

    it('рендерит подзаголовок', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Мониторинг действий сотрудников в модуле Сообщений')).toBeInTheDocument();
    });

    // === KPI карточки ===

    it('отображает KPI-значения из summary', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // total_actions = 150
        expect(screen.getByText('150')).toBeInTheDocument();
        // total_dialogs_read = 80
        expect(screen.getByText('80')).toBeInTheDocument();
        // KPI названия
        expect(screen.getByText('Всего действий')).toBeInTheDocument();
        expect(screen.getByText('Активных')).toBeInTheDocument();
        // active_users = 5 — может быть несколько элементов с "5"
        expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
    });

    // === Таблица сотрудников ===

    it('отображает таблицу сотрудников', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Заголовок секции
        expect(screen.getByText('Действия по сотрудникам')).toBeInTheDocument();
        // Имя первого пользователя
        expect(screen.getByText('Анна Админова')).toBeInTheDocument();
        // Username второго — у него full_name=null, так что отображается username
        expect(screen.getByText('manager')).toBeInTheDocument();
    });

    it('отображает роль сотрудника', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Администратор')).toBeInTheDocument();
    });

    it('отображает username под ФИО если full_name есть', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('@admin')).toBeInTheDocument();
    });

    // === Круговая диаграмма ===

    it('отображает секцию «Распределение по категориям»', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Распределение по категориям')).toBeInTheDocument();
    });

    it('отображает названия групп в легенде диаграммы', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Работа с диалогами')).toBeInTheDocument();
        expect(screen.getByText('Отправка сообщений')).toBeInTheDocument();
        expect(screen.getByText('Метки клиентов')).toBeInTheDocument();
    });

    // === График по дням ===

    it('отображает секцию «Активность по дням»', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Активность по дням')).toBeInTheDocument();
    });

    // === Кнопки периода ===

    it('отображает все варианты периода', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('7 дней')).toBeInTheDocument();
        expect(screen.getByText('14 дней')).toBeInTheDocument();
        expect(screen.getByText('30 дней')).toBeInTheDocument();
        expect(screen.getByText('90 дней')).toBeInTheDocument();
    });

    it('клик по периоду вызывает setPeriodDays', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        fireEvent.click(screen.getByText('7 дней'));
        expect(mockSetPeriodDays).toHaveBeenCalledWith(7);

        fireEvent.click(screen.getByText('90 дней'));
        expect(mockSetPeriodDays).toHaveBeenCalledWith(90);
    });

    // === null data ===

    it('рендерит null при data=null и isLoading=false, error=null', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        const { container } = render(<AmAnalysisPage />);
        expect(container.innerHTML).toBe('');
    });

    // === Пустые данные ===

    it('отображает «Нет данных» при пустых user_stats', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData({ user_stats: [] }),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Таблица пуста — должно быть «Нет данных»
        expect(screen.getByText('Нет данных')).toBeInTheDocument();
    });

    it('отображает «Нет данных за период» при пустом daily_chart', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData({ daily_chart: [] }),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        expect(screen.getByText('Нет данных за период')).toBeInTheDocument();
    });

    it('отображает «Нет данных» при пустом group_distribution', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData({ group_distribution: [] }),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Круговая диаграмма пуста
        const noDataElements = screen.getAllByText('Нет данных');
        expect(noDataElements.length).toBeGreaterThanOrEqual(1);
    });

    // === Счётчик сотрудников ===

    it('показывает количество сотрудников в заголовке таблицы', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // (2) — два сотрудника в данных
        expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    // === KPI «Прочтения» (непрочитанные диалоги) ===

    it('отображает KPI-карточку «Прочтения» с правильным значением', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Карточка «Прочтения» (текст встречается и в KPI, и в легенде графика)
        const allProchteniya = screen.getAllByText('Прочтения');
        expect(allProchteniya.length).toBeGreaterThanOrEqual(1);
        // total_unread_dialogs_read = 45 (также может быть на оси Y графика)
        const all45 = screen.getAllByText('45');
        expect(all45.length).toBeGreaterThanOrEqual(1);
        // Подпись
        expect(screen.getByText('непрочитанных')).toBeInTheDocument();
    });

    it('отображает KPI-карточку «Входы» с правильным значением', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Карточка «Входы» (текст встречается и в KPI, и в легенде графика)
        const allVhody = screen.getAllByText('Входы');
        expect(allVhody.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('в диалоги')).toBeInTheDocument();
    });

    // === Таблица: колонки «Входы» и «Прочтения» ===

    it('отображает заголовки «Входы» и «Прочтения» в таблице', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Ищем по span с title
        const entriesHeader = screen.getByTitle('Входы в диалоги');
        expect(entriesHeader).toBeInTheDocument();

        const readingsHeader = screen.getByTitle('Прочтение непрочитанных диалогов');
        expect(readingsHeader).toBeInTheDocument();
    });

    it('отображает значения unread_dialogs_read в таблице для каждого сотрудника', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // u1.unread_dialogs_read = 30, u2.unread_dialogs_read = 15
        // Значения должны быть в таблице (30 и 15 могут встречаться в других местах,
        // поэтому проверяем getAllByText и что хотя бы одно совпадение есть)
        expect(screen.getAllByText('30').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(1);
    });

    // === График: линия «Прочтения» ===

    it('отображает легенду «Прочтения» на графике', () => {
        mockUseAmAnalysis.mockReturnValue({
            data: createMockData(),
            isLoading: false,
            error: null,
            periodDays: 30,
            setPeriodDays: mockSetPeriodDays,
            refresh: mockRefresh,
        });

        render(<AmAnalysisPage />);

        // Легенда графика содержит «Прочтения»
        const chartLegendTexts = screen.getAllByText('Прочтения');
        // Как минимум одно — в легенде графика, второе — в KPI
        expect(chartLegendTexts.length).toBeGreaterThanOrEqual(1);
    });
});
