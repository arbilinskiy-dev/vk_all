/**
 * Тесты для integrationRequirements/utils.ts
 *
 * Проверяем утилиты getIsLocal() и getTunnelMode().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getIsLocal, getTunnelMode } from '../../features/automations/stories-automation/hooks/integrationRequirements/utils';

describe('getIsLocal()', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    afterEach(() => {
        getItemSpy.mockReset();
    });

    it('возвращает true, если api_environment === "local"', () => {
        getItemSpy.mockReturnValue('local');
        expect(getIsLocal()).toBe(true);
    });

    it('возвращает false, если api_environment === "production"', () => {
        getItemSpy.mockReturnValue('production');
        expect(getIsLocal()).toBe(false);
    });

    it('возвращает true (дефолт), если api_environment отсутствует', () => {
        getItemSpy.mockReturnValue(null);
        expect(getIsLocal()).toBe(true);
    });

    it('возвращает true (fallback), если localStorage бросает ошибку', () => {
        getItemSpy.mockImplementation(() => {
            throw new Error('SecurityError');
        });
        expect(getIsLocal()).toBe(true);
    });
});

describe('getTunnelMode()', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    afterEach(() => {
        getItemSpy.mockReset();
    });

    it('возвращает "ngrok", если callback_tunnel_mode === "ngrok"', () => {
        getItemSpy.mockReturnValue('ngrok');
        expect(getTunnelMode()).toBe('ngrok');
    });

    it('возвращает "ssh-tunnel", если callback_tunnel_mode === "ssh-tunnel"', () => {
        getItemSpy.mockReturnValue('ssh-tunnel');
        expect(getTunnelMode()).toBe('ssh-tunnel');
    });

    it('возвращает "ssh-tunnel" (дефолт), если callback_tunnel_mode отсутствует', () => {
        getItemSpy.mockReturnValue(null);
        expect(getTunnelMode()).toBe('ssh-tunnel');
    });

    it('возвращает "ssh-tunnel" (fallback), если localStorage бросает ошибку', () => {
        getItemSpy.mockImplementation(() => {
            throw new Error('SecurityError');
        });
        expect(getTunnelMode()).toBe('ssh-tunnel');
    });
});
