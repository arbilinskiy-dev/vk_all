/**
 * Тесты для integrationRequirements/constants.ts
 *
 * Проверяем начальное состояние INITIAL_STATE.
 */
import { describe, it, expect } from 'vitest';
import { INITIAL_STATE } from '../../features/automations/stories-automation/hooks/integrationRequirements/constants';

describe('INITIAL_STATE (integrationRequirements/constants)', () => {
    it('является объектом', () => {
        expect(INITIAL_STATE).toBeDefined();
        expect(typeof INITIAL_STATE).toBe('object');
    });

    // ─── Флаги проверки ─────────────────────────────

    it('isChecked === false', () => {
        expect(INITIAL_STATE.isChecked).toBe(false);
    });

    it('isChecking === false', () => {
        expect(INITIAL_STATE.isChecking).toBe(false);
    });

    it('isReady === false', () => {
        expect(INITIAL_STATE.isReady).toBe(false);
    });

    it('error === null', () => {
        expect(INITIAL_STATE.error).toBeNull();
    });

    // ─── Токен ─────────────────────────────────────

    it('hasToken === false', () => {
        expect(INITIAL_STATE.hasToken).toBe(false);
    });

    it('groupName === null', () => {
        expect(INITIAL_STATE.groupName).toBeNull();
    });

    it('groupShortName === null', () => {
        expect(INITIAL_STATE.groupShortName).toBeNull();
    });

    it('groupId === null', () => {
        expect(INITIAL_STATE.groupId).toBeNull();
    });

    // ─── Callback API ──────────────────────────────

    it('hasCallback === false', () => {
        expect(INITIAL_STATE.hasCallback).toBe(false);
    });

    it('serverName === null', () => {
        expect(INITIAL_STATE.serverName).toBeNull();
    });

    it('serverUrl === null', () => {
        expect(INITIAL_STATE.serverUrl).toBeNull();
    });

    it('callbackStatus === null', () => {
        expect(INITIAL_STATE.callbackStatus).toBeNull();
    });

    it('enabledEventsCount === 0', () => {
        expect(INITIAL_STATE.enabledEventsCount).toBe(0);
    });

    it('enabledEvents — пустой массив', () => {
        expect(INITIAL_STATE.enabledEvents).toEqual([]);
        expect(Array.isArray(INITIAL_STATE.enabledEvents)).toBe(true);
    });

    // ─── wall_post_new ─────────────────────────────

    it('hasWallPostNew === false', () => {
        expect(INITIAL_STATE.hasWallPostNew).toBe(false);
    });

    // ─── Полная структура ──────────────────────────

    it('содержит все ожидаемые ключи (полный снимок)', () => {
        expect(INITIAL_STATE).toEqual({
            isChecked: false,
            isChecking: false,
            isReady: false,
            error: null,
            hasToken: false,
            groupName: null,
            groupShortName: null,
            groupId: null,
            hasCallback: false,
            serverName: null,
            serverUrl: null,
            callbackStatus: null,
            enabledEventsCount: 0,
            enabledEvents: [],
            hasWallPostNew: false,
        });
    });
});
