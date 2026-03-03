/**
 * Тесты: BulkSetupResults
 * Проверяем подкомпонент итогов массовой настройки
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BulkSetupResults } from '../../features/database-management/components/modals/BulkSetupResults';
import { ProjectSetupResult, BulkSetupStats } from '../../features/database-management/components/modals/types';

/** Базовая статистика */
function createStats(overrides: Partial<BulkSetupStats> = {}): BulkSetupStats {
    return { success: 5, errors: 0, created: 3, updated: 2, eventsUpdated: 0, ...overrides };
}

/** Мок-результат ошибки */
function createError(overrides: Partial<ProjectSetupResult> = {}): ProjectSetupResult {
    return {
        projectId: 'err-1',
        projectName: 'Проект Ошибка',
        success: false,
        message: 'Ошибка VK API',
        ...overrides,
    };
}

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof BulkSetupResults>> = {}) {
    return {
        stats: createStats(),
        errorResults: [] as ProjectSetupResult[],
        wasAborted: false,
        retryingProjectId: null,
        onRetry: vi.fn(),
        ...overrides,
    };
}

describe('BulkSetupResults', () => {
    // === Сводка ===

    it('показывает «Настройка завершена» при wasAborted=false', () => {
        render(<BulkSetupResults {...createProps()} />);
        expect(screen.getByText('Настройка завершена')).toBeInTheDocument();
    });

    it('показывает «Настройка прервана» при wasAborted=true', () => {
        render(<BulkSetupResults {...createProps({ wasAborted: true })} />);
        expect(screen.getByText('Настройка прервана')).toBeInTheDocument();
    });

    it('показывает количество успешных', () => {
        render(<BulkSetupResults {...createProps()} />);
        expect(screen.getByText(/Успешно:/)).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('показывает счётчик «Создано» если created > 0', () => {
        render(<BulkSetupResults {...createProps({ stats: createStats({ created: 3 }) })} />);
        expect(screen.getByText(/Создано:/)).toBeInTheDocument();
    });

    it('показывает счётчик «Обновлено» если updated > 0', () => {
        render(<BulkSetupResults {...createProps({ stats: createStats({ updated: 2 }) })} />);
        expect(screen.getByText(/Обновлено:/)).toBeInTheDocument();
    });

    it('показывает счётчик «Подписка обновлена» если eventsUpdated > 0', () => {
        render(<BulkSetupResults {...createProps({ stats: createStats({ eventsUpdated: 1 }) })} />);
        expect(screen.getByText(/Подписка обновлена:/)).toBeInTheDocument();
    });

    it('НЕ показывает «Создано» если created = 0', () => {
        render(<BulkSetupResults {...createProps({ stats: createStats({ created: 0 }) })} />);
        expect(screen.queryByText(/Создано:/)).not.toBeInTheDocument();
    });

    // === Ошибки ===

    it('НЕ показывает блок ошибок если ошибок нет', () => {
        render(<BulkSetupResults {...createProps()} />);
        expect(screen.queryByText(/Ошибки \(/)).not.toBeInTheDocument();
    });

    it('показывает блок ошибок с количеством', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 2 }),
            errorResults: [
                createError({ projectId: 'e1', projectName: 'Проект А', message: 'Ошибка 1' }),
                createError({ projectId: 'e2', projectName: 'Проект Б', message: 'Ошибка 2' }),
            ],
        })} />);
        expect(screen.getByText('Ошибки (2):')).toBeInTheDocument();
        expect(screen.getByText('Проект А')).toBeInTheDocument();
        expect(screen.getByText('Ошибка 1')).toBeInTheDocument();
        expect(screen.getByText('Проект Б')).toBeInTheDocument();
        expect(screen.getByText('Ошибка 2')).toBeInTheDocument();
    });

    it('показывает код ошибки если есть', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ errorCode: 100 })],
        })} />);
        expect(screen.getByText('Код: 100')).toBeInTheDocument();
    });

    // === Retry ===

    it('кнопка «Повторить» вызывает onRetry с правильным projectId', () => {
        const onRetry = vi.fn();
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ projectId: 'err-42' })],
            onRetry,
        })} />);
        fireEvent.click(screen.getByText('Повторить'));
        expect(onRetry).toHaveBeenCalledWith('err-42');
    });

    it('кнопки «Повторить» disabled пока идёт retry', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ projectId: 'err-1' })],
            retryingProjectId: 'err-1',
        })} />);
        // Кнопка disabled через пропс retryingProjectId !== null
        const retryBtn = screen.getByRole('button');
        expect(retryBtn).toBeDisabled();
    });

    // === Ошибка 2000 — лимит серверов ===

    it('показывает спецсообщение для ошибки 2000', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ errorCode: 2000, vkProjectId: 54321 })],
        })} />);
        expect(screen.getByText(/Лимит 10 серверов/)).toBeInTheDocument();
    });

    it('рендерит ссылку на VK настройки для ошибки 2000', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ errorCode: 2000, vkProjectId: 54321 })],
        })} />);
        const link = screen.getByText('настройках группы VK');
        expect(link).toHaveAttribute('href', 'https://vk.com/club54321?act=api');
        expect(link).toHaveAttribute('target', '_blank');
    });

    it('показывает «настройках группы VK» как текст если нет vkProjectId', () => {
        render(<BulkSetupResults {...createProps({
            stats: createStats({ errors: 1 }),
            errorResults: [createError({ errorCode: 2000, vkProjectId: undefined })],
        })} />);
        const textSpan = screen.getByText('настройках группы VK');
        expect(textSpan.tagName).toBe('SPAN');
        expect(textSpan).not.toHaveAttribute('href');
    });

    // === Зелёный / жёлтый фон ===

    it('зелёный фон при 0 ошибок', () => {
        const { container } = render(<BulkSetupResults {...createProps({ stats: createStats({ errors: 0 }) })} />);
        expect(container.querySelector('.bg-green-50')).toBeInTheDocument();
    });

    it('жёлтый фон при наличии ошибок', () => {
        const { container } = render(<BulkSetupResults {...createProps({ stats: createStats({ errors: 2 }) })} />);
        expect(container.querySelector('.bg-yellow-50')).toBeInTheDocument();
    });
});
