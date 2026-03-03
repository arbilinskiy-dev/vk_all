import { TunnelMode } from './types';

// ─── Утилиты localStorage ────────────────────────────────────────

/** Определить, используется ли локальная среда */
export function getIsLocal(): boolean {
    try {
        return (window.localStorage.getItem('api_environment') || 'local') === 'local';
    } catch {
        return true;
    }
}

/** Получить текущий режим туннеля */
export function getTunnelMode(): TunnelMode {
    try {
        return (window.localStorage.getItem('callback_tunnel_mode') as TunnelMode) || 'ssh-tunnel';
    } catch {
        return 'ssh-tunnel';
    }
}
