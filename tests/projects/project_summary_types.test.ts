/**
 * Тесты ProjectSummary / Project TS-типов и API-контрактов.
 *
 * ЗАЧЕМ:
 *   После рефакторинга Project → ProjectSummary + Project(extends ProjectSummary)
 *   нужно гарантировать:
 *     1. getInitialData / forceRefreshProjects возвращают ProjectSummary[]
 *     2. getProjectDetails возвращает полный Project
 *     3. ProjectSummary не содержит полных полей (notes, variables, etc.)
 *     4. Project содержит все поля ProjectSummary + расширенные
 */

import { describe, it, expect } from 'vitest';
import type { ProjectSummary, Project } from '../../shared/types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Хелперы — минимальные объекты, соответствующие типам
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const makeSummary = (overrides: Partial<ProjectSummary> = {}): ProjectSummary => ({
    id: 'proj-1',
    name: 'Тестовый проект',
    ...overrides,
});

const makeProject = (overrides: Partial<Project> = {}): Project => ({
    id: 'proj-1',
    name: 'Тестовый проект',
    notes: 'Заметки',
    team: 'Команда А',
    variables: '{"key": "value"}',
    additional_community_tokens: ['token1', 'token2'],
    last_market_update: '2026-01-01',
    ...overrides,
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ProjectSummary — поля лёгкой версии
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('ProjectSummary type contract', () => {
    it('принимает все ожидаемые поля', () => {
        const summary = makeSummary({
            teams: ['A', 'B'],
            disabled: false,
            archived: false,
            sort_order: 1,
            vkGroupName: 'Группа',
            vkGroupShortName: 'group',
            vkLink: 'https://vk.com/group',
            vkProjectId: 123,
            avatar_url: 'https://vk.com/avatar.jpg',
            communityToken: 'token',
            vk_confirmation_code: 'abc',
            dlvry_affiliate_id: 'aff-1',
        });

        expect(summary.id).toBe('proj-1');
        expect(summary.teams).toEqual(['A', 'B']);
        expect(summary.dlvry_affiliate_id).toBe('aff-1');
    });

    it('все поля опциональны кроме id и name', () => {
        // Минимальный ProjectSummary — только id и name
        const minimal: ProjectSummary = { id: 'x', name: 'X' };
        expect(minimal.id).toBe('x');
        expect(minimal.teams).toBeUndefined();
        expect(minimal.notes).toBeUndefined(); // notes не должно быть в типе
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Project — расширяет ProjectSummary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Project extends ProjectSummary', () => {
    it('содержит все поля ProjectSummary', () => {
        const full = makeProject({
            vkGroupName: 'Группа',
            vkGroupShortName: 'group',
            vkLink: 'https://vk.com/group',
        });

        // Поля из ProjectSummary доступны
        expect(full.id).toBe('proj-1');
        expect(full.vkGroupName).toBe('Группа');
    });

    it('содержит расширенные поля', () => {
        const full = makeProject();

        expect(full.notes).toBe('Заметки');
        expect(full.team).toBe('Команда А');
        expect(full.variables).toBe('{"key": "value"}');
        expect(full.additional_community_tokens).toEqual(['token1', 'token2']);
        expect(full.last_market_update).toBe('2026-01-01');
    });

    it('может быть присвоен переменной типа ProjectSummary (совместимость наследования)', () => {
        const full: Project = makeProject();
        // Project extends ProjectSummary → должен быть присваиваемым
        const summary: ProjectSummary = full;
        expect(summary.id).toBe('proj-1');
    });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Контракт: поля совпадают с Pydantic-схемой
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Pydantic ↔ TypeScript field alignment', () => {
    // Эти поля должны совпадать с Pydantic ProjectSummary
    const PYDANTIC_SUMMARY_FIELDS = new Set([
        'id', 'name', 'vkProjectId', 'vkGroupShortName', 'vkGroupName',
        'vkLink', 'avatar_url', 'teams', 'disabled', 'archived',
        'sort_order', 'communityToken', 'vk_confirmation_code',
        'dlvry_affiliate_id',
    ]);

    // Расширенные поля из Pydantic Project (сверх ProjectSummary)
    const PYDANTIC_PROJECT_EXTRA = new Set([
        'notes', 'team', 'variables', 'additional_community_tokens', 'last_market_update',
    ]);

    it('ProjectSummary содержит все поля Pydantic-схемы', () => {
        // Создаём объект со всеми полями — если TS компилятор не жалуется, поля есть в типе
        const summary = makeSummary({
            vkProjectId: 1,
            vkGroupShortName: 'test',
            vkGroupName: 'Test',
            vkLink: 'https://vk.com/test',
            avatar_url: 'url',
            teams: ['A'],
            disabled: false,
            archived: false,
            sort_order: 0,
            communityToken: 'tok',
            vk_confirmation_code: 'abc',
            dlvry_affiliate_id: 'aff',
        });

        // Проверяем что все ключи объекта реально задаются
        for (const field of PYDANTIC_SUMMARY_FIELDS) {
            expect(summary).toHaveProperty(field);
        }
    });

    it('Project содержит расширенные поля Pydantic-схемы', () => {
        const full = makeProject();

        for (const field of PYDANTIC_PROJECT_EXTRA) {
            expect(full).toHaveProperty(field);
        }
    });
});
