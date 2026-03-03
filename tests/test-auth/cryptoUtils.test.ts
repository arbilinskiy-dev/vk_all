// Тесты криптографических утилит PKCE
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCodeVerifier, sha256 } from '../../features/test-auth/utils/cryptoUtils';

describe('cryptoUtils — PKCE утилиты', () => {
  describe('generateCodeVerifier', () => {
    beforeEach(() => {
      // Мокаем crypto.getRandomValues для предсказуемости
      vi.stubGlobal('crypto', {
        ...globalThis.crypto,
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 256;
          }
          return arr;
        },
        subtle: globalThis.crypto?.subtle,
      });
    });

    it('Возвращает строку', () => {
      const verifier = generateCodeVerifier();
      expect(typeof verifier).toBe('string');
    });

    it('Длина верификатора — 64 символа (32 байта в hex)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(64);
    });

    it('Содержит только hex-символы (0-9, a-f)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[0-9a-f]+$/);
    });

    it('Два вызова с одинаковым моком дают одинаковый результат', () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).toBe(v2);
    });
  });

  describe('sha256', () => {
    it('Возвращает строку (base64url)', async () => {
      const result = await sha256('test');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('Результат не содержит стандартных base64-символов (+, /, =)', async () => {
      const result = await sha256('hello world');
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).not.toContain('=');
    });

    it('Одинаковый вход даёт одинаковый хэш', async () => {
      const h1 = await sha256('hello');
      const h2 = await sha256('hello');
      expect(h1).toBe(h2);
    });

    it('Разные входы дают разные хэши', async () => {
      const h1 = await sha256('hello');
      const h2 = await sha256('world');
      expect(h1).not.toBe(h2);
    });
  });
});
