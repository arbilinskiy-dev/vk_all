/**
 * Тесты: MessageStatsNotifications — прогресс-бары и уведомления.
 * Проверяем: отображение прогресса синхронизации/сверки, результатов, кнопок закрытия.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageStatsNotifications } from '../../features/messages/components/stats/MessageStatsNotifications';

// Дефолтные пропсы — всё пусто / неактивно
const defaultProps = {
    syncProgress: null,
    isSyncing: false,
    syncResult: null,
    onClearSyncResult: vi.fn(),
    reconcileProgress: null,
    isReconciling: false,
    reconcileResult: null,
    onClearReconcileResult: vi.fn(),
};

describe('MessageStatsNotifications', () => {

    it('пустые пропсы → ничего не рендерится', () => {
        const { container } = render(<MessageStatsNotifications {...defaultProps} />);
        expect(container.textContent).toBe('');
    });

    // --- Прогресс синхронизации ---

    it('прогресс синхронизации отображается при syncProgress + isSyncing', () => {
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isSyncing={true}
                syncProgress={{
                    message: 'Читаю логи...',
                    loaded: 50,
                    total: 100,
                } as any}
            />
        );
        expect(screen.getByText('Читаю логи...')).toBeInTheDocument();
    });

    it('прогресс синхронизации НЕ рендерится если isSyncing=false', () => {
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isSyncing={false}
                syncProgress={{ message: 'Читаю логи...', loaded: 50, total: 100 } as any}
            />
        );
        expect(screen.queryByText('Читаю логи...')).not.toBeInTheDocument();
    });

    // --- Результат синхронизации ---

    it('результат синхронизации (успех) рендерится когда isSyncing=false', () => {
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isSyncing={false}
                syncResult="Обработано 500 записей"
            />
        );
        expect(screen.getByText('Обработано 500 записей')).toBeInTheDocument();
    });

    it('результат с ошибкой имеет красный фон', () => {
        const { container } = render(
            <MessageStatsNotifications
                {...defaultProps}
                isSyncing={false}
                syncResult="Ошибка: timeout"
            />
        );
        expect(screen.getByText('Ошибка: timeout')).toBeInTheDocument();
        // Красный фон для ошибок
        const wrapper = screen.getByText('Ошибка: timeout').closest('div');
        expect(wrapper).toHaveClass('bg-red-50');
    });

    it('кнопка закрытия результата синхронизации вызывает onClearSyncResult', () => {
        const onClearSyncResult = vi.fn();
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isSyncing={false}
                syncResult="Готово"
                onClearSyncResult={onClearSyncResult}
            />
        );
        const closeBtn = screen.getByTitle('Закрыть');
        fireEvent.click(closeBtn);
        expect(onClearSyncResult).toHaveBeenCalledOnce();
    });

    // --- Прогресс сверки ---

    it('прогресс сверки отображается при reconcileProgress + isReconciling', () => {
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isReconciling={true}
                reconcileProgress={{ processed: 10, total: 50, percent: 20 }}
            />
        );
        expect(screen.getByText(/Сверка: 10 \/ 50 диалогов/)).toBeInTheDocument();
    });

    // --- Результат сверки ---

    it('результат сверки рендерится и кнопка закрытия работает', () => {
        const onClearReconcileResult = vi.fn();
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isReconciling={false}
                reconcileResult="Сверка завершена: 3 расхождения"
                onClearReconcileResult={onClearReconcileResult}
            />
        );
        expect(screen.getByText('Сверка завершена: 3 расхождения')).toBeInTheDocument();

        const closeBtns = screen.getAllByTitle('Закрыть');
        fireEvent.click(closeBtns[0]);
        expect(onClearReconcileResult).toHaveBeenCalledOnce();
    });

    it('результат сверки НЕ рендерится когда isReconciling=true', () => {
        render(
            <MessageStatsNotifications
                {...defaultProps}
                isReconciling={true}
                reconcileResult="Сверка завершена"
            />
        );
        expect(screen.queryByText('Сверка завершена')).not.toBeInTheDocument();
    });
});
