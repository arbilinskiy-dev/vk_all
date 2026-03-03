// Тесты констант VK Test Auth модуля
import { describe, it, expect } from 'vitest';
import {
  APP_ID_1,
  APP_ID_2,
  APP_ID_STANDALONE,
  STANDALONE_SCOPE,
} from '../../features/test-auth/constants';

describe('Константы VK Test Auth', () => {
  describe('APP_ID', () => {
    it('APP_ID_1 — числовой идентификатор приложения', () => {
      expect(APP_ID_1).toBe(54423358);
      expect(typeof APP_ID_1).toBe('number');
    });

    it('APP_ID_2 — числовой идентификатор второго приложения', () => {
      expect(APP_ID_2).toBe(54422343);
      expect(typeof APP_ID_2).toBe('number');
    });

    it('APP_ID_STANDALONE — идентификатор Standalone приложения', () => {
      expect(APP_ID_STANDALONE).toBe(7017349);
      expect(typeof APP_ID_STANDALONE).toBe('number');
    });

    it('Все APP_ID различаются', () => {
      const ids = [APP_ID_1, APP_ID_2, APP_ID_STANDALONE];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });

  describe('STANDALONE_SCOPE', () => {
    it('Содержит строку с правами доступа через запятую', () => {
      expect(typeof STANDALONE_SCOPE).toBe('string');
      expect(STANDALONE_SCOPE.length).toBeGreaterThan(0);
    });

    it('Содержит ключевые разрешения', () => {
      const scopes = STANDALONE_SCOPE.split(',');
      expect(scopes).toContain('friends');
      expect(scopes).toContain('groups');
      expect(scopes).toContain('wall');
      expect(scopes).toContain('offline');
      expect(scopes).toContain('email');
      expect(scopes).toContain('photos');
    });

    it('Не содержит пробелов внутри значений', () => {
      const scopes = STANDALONE_SCOPE.split(',');
      scopes.forEach((scope) => {
        expect(scope.trim()).toBe(scope);
      });
    });
  });
});
