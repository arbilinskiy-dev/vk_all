/**
 * Тесты констант теста "Получение данных историй".
 * Проверяем METHOD_INFO и TOKEN_TYPE_LABELS.
 */

import { describe, it, expect } from 'vitest';
import { METHOD_INFO, TOKEN_TYPE_LABELS } from '../../features/sandbox/components/tests/test2-stories-data/constants';

// ─── METHOD_INFO ────────────────────────────────────────

describe('METHOD_INFO', () => {
    it('содержит ровно 4 метода', () => {
        const keys = Object.keys(METHOD_INFO);
        expect(keys).toHaveLength(4);
    });

    it('содержит ключи stories.get, stories.getStats, stories.getViewers, viewers_details', () => {
        expect(METHOD_INFO).toHaveProperty('stories.get');
        expect(METHOD_INFO).toHaveProperty('stories.getStats');
        expect(METHOD_INFO).toHaveProperty('stories.getViewers');
        expect(METHOD_INFO).toHaveProperty('viewers_details');
    });

    describe('stories.get', () => {
        it('имеет label "stories.get"', () => {
            expect(METHOD_INFO['stories.get'].label).toBe('stories.get');
        });

        it('имеет непустое описание', () => {
            expect(METHOD_INFO['stories.get'].description).toBeTruthy();
        });

        it('не требует story_id', () => {
            expect(METHOD_INFO['stories.get'].requiresStoryId).toBe(false);
        });
    });

    describe('stories.getStats', () => {
        it('имеет label "stories.getStats"', () => {
            expect(METHOD_INFO['stories.getStats'].label).toBe('stories.getStats');
        });

        it('требует story_id', () => {
            expect(METHOD_INFO['stories.getStats'].requiresStoryId).toBe(true);
        });
    });

    describe('stories.getViewers', () => {
        it('имеет label "stories.getViewers"', () => {
            expect(METHOD_INFO['stories.getViewers'].label).toBe('stories.getViewers');
        });

        it('требует story_id', () => {
            expect(METHOD_INFO['stories.getViewers'].requiresStoryId).toBe(true);
        });
    });

    describe('viewers_details', () => {
        it('имеет label "Зрители (детали)"', () => {
            expect(METHOD_INFO['viewers_details'].label).toBe('Зрители (детали)');
        });

        it('требует story_id', () => {
            expect(METHOD_INFO['viewers_details'].requiresStoryId).toBe(true);
        });

        it('упоминает цепочку в описании', () => {
            expect(METHOD_INFO['viewers_details'].description).toContain('Цепочка');
        });
    });

    it('каждый метод имеет все обязательные поля (label, description, requiresStoryId)', () => {
        for (const [key, value] of Object.entries(METHOD_INFO)) {
            expect(value, `Метод ${key} — label`).toHaveProperty('label');
            expect(value, `Метод ${key} — description`).toHaveProperty('description');
            expect(value, `Метод ${key} — requiresStoryId`).toHaveProperty('requiresStoryId');
            expect(typeof value.label).toBe('string');
            expect(typeof value.description).toBe('string');
            expect(typeof value.requiresStoryId).toBe('boolean');
        }
    });
});

// ─── TOKEN_TYPE_LABELS ──────────────────────────────────

describe('TOKEN_TYPE_LABELS', () => {
    it('содержит ровно 4 типа токенов', () => {
        const keys = Object.keys(TOKEN_TYPE_LABELS);
        expect(keys).toHaveLength(4);
    });

    it('содержит ключи user, user_non_admin, community, service', () => {
        expect(TOKEN_TYPE_LABELS).toHaveProperty('user');
        expect(TOKEN_TYPE_LABELS).toHaveProperty('user_non_admin');
        expect(TOKEN_TYPE_LABELS).toHaveProperty('community');
        expect(TOKEN_TYPE_LABELS).toHaveProperty('service');
    });

    it('каждый тип имеет поля label, color, bg, emoji', () => {
        for (const [key, value] of Object.entries(TOKEN_TYPE_LABELS)) {
            expect(value, `Тип ${key} — label`).toHaveProperty('label');
            expect(value, `Тип ${key} — color`).toHaveProperty('color');
            expect(value, `Тип ${key} — bg`).toHaveProperty('bg');
            expect(value, `Тип ${key} — emoji`).toHaveProperty('emoji');
            expect(typeof value.label).toBe('string');
            expect(typeof value.color).toBe('string');
            expect(typeof value.bg).toBe('string');
            expect(typeof value.emoji).toBe('string');
        }
    });

    it('user — label "User (админ)"', () => {
        expect(TOKEN_TYPE_LABELS.user.label).toBe('User (админ)');
    });

    it('user_non_admin — label "User (не админ)"', () => {
        expect(TOKEN_TYPE_LABELS.user_non_admin.label).toBe('User (не админ)');
    });

    it('community — label "Community Token"', () => {
        expect(TOKEN_TYPE_LABELS.community.label).toBe('Community Token');
    });

    it('service — label "Service Token"', () => {
        expect(TOKEN_TYPE_LABELS.service.label).toBe('Service Token');
    });

    it('все emoji непустые', () => {
        for (const value of Object.values(TOKEN_TYPE_LABELS)) {
            expect(value.emoji.length).toBeGreaterThan(0);
        }
    });

    it('цвета соответствуют Tailwind-формату', () => {
        for (const value of Object.values(TOKEN_TYPE_LABELS)) {
            expect(value.color).toMatch(/^text-\w+-\d+$/);
            expect(value.bg).toMatch(/^bg-\w+-\d+$/);
        }
    });
});
