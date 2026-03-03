/**
 * Тесты: PromoteAdminsModal (хаб)
 * 
 * Покрывают:
 * — рендер null при isOpen=false
 * — рендер PromoteAdminsSelection при isOpen=true (фаза выбора)
 * — рендер PromoteAdminsResults при наличии response (фаза результатов)
 * — проброс пропсов в подкомпоненты
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Моки подкомпонентов и хука ──────────────────────────────────

const mockState = {
    systemAccounts: [],
    isLoadingAccounts: false,
    filteredProjects: [],
    filteredAccounts: [],
    selectedProjectIds: new Set<string>(),
    selectedAccountIds: new Set<string>(),
    selectedProjectCount: 0,
    selectedAccountCount: 0,
    role: 'administrator' as const,
    isRunning: false,
    response: null as any,
    error: null as string | null,
    groupedResults: null as any,
    totalPairs: 0,
    canStart: false,
    projectSearch: '',
    accountSearch: '',
};

const mockActions = {
    toggleProject: vi.fn(),
    toggleAccount: vi.fn(),
    selectAllProjects: vi.fn(),
    deselectAllProjects: vi.fn(),
    selectAllAccounts: vi.fn(),
    deselectAllAccounts: vi.fn(),
    setRole: vi.fn(),
    setProjectSearch: vi.fn(),
    setAccountSearch: vi.fn(),
    handleStart: vi.fn(),
    handleClose: vi.fn(),
    handleBack: vi.fn(),
};

let currentMockState = { ...mockState };

vi.mock('../../features/database-management/hooks/usePromoteAdminsLogic', () => ({
    usePromoteAdminsLogic: () => ({
        state: currentMockState,
        actions: mockActions,
    }),
}));

vi.mock('../../features/database-management/components/modals/PromoteAdminsResults', () => ({
    PromoteAdminsResults: (props: any) => (
        <div data-testid="results-phase">
            <span data-testid="results-total">{props.response?.total_pairs}</span>
            <button data-testid="results-back" onClick={props.onBack}>Назад</button>
            <button data-testid="results-close" onClick={props.onClose}>Закрыть</button>
        </div>
    ),
}));

vi.mock('../../features/database-management/components/modals/PromoteAdminsSelection', () => ({
    PromoteAdminsSelection: (props: any) => (
        <div data-testid="selection-phase">
            <span data-testid="selection-role">{props.role}</span>
            <button data-testid="selection-start" onClick={props.onStart}>Старт</button>
            <button data-testid="selection-close" onClick={props.onClose}>Закрыть</button>
        </div>
    ),
}));

// ─── Импорт после моков ──────────────────────────────────────────

import { PromoteAdminsModal } from '../../features/database-management/components/modals/PromoteAdminsModal';

// ─── Тесты ───────────────────────────────────────────────────────

describe('PromoteAdminsModal (хаб)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        currentMockState = { ...mockState, response: null, groupedResults: null };
    });

    it('не рендерит ничего при isOpen=false', () => {
        const { container } = render(
            <PromoteAdminsModal isOpen={false} onClose={vi.fn()} projects={[]} />
        );
        expect(container.innerHTML).toBe('');
    });

    it('рендерит фазу выбора при isOpen=true и нет response', () => {
        render(
            <PromoteAdminsModal isOpen={true} onClose={vi.fn()} projects={[]} />
        );

        expect(screen.getByTestId('selection-phase')).toBeInTheDocument();
        expect(screen.queryByTestId('results-phase')).not.toBeInTheDocument();
    });

    it('рендерит фазу результатов при наличии response', () => {
        currentMockState = {
            ...mockState,
            response: { success: true, total_pairs: 5, promoted_count: 3, already_admin_count: 0, joined_count: 0, error_count: 0, results: [] },
            groupedResults: { promoted: [], alreadyAdmin: [], joinedOnly: [], failedJoin: [], failedPromote: [], recommendations: [] },
        };

        render(
            <PromoteAdminsModal isOpen={true} onClose={vi.fn()} projects={[]} />
        );

        expect(screen.getByTestId('results-phase')).toBeInTheDocument();
        expect(screen.queryByTestId('selection-phase')).not.toBeInTheDocument();
        expect(screen.getByTestId('results-total').textContent).toBe('5');
    });

    it('пробрасывает handleBack и handleClose в Results', async () => {
        currentMockState = {
            ...mockState,
            response: { success: true, total_pairs: 1, promoted_count: 1, already_admin_count: 0, joined_count: 0, error_count: 0, results: [] },
            groupedResults: { promoted: [], alreadyAdmin: [], joinedOnly: [], failedJoin: [], failedPromote: [], recommendations: [] },
        };

        render(
            <PromoteAdminsModal isOpen={true} onClose={vi.fn()} projects={[]} />
        );

        screen.getByTestId('results-back').click();
        expect(mockActions.handleBack).toHaveBeenCalledTimes(1);

        screen.getByTestId('results-close').click();
        expect(mockActions.handleClose).toHaveBeenCalledTimes(1);
    });

    it('пробрасывает handleStart и handleClose в Selection', () => {
        render(
            <PromoteAdminsModal isOpen={true} onClose={vi.fn()} projects={[]} />
        );

        screen.getByTestId('selection-start').click();
        expect(mockActions.handleStart).toHaveBeenCalledTimes(1);

        screen.getByTestId('selection-close').click();
        expect(mockActions.handleClose).toHaveBeenCalledTimes(1);
    });
});
