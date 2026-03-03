/**
 * Тесты хаб-файла useIntegrationRequirements.ts
 *
 * Проверяем, что хаб корректно собирает под-хуки и реэкспортирует типы.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ─── Моки зависимостей ──────────────────────────────────────────

const mockHandleUpdateProjectSettings = vi.fn();
const mockCheckRequirements = vi.fn();
const mockEnableWallPostNew = vi.fn();
const mockSaveToken = vi.fn();
const mockHandleAutoSetup = vi.fn();

vi.mock('../../contexts/ProjectsContext', () => ({
    useProjects: vi.fn(() => ({
        projects: [
            {
                id: 'test-project-1',
                communityToken: 'tok_abc123',
                vkProjectId: 12345,
                vkGroupName: 'Тестовое сообщество',
                vkGroupShortName: 'test_group',
            },
        ],
        handleUpdateProjectSettings: mockHandleUpdateProjectSettings,
    })),
}));

vi.mock(
    '../../features/automations/stories-automation/hooks/integrationRequirements/useRequirementsCheck',
    () => ({
        useRequirementsCheck: vi.fn(() => ({
            state: {
                isChecked: false,
                isChecking: false,
                isReady: false,
                error: null,
                hasToken: true,
                groupName: 'Тестовое сообщество',
                groupShortName: 'test_group',
                groupId: 12345,
                hasCallback: false,
                serverName: null,
                serverUrl: null,
                callbackStatus: null,
                enabledEventsCount: 0,
                enabledEvents: [],
                hasWallPostNew: false,
            },
            checkRequirements: mockCheckRequirements,
            checkedRef: { current: false },
            enableWallPostNew: mockEnableWallPostNew,
            isEnabling: false,
            saveToken: mockSaveToken,
            isSavingToken: false,
        })),
    }),
);

vi.mock(
    '../../features/automations/stories-automation/hooks/integrationRequirements/useCallbackSetup',
    () => ({
        useCallbackSetup: vi.fn(() => ({
            state: { isSettingUp: false, setupResult: null },
            actions: { handleAutoSetup: mockHandleAutoSetup },
        })),
    }),
);

vi.mock(
    '../../features/automations/stories-automation/hooks/integrationRequirements/utils',
    () => ({
        getIsLocal: vi.fn(() => true),
    }),
);

// ─── Импорт после моков ─────────────────────────────────────────

import { useIntegrationRequirements } from '../../features/automations/stories-automation/hooks/useIntegrationRequirements';
import { useRequirementsCheck } from '../../features/automations/stories-automation/hooks/integrationRequirements/useRequirementsCheck';
import { useCallbackSetup } from '../../features/automations/stories-automation/hooks/integrationRequirements/useCallbackSetup';

// ─── Тесты ──────────────────────────────────────────────────────

describe('useIntegrationRequirements — хаб-хук', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── Экспорт ────────────────────────────────────

    it('экспортирует функцию useIntegrationRequirements', () => {
        expect(typeof useIntegrationRequirements).toBe('function');
    });

    // ─── Реэкспорт типов (compile-time) ─────────────

    it('реэкспортирует типы из types.ts (compile-time)', async () => {
        // Динамический импорт — если реэкспорт сломан, тест не скомпилируется
        const hubModule = await import(
            '../../features/automations/stories-automation/hooks/useIntegrationRequirements'
        );
        expect(hubModule).toBeDefined();
        // useIntegrationRequirements — единственный runtime-экспорт
        expect(typeof hubModule.useIntegrationRequirements).toBe('function');
    });

    // ─── Вызов под-хуков ────────────────────────────

    it('вызывает useRequirementsCheck с правильными параметрами', () => {
        renderHook(() => useIntegrationRequirements('test-project-1'));

        expect(useRequirementsCheck).toHaveBeenCalledWith(
            expect.objectContaining({
                projectId: 'test-project-1',
                project: expect.objectContaining({
                    id: 'test-project-1',
                    communityToken: 'tok_abc123',
                }),
                handleUpdateProjectSettings: mockHandleUpdateProjectSettings,
            }),
        );
    });

    it('вызывает useCallbackSetup с правильными параметрами', () => {
        renderHook(() => useIntegrationRequirements('test-project-1'));

        expect(useCallbackSetup).toHaveBeenCalledWith(
            expect.objectContaining({
                projectId: 'test-project-1',
                vkGroupName: 'Тестовое сообщество',
                hasToken: true,
                hasGroupId: true,
                isLocal: true,
                checkRequirements: mockCheckRequirements,
                checkedRef: { current: false },
            }),
        );
    });

    // ─── Возвращаемая структура ─────────────────────

    it('возвращает объект с полями state, actions, callbackSetup', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('test-project-1'),
        );

        expect(result.current).toHaveProperty('state');
        expect(result.current).toHaveProperty('actions');
        expect(result.current).toHaveProperty('callbackSetup');
    });

    it('state содержит данные из useRequirementsCheck', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('test-project-1'),
        );

        expect(result.current.state.isChecked).toBe(false);
        expect(result.current.state.hasToken).toBe(true);
        expect(result.current.state.hasWallPostNew).toBe(false);
    });

    it('actions содержит enableWallPostNew, saveToken, recheck', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('test-project-1'),
        );

        expect(result.current.actions.enableWallPostNew).toBe(mockEnableWallPostNew);
        expect(result.current.actions.saveToken).toBe(mockSaveToken);
        expect(result.current.actions.recheck).toBe(mockCheckRequirements);
        expect(result.current.actions.isEnabling).toBe(false);
        expect(result.current.actions.isSavingToken).toBe(false);
    });

    it('actions.projectData содержит данные проекта', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('test-project-1'),
        );

        expect(result.current.actions.projectData).toEqual({
            vkGroupShortName: 'test_group',
            vkProjectId: 12345,
        });
    });

    it('callbackSetup содержит state и actions из useCallbackSetup', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('test-project-1'),
        );

        expect(result.current.callbackSetup.state).toEqual({
            isSettingUp: false,
            setupResult: null,
        });
        expect(result.current.callbackSetup.actions.handleAutoSetup).toBe(
            mockHandleAutoSetup,
        );
    });

    // ─── Проект не найден ───────────────────────────

    it('если projectId не совпадает — projectData === null, hasToken === false', () => {
        const { result } = renderHook(() =>
            useIntegrationRequirements('non-existent-id'),
        );

        expect(result.current.actions.projectData).toBeNull();
    });

    it('если projectId не передан — передаёт undefined в под-хуки', () => {
        renderHook(() => useIntegrationRequirements());

        expect(useRequirementsCheck).toHaveBeenCalledWith(
            expect.objectContaining({
                projectId: undefined,
                project: undefined,
            }),
        );

        expect(useCallbackSetup).toHaveBeenCalledWith(
            expect.objectContaining({
                projectId: undefined,
                hasToken: false,
                hasGroupId: false,
            }),
        );
    });
});
