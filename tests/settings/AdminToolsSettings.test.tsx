/**
 * Тесты хаб-компонента AdminToolsSettings.
 * Покрывает: рендер без ошибок, отображение операций, базовое взаимодействие.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Мокаем API-модули, чтобы хук не делал реальных запросов
vi.mock('../../services/api/management.api', () => ({
    refreshAllSubscribers: vi.fn().mockResolvedValue({ taskId: 'task-sub-1' }),
    refreshAllPosts: vi.fn().mockResolvedValue({ taskId: 'task-posts-1' }),
}));

vi.mock('../../services/api/lists.api', () => ({
    getTaskStatus: vi.fn().mockResolvedValue({ status: 'done' }),
    getAllTasks: vi.fn().mockResolvedValue([]),
    deleteTask: vi.fn().mockResolvedValue(undefined),
}));

import { AdminToolsSettings } from '../../features/settings/components/AdminToolsSettings';

describe('AdminToolsSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Подавляем window.showAppToast, который вызывается из хука
        (window as any).showAppToast = vi.fn();
    });

    // ─── Рендер без ошибок ──────────────────────────────────────────────

    it('рендерится без ошибок', () => {
        const { container } = render(<AdminToolsSettings />);
        expect(container).toBeTruthy();
    });

    it('отображает заголовок "Админ-инструменты"', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Админ-инструменты')).toBeInTheDocument();
    });

    it('отображает бейдж "Массовые операции"', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Массовые операции')).toBeInTheDocument();
    });

    // ─── Таблица операций ───────────────────────────────────────────────

    it('отображает строку "Обновить подписчиков"', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Обновить подписчиков')).toBeInTheDocument();
    });

    it('отображает строку "Собрать посты"', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Собрать посты')).toBeInTheDocument();
    });

    it('отображает описания для обеих операций', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText(/Синхронизация списка подписчиков/)).toBeInTheDocument();
        expect(screen.getByText(/Сбор постов со стены/)).toBeInTheDocument();
    });

    it('отображает заголовки колонок таблицы', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Операция')).toBeInTheDocument();
        expect(screen.getByText('Описание')).toBeInTheDocument();
        expect(screen.getByText('Параметры')).toBeInTheDocument();
        expect(screen.getByText('Статус')).toBeInTheDocument();
        expect(screen.getByText('Действия')).toBeInTheDocument();
    });

    // ─── Кнопки управления ──────────────────────────────────────────────

    it('отображает кнопки "Старт" для обеих операций', () => {
        render(<AdminToolsSettings />);
        const startButtons = screen.getAllByText('Старт');
        expect(startButtons).toHaveLength(2);
    });

    it('отображает кнопки выбора лимита постов (100, 1000, Все)', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('Все')).toBeInTheDocument();
    });

    it('отображает кнопку "Актуализ."', () => {
        render(<AdminToolsSettings />);
        expect(screen.getByText('Актуализ.')).toBeInTheDocument();
    });

    // ─── Взаимодействие: выбор лимита ───────────────────────────────────

    it('позволяет переключить лимит постов на 100', async () => {
        const user = userEvent.setup();
        render(<AdminToolsSettings />);

        const btn100 = screen.getByText('100');
        await user.click(btn100);

        // Кнопка 100 должна стать активной (emerald-стиль)
        expect(btn100.className).toContain('bg-emerald-100');
    });

    // ─── Взаимодействие: запуск подписчиков ─────────────────────────────

    it('запускает задачу подписчиков по клику на "Старт"', async () => {
        const user = userEvent.setup();
        render(<AdminToolsSettings />);

        // Берём первую кнопку «Старт» (подписчики)
        const startButtons = screen.getAllByText('Старт');
        await user.click(startButtons[0]);

        // API управления должен быть вызван
        const mgmt = await import('../../services/api/management.api');
        expect(mgmt.refreshAllSubscribers).toHaveBeenCalledTimes(1);
    });
});
