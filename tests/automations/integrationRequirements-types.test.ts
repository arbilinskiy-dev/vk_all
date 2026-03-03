/**
 * Тесты типов для integrationRequirements/types.ts
 *
 * Compile-time проверки: если типы сломаются — тест не скомпилируется.
 */
import { describe, it, expect } from 'vitest';
import type {
    TunnelMode,
    IntegrationRequirementsState,
    IntegrationRequirementsActions,
    CallbackSetupState,
    CallbackSetupActions,
} from '../../features/automations/stories-automation/hooks/integrationRequirements/types';
import { INITIAL_STATE } from '../../features/automations/stories-automation/hooks/integrationRequirements/constants';

// ─── Вспомогательная функция для compile-time проверок ───────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertType<T>(_value: T): void {
    /* только для компиляции */
}

describe('integrationRequirements/types — compile-time проверки', () => {
    it('TunnelMode допускает "ngrok"', () => {
        const mode: TunnelMode = 'ngrok';
        assertType<TunnelMode>(mode);
        expect(mode).toBe('ngrok');
    });

    it('TunnelMode допускает "ssh-tunnel"', () => {
        const mode: TunnelMode = 'ssh-tunnel';
        assertType<TunnelMode>(mode);
        expect(mode).toBe('ssh-tunnel');
    });

    it('INITIAL_STATE удовлетворяет типу IntegrationRequirementsState', () => {
        // Если типы не совместимы — будет ошибка компиляции
        assertType<IntegrationRequirementsState>(INITIAL_STATE);
        expect(INITIAL_STATE).toBeDefined();
    });

    it('IntegrationRequirementsActions можно описать объектом', () => {
        const actions: IntegrationRequirementsActions = {
            enableWallPostNew: async () => {},
            isEnabling: false,
            saveToken: async () => {},
            isSavingToken: false,
            recheck: async () => {},
            projectData: null,
        };
        assertType<IntegrationRequirementsActions>(actions);
        expect(actions.isEnabling).toBe(false);
    });

    it('CallbackSetupState можно описать объектом', () => {
        const state: CallbackSetupState = {
            isSettingUp: false,
            setupResult: null,
            setupError: null,
            tunnelMode: 'ssh-tunnel',
            tunnelStatus: { checked: false, active: false },
            isCheckingTunnel: false,
            selectedEvents: new Set(),
            showEventSelector: false,
            allSelected: false,
            currentState: null,
            isLoadingCurrent: false,
            loadCurrentError: null,
            isLocal: true,
            canAutoSetup: false,
            hasGroupId: false,
        };
        assertType<CallbackSetupState>(state);
        expect(state.isSettingUp).toBe(false);
    });

    it('CallbackSetupActions можно описать объектом', () => {
        const actions: CallbackSetupActions = {
            handleAutoSetup: async () => {},
            handleTunnelModeChange: () => {},
            checkTunnelStatus: async () => {},
            toggleEvent: () => {},
            toggleCategory: () => {},
            selectAll: () => {},
            deselectAll: () => {},
            toggleEventSelector: () => {},
            loadCurrentSettings: async () => {},
        };
        assertType<CallbackSetupActions>(actions);
        expect(typeof actions.handleAutoSetup).toBe('function');
    });
});
