/**
 * Тесты навигации модуля статистики в useAppState.
 * Проверяем: переключение на stats модуль, дефолтный вид,
 * handleSelectStatsView, сохранение projectId.
 */

import { vi, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Мок зависимостей useAppState
vi.mock('../../App', () => ({}));
vi.mock('../../shared/types', () => ({}));
vi.mock('../../features/lists/types', () => ({
    // ListGroup — тип, но нужен дефолт для useState
}));

import { useAppState } from '../../hooks/useAppState';

describe('useAppState — модуль статистики', () => {
    // ─────────────────────────────────────────────────────────────────────
    // handleSelectModule('stats')
    // ─────────────────────────────────────────────────────────────────────

    it('устанавливает activeModule = stats при переключении', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectModule('stats');
        });

        expect(result.current.activeModule).toBe('stats');
    });

    it('устанавливает activeView = stats-dlvry по умолчанию', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectModule('stats');
        });

        expect(result.current.activeView).toBe('stats-dlvry');
    });

    it('сохраняет activeView если уже в stats-*', () => {
        const { result } = renderHook(() => useAppState());

        // Переключаемся на stats-crm через handleSelectStatsView
        act(() => {
            result.current.handleSelectStatsView('stats-crm');
        });

        // Теперь переключаемся на stats модуль снова
        act(() => {
            result.current.handleSelectModule('stats');
        });

        // Должен сохранить stats-crm, а не сбросить на stats-dlvry
        expect(result.current.activeView).toBe('stats-crm');
    });

    it('не сбрасывает activeProjectId при переключении на stats', () => {
        const { result } = renderHook(() => useAppState());

        // Устанавливаем проект
        act(() => {
            result.current.setActiveProjectId('proj-1');
        });

        // Переключаемся на stats
        act(() => {
            result.current.handleSelectModule('stats');
        });

        // Проект должен сохраниться (stats — модуль с проектами)
        expect(result.current.activeProjectId).toBe('proj-1');
    });

    // ─────────────────────────────────────────────────────────────────────
    // handleSelectStatsView
    // ─────────────────────────────────────────────────────────────────────

    it('handleSelectStatsView переключает вид', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectStatsView('stats-vk-ads');
        });

        expect(result.current.activeView).toBe('stats-vk-ads');
        expect(result.current.activeModule).toBe('stats');
    });

    it('handleSelectStatsView сбрасывает activeViewParams', () => {
        const { result } = renderHook(() => useAppState());

        // Устанавливаем параметры
        act(() => {
            result.current.setActiveViewParams({ contestId: '123' });
        });

        // Переключаем вид
        act(() => {
            result.current.handleSelectStatsView('stats-dlvry');
        });

        expect(result.current.activeViewParams).toEqual({});
    });

    // ─────────────────────────────────────────────────────────────────────
    // Переключение из stats на другой модуль
    // ─────────────────────────────────────────────────────────────────────

    it('переключение из stats на km сбрасывает вид на schedule', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectStatsView('stats-dlvry');
        });

        act(() => {
            result.current.handleSelectModule('km');
        });

        expect(result.current.activeModule).toBe('km');
        expect(result.current.activeView).toBe('schedule');
    });

    it('переключение из stats на am сбрасывает вид на messages-vk', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectStatsView('stats-crm');
        });

        act(() => {
            result.current.handleSelectModule('am');
        });

        expect(result.current.activeModule).toBe('am');
        expect(result.current.activeView).toBe('messages-vk');
    });

    // ─────────────────────────────────────────────────────────────────────
    // Все 4 вкладки статистики
    // ─────────────────────────────────────────────────────────────────────

    it.each([
        'stats-dlvry',
        'stats-vk-ads',
        'stats-vk-group',
        'stats-crm',
    ] as const)('handleSelectStatsView(%s) корректно устанавливает вид', (view) => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.handleSelectStatsView(view);
        });

        expect(result.current.activeView).toBe(view);
        expect(result.current.activeModule).toBe('stats');
    });
});
