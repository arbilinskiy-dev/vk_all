/**
 * Тесты useProjectSettingsManager — загрузка полных данных проекта.
 *
 * ЗАЧЕМ:
 *   После рефакторинга ProjectSettingsModal получает ProjectSummary (не полный Project).
 *   useProjectSettingsManager при монтировании вызывает api.getProjectDetails()
 *   для загрузки полных данных (notes, variables, additional_community_tokens).
 *
 *   Эти тесты проверяют:
 *     1. api.getProjectDetails вызывается при монтировании
 *     2. isLoadingDetails = true до загрузки, false после
 *     3. formData обновляется полными данными проекта
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { ProjectSummary, Project, Tag, AiPromptPreset, GlobalVariableDefinition, ProjectGlobalVariableValue } from '../../shared/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Моки — vi.mock хоистится, поэтому используем vi.fn() без ссылок на переменные
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Mock API module
vi.mock('../../services/api', () => ({
    getProjectDetails: vi.fn(),
    getTags: vi.fn(),
    getAiPresets: vi.fn(),
    getGlobalVariablesForProject: vi.fn(),
}));

// Mock uuid
vi.mock('uuid', () => ({
    v4: vi.fn(() => 'mock-uuid'),
}));

// Import after mocks
import * as api from '../../services/api';
import { useProjectSettingsManager } from '../../features/projects/hooks/useProjectSettingsManager';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Тестовые данные
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const mockFullProject: Project = {
    id: 'proj-1',
    name: 'Тестовый проект',
    vkProjectId: 123,
    vkGroupShortName: 'testgroup',
    vkGroupName: 'Тестовая группа',
    vkLink: 'https://vk.com/testgroup',
    teams: ['Команда А'],
    disabled: false,
    notes: 'Заметки проекта',
    team: 'Команда А',
    variables: '[]',
    additional_community_tokens: ['tok1'],
    last_market_update: '2026-01-01',
};

const mockSummary: ProjectSummary = {
    id: 'proj-1',
    name: 'Тестовый проект',
    vkProjectId: 123,
    vkGroupShortName: 'testgroup',
    vkGroupName: 'Тестовая группа',
    vkLink: 'https://vk.com/testgroup',
    teams: ['Команда А'],
    disabled: false,
};


describe('useProjectSettingsManager', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined);
    const mockOnClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getProjectDetails).mockResolvedValue(mockFullProject);
        vi.mocked(api.getTags).mockResolvedValue([]);
        vi.mocked(api.getAiPresets).mockResolvedValue([]);
        vi.mocked(api.getGlobalVariablesForProject).mockResolvedValue({
            definitions: [],
            values: [],
        } as any);
    });

    it('вызывает api.getProjectDetails при монтировании', async () => {
        renderHook(() =>
            useProjectSettingsManager({
                project: mockSummary,
                uniqueTeams: ['Команда А'],
                onSave: mockOnSave,
                onClose: mockOnClose,
            })
        );

        await waitFor(() => {
            expect(api.getProjectDetails).toHaveBeenCalledWith('proj-1');
        });
    });

    it('isLoadingDetails = true при монтировании, false после загрузки', async () => {
        const { result } = renderHook(() =>
            useProjectSettingsManager({
                project: mockSummary,
                uniqueTeams: ['Команда А'],
                onSave: mockOnSave,
                onClose: mockOnClose,
            })
        );

        // Изначально загружается
        expect(result.current.state.isLoadingDetails).toBe(true);

        // После загрузки — false
        await waitFor(() => {
            expect(result.current.state.isLoadingDetails).toBe(false);
        });
    });

    it('formData обновляется полными данными проекта', async () => {
        const { result } = renderHook(() =>
            useProjectSettingsManager({
                project: mockSummary,
                uniqueTeams: ['Команда А'],
                onSave: mockOnSave,
                onClose: mockOnClose,
            })
        );

        await waitFor(() => {
            expect(result.current.state.isLoadingDetails).toBe(false);
        });

        // formData должен содержать полные данные из getProjectDetails
        expect(result.current.state.formData.notes).toBe('Заметки проекта');
        expect(result.current.state.formData.team).toBe('Команда А');
        expect(result.current.state.formData.additional_community_tokens).toEqual(['tok1']);
    });

    it('параллельно загружает теги, AI-пресеты и глобальные переменные', async () => {
        renderHook(() =>
            useProjectSettingsManager({
                project: mockSummary,
                uniqueTeams: ['Команда А'],
                onSave: mockOnSave,
                onClose: mockOnClose,
            })
        );

        await waitFor(() => {
            expect(api.getProjectDetails).toHaveBeenCalledOnce();
            expect(api.getTags).toHaveBeenCalledWith('proj-1');
            expect(api.getAiPresets).toHaveBeenCalledWith('proj-1');
            expect(api.getGlobalVariablesForProject).toHaveBeenCalledWith('proj-1');
        });
    });
});
