/**
 * Тесты: messages.api.ts — хаб-реэкспорт.
 * Проверяем что ВСЕ экспорты из подмодулей доступны через единый хаб,
 * и что внешний контракт не сломан после декомпозиции.
 */

import { describe, it, expect } from 'vitest';

// Импортируем всё из хаба — как это делают потребители
import * as messagesApi from '../../services/api/messages.api';

describe('messages.api.ts — хаб-реэкспорт', () => {

    // ─── Функции: conversations ──────────────────────────────────

    describe('реэкспорт conversations', () => {
        it('экспортирует getConversationsInit', () => {
            expect(typeof messagesApi.getConversationsInit).toBe('function');
        });

        it('экспортирует getLastMessages', () => {
            expect(typeof messagesApi.getLastMessages).toBe('function');
        });

        it('экспортирует getUnreadCounts', () => {
            expect(typeof messagesApi.getUnreadCounts).toBe('function');
        });

        it('экспортирует getUnreadDialogCountsBatch', () => {
            expect(typeof messagesApi.getUnreadDialogCountsBatch).toBe('function');
        });
    });

    // ─── Функции: chat ───────────────────────────────────────────

    describe('реэкспорт chat', () => {
        it('экспортирует getMessageHistory', () => {
            expect(typeof messagesApi.getMessageHistory).toBe('function');
        });

        it('экспортирует loadAllMessages', () => {
            expect(typeof messagesApi.loadAllMessages).toBe('function');
        });

        it('экспортирует sendMessage', () => {
            expect(typeof messagesApi.sendMessage).toBe('function');
        });

        it('экспортирует uploadMessageAttachment', () => {
            expect(typeof messagesApi.uploadMessageAttachment).toBe('function');
        });

        it('экспортирует sendTypingStatus', () => {
            expect(typeof messagesApi.sendTypingStatus).toBe('function');
        });
    });

    // ─── Функции: read-status ────────────────────────────────────

    describe('реэкспорт read-status', () => {
        it('экспортирует markDialogAsRead', () => {
            expect(typeof messagesApi.markDialogAsRead).toBe('function');
        });

        it('экспортирует markDialogAsUnread', () => {
            expect(typeof messagesApi.markDialogAsUnread).toBe('function');
        });

        it('экспортирует markAllDialogsAsRead', () => {
            expect(typeof messagesApi.markAllDialogsAsRead).toBe('function');
        });
    });

    // ─── Функции: dialog-meta ────────────────────────────────────

    describe('реэкспорт dialog-meta', () => {
        it('экспортирует getMailingUserInfo', () => {
            expect(typeof messagesApi.getMailingUserInfo).toBe('function');
        });

        it('экспортирует setDialogFocus', () => {
            expect(typeof messagesApi.setDialogFocus).toBe('function');
        });

        it('экспортирует toggleDialogImportant', () => {
            expect(typeof messagesApi.toggleDialogImportant).toBe('function');
        });

        it('экспортирует getDialogFocuses', () => {
            expect(typeof messagesApi.getDialogFocuses).toBe('function');
        });
    });

    // ─── Полный список: 16 функций ──────────────────────────────

    it('экспортирует ровно 16 функций', () => {
        const exportedFunctions = Object.entries(messagesApi)
            .filter(([, value]) => typeof value === 'function')
            .map(([key]) => key);

        expect(exportedFunctions).toHaveLength(16);

        // Проверяем полный список
        const expected = [
            'getConversationsInit',
            'getLastMessages',
            'getUnreadCounts',
            'getUnreadDialogCountsBatch',
            'getMessageHistory',
            'loadAllMessages',
            'sendMessage',
            'uploadMessageAttachment',
            'sendTypingStatus',
            'markDialogAsRead',
            'markDialogAsUnread',
            'markAllDialogsAsRead',
            'getMailingUserInfo',
            'setDialogFocus',
            'toggleDialogImportant',
            'getDialogFocuses',
        ];
        for (const name of expected) {
            expect(exportedFunctions).toContain(name);
        }
    });
});
