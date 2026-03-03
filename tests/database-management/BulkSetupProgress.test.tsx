/**
 * Тесты: BulkSetupProgress
 * Проверяем подкомпонент прогресс-бара массовой настройки
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BulkSetupProgress } from '../../features/database-management/components/modals/BulkSetupProgress';
import { BulkSetupStats } from '../../features/database-management/components/modals/types';

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof BulkSetupProgress>> = {}) {
    return {
        currentIndex: 3,
        totalCount: 10,
        progressPercent: 30,
        currentProjectName: 'Тестовый проект',
        stats: { success: 2, errors: 1, created: 1, updated: 1, eventsUpdated: 0 } as BulkSetupStats,
        hasResults: true,
        ...overrides,
    };
}

describe('BulkSetupProgress', () => {
    it('отображает прогресс: текущий / всего', () => {
        render(<BulkSetupProgress {...createProps()} />);
        expect(screen.getByText('Настройка: 3 / 10')).toBeInTheDocument();
    });

    it('отображает процент прогресса', () => {
        render(<BulkSetupProgress {...createProps()} />);
        expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('отображает имя текущего проекта', () => {
        render(<BulkSetupProgress {...createProps()} />);
        expect(screen.getByText('Тестовый проект')).toBeInTheDocument();
    });

    it('отображает текст «Настройка Callback-сервера...»', () => {
        render(<BulkSetupProgress {...createProps()} />);
        expect(screen.getByText('Настройка Callback-сервера...')).toBeInTheDocument();
    });

    it('показывает промежуточную статистику при hasResults=true', () => {
        render(<BulkSetupProgress {...createProps()} />);
        expect(screen.getByText(/Успешно: 2/)).toBeInTheDocument();
        expect(screen.getByText(/Ошибки: 1/)).toBeInTheDocument();
    });

    it('НЕ показывает статистику при hasResults=false', () => {
        render(<BulkSetupProgress {...createProps({ hasResults: false })} />);
        expect(screen.queryByText(/Успешно:/)).not.toBeInTheDocument();
    });

    it('НЕ показывает счётчик ошибок при 0 ошибок', () => {
        render(<BulkSetupProgress {...createProps({
            stats: { success: 3, errors: 0, created: 0, updated: 0, eventsUpdated: 0 },
        })} />);
        expect(screen.queryByText(/Ошибки:/)).not.toBeInTheDocument();
    });

    it('корректно отображает 100% при завершении', () => {
        render(<BulkSetupProgress {...createProps({
            currentIndex: 10,
            totalCount: 10,
            progressPercent: 100,
        })} />);
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Настройка: 10 / 10')).toBeInTheDocument();
    });
});
