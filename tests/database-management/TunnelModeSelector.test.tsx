/**
 * Тесты: TunnelModeSelector
 * Проверяем подкомпонент выбора SSH Tunnel / Ngrok
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TunnelModeSelector } from '../../features/database-management/components/modals/TunnelModeSelector';
import { TunnelMode, TunnelStatus } from '../../features/database-management/components/modals/types';

/** Базовые пропсы */
function createProps(overrides: Partial<React.ComponentProps<typeof TunnelModeSelector>> = {}) {
    return {
        tunnelMode: 'ssh-tunnel' as TunnelMode,
        tunnelStatus: { checked: false, active: false } as TunnelStatus,
        isCheckingTunnel: false,
        onModeChange: vi.fn(),
        onCheckTunnel: vi.fn(),
        ...overrides,
    };
}

describe('TunnelModeSelector', () => {
    it('рендерит обе кнопки режимов', () => {
        render(<TunnelModeSelector {...createProps()} />);
        expect(screen.getByText('SSH Tunnel')).toBeInTheDocument();
        expect(screen.getByText('Ngrok')).toBeInTheDocument();
    });

    it('вызывает onModeChange("ngrok") при клике на Ngrok', () => {
        const onModeChange = vi.fn();
        render(<TunnelModeSelector {...createProps({ onModeChange })} />);
        const ngrokBtn = screen.getByText('Ngrok').closest('button');
        fireEvent.click(ngrokBtn!);
        expect(onModeChange).toHaveBeenCalledWith('ngrok');
    });

    it('вызывает onModeChange("ssh-tunnel") при клике на SSH Tunnel', () => {
        const onModeChange = vi.fn();
        render(<TunnelModeSelector {...createProps({ tunnelMode: 'ngrok', onModeChange })} />);
        const sshBtn = screen.getByText('SSH Tunnel').closest('button');
        fireEvent.click(sshBtn!);
        expect(onModeChange).toHaveBeenCalledWith('ssh-tunnel');
    });

    it('показывает кнопку «Проверить tunnel» в режиме SSH', () => {
        render(<TunnelModeSelector {...createProps({ tunnelMode: 'ssh-tunnel' })} />);
        expect(screen.getByText('Проверить tunnel')).toBeInTheDocument();
    });

    it('НЕ показывает кнопку «Проверить tunnel» в режиме Ngrok', () => {
        render(<TunnelModeSelector {...createProps({ tunnelMode: 'ngrok' })} />);
        expect(screen.queryByText('Проверить tunnel')).not.toBeInTheDocument();
    });

    it('вызывает onCheckTunnel при клике на «Проверить tunnel»', () => {
        const onCheckTunnel = vi.fn();
        render(<TunnelModeSelector {...createProps({ onCheckTunnel })} />);
        fireEvent.click(screen.getByText('Проверить tunnel'));
        expect(onCheckTunnel).toHaveBeenCalledTimes(1);
    });

    it('показывает «Проверка...» в состоянии проверки', () => {
        render(<TunnelModeSelector {...createProps({ isCheckingTunnel: true })} />);
        expect(screen.getByText('Проверка...')).toBeInTheDocument();
    });

    it('показывает «Tunnel активен» при checked + active', () => {
        render(<TunnelModeSelector {...createProps({
            tunnelStatus: { checked: true, active: true },
        })} />);
        expect(screen.getByText('Tunnel активен')).toBeInTheDocument();
    });

    it('показывает сообщение ошибки при checked + !active', () => {
        render(<TunnelModeSelector {...createProps({
            tunnelStatus: { checked: true, active: false, message: 'Не доступен' },
        })} />);
        expect(screen.getByText('Не доступен')).toBeInTheDocument();
    });

    it('показывает «Tunnel не найден» при checked + !active + без message', () => {
        render(<TunnelModeSelector {...createProps({
            tunnelStatus: { checked: true, active: false },
        })} />);
        expect(screen.getByText('Tunnel не найден')).toBeInTheDocument();
    });
});
