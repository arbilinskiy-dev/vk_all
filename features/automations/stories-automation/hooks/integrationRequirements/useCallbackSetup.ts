import { useState, useEffect, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import {
    getCurrentCallbackState,
    setupCallbackAuto,
    detectTunnel,
    CallbackCurrentStateResponse,
    CallbackSetupResponse,
} from '../../../../../services/api/vk.api';
import { ALL_EVENT_KEYS, CallbackEventCategory } from '../../../../../shared/utils/callbackEvents';
import { TunnelMode, CallbackSetupState, CallbackSetupActions } from './types';

// ─── Параметры хука автонастройки Callback ───────────────────────

interface UseCallbackSetupParams {
    projectId?: string;
    /** Название группы (для dependency массива) */
    vkGroupName?: string;
    hasToken: boolean;
    hasGroupId: boolean;
    isLocal: boolean;
    /** Callback для перепроверки требований после успешной настройки */
    checkRequirements: () => Promise<void>;
    /** Ref для сброса флага проверки */
    checkedRef: MutableRefObject<boolean>;
}

/**
 * Хук управления инлайн-автонастройкой Callback API.
 * Переиспользует логику из IntegrationsSection.
 */
export function useCallbackSetup({
    projectId,
    vkGroupName,
    hasToken,
    hasGroupId,
    isLocal,
    checkRequirements,
    checkedRef,
}: UseCallbackSetupParams) {
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupResult, setSetupResult] = useState<CallbackSetupResponse | null>(null);
    const [setupError, setSetupError] = useState<string | null>(null);
    const [tunnelMode, setTunnelMode] = useState<TunnelMode>(() => {
        try {
            return (window.localStorage.getItem('callback_tunnel_mode') as TunnelMode) || 'ssh-tunnel';
        } catch {
            return 'ssh-tunnel';
        }
    });
    const [tunnelStatus, setTunnelStatus] = useState<{ checked: boolean; active: boolean; message?: string }>({ checked: false, active: false });
    const [isCheckingTunnel, setIsCheckingTunnel] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(() => new Set());
    const [showEventSelector, setShowEventSelector] = useState(false);
    const [currentState, setCurrentState] = useState<CallbackCurrentStateResponse | null>(null);
    const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
    const [loadCurrentError, setLoadCurrentError] = useState<string | null>(null);

    const canAutoSetup = hasToken && hasGroupId && !isSettingUp;

    // ─── Вычисляемое: все события выбраны ────────────

    const allSelected = useMemo(() => {
        if (selectedEvents.size < ALL_EVENT_KEYS.length) return false;
        return ALL_EVENT_KEYS.every(key => selectedEvents.has(key));
    }, [selectedEvents]);

    // ─── Сброс при смене проекта ─────────────────────

    const prevProjRef = useRef<string | undefined>();

    useEffect(() => {
        if (projectId !== prevProjRef.current) {
            prevProjRef.current = projectId;
            setCurrentState(null);
            setSetupResult(null);
            setSetupError(null);
            setSelectedEvents(new Set());
            setShowEventSelector(false);
        }
    }, [projectId]);

    // ─── Действия ────────────────────────────────────

    /** Сменить режим туннеля */
    const handleTunnelModeChange = useCallback((mode: TunnelMode) => {
        setTunnelMode(mode);
        setTunnelStatus({ checked: false, active: false });
        try { window.localStorage.setItem('callback_tunnel_mode', mode); } catch { /* игнорируем */ }
    }, []);

    /** Проверить статус SSH tunnel */
    const checkTunnelStatus = useCallback(async () => {
        setIsCheckingTunnel(true);
        try {
            const result = await detectTunnel();
            setTunnelStatus({ checked: true, active: result.detected, message: result.message });
        } catch {
            setTunnelStatus({ checked: true, active: false, message: 'Ошибка проверки tunnel' });
        } finally {
            setIsCheckingTunnel(false);
        }
    }, []);

    /** Переключить событие */
    const toggleEvent = useCallback((key: string) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }, []);

    /** Переключить категорию событий */
    const toggleCategory = useCallback((category: CallbackEventCategory) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            const categoryKeys = category.events.map(e => e.key);
            const allIn = categoryKeys.every(k => next.has(k));
            categoryKeys.forEach(k => allIn ? next.delete(k) : next.add(k));
            return next;
        });
    }, []);

    /** Выбрать все события */
    const selectAll = useCallback(() => setSelectedEvents(new Set(ALL_EVENT_KEYS)), []);

    /** Снять все события */
    const deselectAll = useCallback(() => setSelectedEvents(new Set()), []);

    /** Показать/скрыть селектор событий */
    const toggleEventSelector = useCallback(() => setShowEventSelector(prev => !prev), []);

    /** Загрузить текущие настройки callback-сервера из VK */
    const loadCurrentSettings = useCallback(async () => {
        if (!projectId || !hasToken || !hasGroupId) return;
        setIsLoadingCurrent(true);
        setLoadCurrentError(null);
        try {
            const cbState = await getCurrentCallbackState(projectId, isLocal);
            setCurrentState(cbState);
            // Применяем состояние из VK к чекбоксам
            if (cbState.found) {
                const allKeysSet = new Set(ALL_EVENT_KEYS);
                const filtered = cbState.enabled_events.filter(k => allKeysSet.has(k));
                setSelectedEvents(new Set(filtered));
            } else {
                setSelectedEvents(new Set());
            }
        } catch (err: any) {
            console.error('Ошибка загрузки настроек:', err.message || err);
            setLoadCurrentError(err.message || 'Не удалось получить настройки');
        } finally {
            setIsLoadingCurrent(false);
        }
    }, [projectId, vkGroupName, hasToken, hasGroupId, isLocal]);

    /** Автонастройка callback-сервера */
    const handleAutoSetup = useCallback(async () => {
        if (!projectId || !hasToken || !hasGroupId) return;

        const useTunnel = isLocal && tunnelMode === 'ssh-tunnel';
        const eventsToSend: string[] = Array.from(selectedEvents);

        setIsSettingUp(true);
        setSetupResult(null);
        setSetupError(null);

        try {
            const result = await setupCallbackAuto({
                project_id: projectId,
                is_local: isLocal,
                use_tunnel: useTunnel,
                events: eventsToSend,
            });

            setSetupResult(result);

            // После успешной настройки — перезагружаем состояние и перепроверяем требования
            if (result.success) {
                await loadCurrentSettings();
                checkedRef.current = false;
                await checkRequirements();
            }
        } catch (err: any) {
            console.error('Ошибка автонастройки:', err.message || err);
            setSetupError(err.message || 'Неизвестная ошибка');
        } finally {
            setIsSettingUp(false);
        }
    }, [projectId, vkGroupName, hasToken, hasGroupId, isLocal, tunnelMode, selectedEvents, loadCurrentSettings, checkRequirements]);

    return {
        state: {
            isSettingUp,
            setupResult,
            setupError,
            tunnelMode,
            tunnelStatus,
            isCheckingTunnel,
            selectedEvents,
            showEventSelector,
            allSelected,
            currentState,
            isLoadingCurrent,
            loadCurrentError,
            isLocal,
            canAutoSetup,
            hasGroupId,
        } as CallbackSetupState,
        actions: {
            handleAutoSetup,
            handleTunnelModeChange,
            checkTunnelStatus,
            toggleEvent,
            toggleCategory,
            selectAll,
            deselectAll,
            toggleEventSelector,
            loadCurrentSettings,
        } as CallbackSetupActions,
    };
}
