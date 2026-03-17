/**
 * @file MessageStatsHeader.test.tsx
 * @description Тесты компонента MessageStatsHeader — заголовок страницы мониторинга сообщений.
 * Проверяет рендер заголовка, подтекста, трёх кнопок и их disabled-состояния.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageStatsHeader } from '../../features/messages/components/stats/MessageStatsHeader';

// Дефолтные пропсы для переиспользования
const defaultProps = {
    isReconciling: false,
    isSyncing: false,
    onReconcile: vi.fn(),
    onSyncFromLogs: vi.fn(),
    onRefresh: vi.fn(),
};

describe('MessageStatsHeader', () => {
    it('рендерит заголовок и подтекст', () => {
        render(<MessageStatsHeader {...defaultProps} />);

        expect(screen.getByText('Мониторинг сообщений')).toBeInTheDocument();
        expect(screen.getByText('Нагрузка по всем проектам')).toBeInTheDocument();
    });

    it('рендерит 3 кнопки: Сверка, Синхр. из логов, Обновить', () => {
        render(<MessageStatsHeader {...defaultProps} />);

        expect(screen.getByText('Сверка')).toBeInTheDocument();
        expect(screen.getByText('Синхр. из логов')).toBeInTheDocument();
        expect(screen.getByText('Обновить')).toBeInTheDocument();
    });

    it('клик по кнопкам вызывает соответствующие callback-и', () => {
        const onReconcile = vi.fn();
        const onSyncFromLogs = vi.fn();
        const onRefresh = vi.fn();

        render(
            <MessageStatsHeader
                {...defaultProps}
                onReconcile={onReconcile}
                onSyncFromLogs={onSyncFromLogs}
                onRefresh={onRefresh}
            />
        );

        fireEvent.click(screen.getByText('Сверка'));
        expect(onReconcile).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Синхр. из логов'));
        expect(onSyncFromLogs).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Обновить'));
        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('кнопка "Сверка" disabled при isReconciling=true, текст меняется', () => {
        render(<MessageStatsHeader {...defaultProps} isReconciling={true} />);

        // При isReconciling текст меняется на «Сверка...»
        const btn = screen.getByText('Сверка...').closest('button');
        expect(btn).toBeDisabled();
    });

    it('кнопка "Синхр. из логов" disabled при isSyncing=true, текст меняется', () => {
        render(<MessageStatsHeader {...defaultProps} isSyncing={true} />);

        // При isSyncing текст меняется на «Синхронизация...»
        const btn = screen.getByText('Синхронизация...').closest('button');
        expect(btn).toBeDisabled();
    });
});
