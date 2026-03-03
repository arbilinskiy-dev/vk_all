import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Project } from '../../../shared/types';
import { AccordionSectionKey } from '../components/modals/ProjectSettingsModal';
import { setupCallbackAuto, CallbackSetupResponse, detectTunnel, getCurrentCallbackState, CallbackCurrentStateResponse } from '../../../services/api/vk.api';
import { ALL_EVENT_KEYS, CallbackEventCategory } from '../../../shared/utils/callbackEvents';

export type TunnelMode = 'ngrok' | 'ssh-tunnel';

interface UseIntegrationsSectionLogicProps {
    formData: Project;
    handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isSaving: boolean;
    activeAccordion: AccordionSectionKey | null;
}

export function useIntegrationsSectionLogic({
    formData,
    handleFormChange,
    isSaving,
    activeAccordion,
}: UseIntegrationsSectionLogicProps) {
    // ─── Состояние автонастройки Callback ─────────────────────────
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [setupResult, setSetupResult] = useState<CallbackSetupResponse | null>(null);
    const [setupError, setSetupError] = useState<string | null>(null);

    // ─── Режим локального туннеля: ngrok или SSH tunnel ───────────
    const [tunnelMode, setTunnelMode] = useState<TunnelMode>(() => {
        try {
            return (window.localStorage.getItem('callback_tunnel_mode') as TunnelMode) || 'ssh-tunnel';
        } catch {
            return 'ssh-tunnel';
        }
    });
    const [tunnelStatus, setTunnelStatus] = useState<{ checked: boolean; active: boolean; message?: string }>({ checked: false, active: false });
    const [isCheckingTunnel, setIsCheckingTunnel] = useState(false);

    // Сохраняем выбор режима в localStorage
    const handleTunnelModeChange = useCallback((mode: TunnelMode) => {
        setTunnelMode(mode);
        setTunnelStatus({ checked: false, active: false });
        try { window.localStorage.setItem('callback_tunnel_mode', mode); } catch { /* игнорируем */ }
    }, []);

    // Проверка статуса SSH tunnel
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

    // ─── Текущие настройки callback-сервера из VK ──────────────────
    const [currentState, setCurrentState] = useState<CallbackCurrentStateResponse | null>(null);
    const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
    const [loadCurrentError, setLoadCurrentError] = useState<string | null>(null);

    // ─── Выбор событий для подписки ───────────────────────────────
    // Инициализируем пустым — реальное состояние загружается из VK при открытии секции
    const [selectedEvents, setSelectedEvents] = useState<Set<string>>(() => new Set());
    const [showEventSelector, setShowEventSelector] = useState(false);

    // allSelected: проверяем что выбраны ВСЕ ключи из ALL_EVENT_KEYS
    // (после загрузки из VK в selectedEvents могут быть лишние ключи — фильтруем)
    const allSelected = useMemo(() => {
        if (selectedEvents.size < ALL_EVENT_KEYS.length) return false;
        return ALL_EVENT_KEYS.every(key => selectedEvents.has(key));
    }, [selectedEvents]);

    const toggleEvent = useCallback((key: string) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }, []);

    const toggleCategory = useCallback((category: CallbackEventCategory) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            const categoryKeys = category.events.map(e => e.key);
            const allIn = categoryKeys.every(k => next.has(k));
            categoryKeys.forEach(k => allIn ? next.delete(k) : next.add(k));
            return next;
        });
    }, []);

    const selectAll = useCallback(() => setSelectedEvents(new Set(ALL_EVENT_KEYS)), []);
    const deselectAll = useCallback(() => setSelectedEvents(new Set()), []);

    // Переключатель видимости селектора событий
    const toggleEventSelector = useCallback(() => setShowEventSelector(prev => !prev), []);

    // Определяем окружение из localStorage
    const getEnvironment = useCallback((): 'local' | 'pre-production' | 'production' => {
        try {
            return (window.localStorage.getItem('api_environment') as any) || 'local';
        } catch {
            return 'local';
        }
    }, []);

    const isLocal = getEnvironment() === 'local';
    const hasToken = Boolean(formData.communityToken);
    const hasGroupId = Boolean(formData.vkProjectId);
    const canAutoSetup = hasToken && hasGroupId && !isSaving && !isSettingUp;

    // Загрузка текущих настроек callback-сервера из VK
    const loadCurrentSettings = useCallback(async () => {
        if (!formData.id || !hasToken || !hasGroupId) return;
        console.log(`[CALLBACK] 📥 Загрузка текущих настроек из VK для проекта "${formData.name}" (id=${formData.id}, group=${formData.vkProjectId})`);
        setIsLoadingCurrent(true);
        setLoadCurrentError(null);
        try {
            const state = await getCurrentCallbackState(formData.id, isLocal);
            if (state.found && state.server) {
                console.log(`[CALLBACK] ✅ Сервер найден: "${state.server.title}" (id=${state.server.id}, status=${state.server.status})`);
                console.log(`[CALLBACK] 📊 Включено событий: ${state.enabled_count}/${state.enabled_events?.length || 0}`, state.enabled_events);
            } else {
                console.log(`[CALLBACK] ⚠️ Наш callback-сервер НЕ найден в группе ${formData.vkProjectId}`);
            }
            setCurrentState(state);
            // Применяем состояние из VK к чекбоксам — показываем ровно то что есть в VK
            if (state.found) {
                // Берём только ключи, которые есть в нашем справочнике (UI)
                const allKeysSet = new Set(ALL_EVENT_KEYS);
                const filtered = state.enabled_events.filter(k => allKeysSet.has(k));
                setSelectedEvents(new Set(filtered));
                console.log(`[CALLBACK] 🔄 Чекбоксы = состояние VK: ${filtered.length} событий включено`);
            } else {
                // Сервер не найден — пустые чекбоксы
                setSelectedEvents(new Set());
                console.log(`[CALLBACK] 🔄 Сервер не найден, чекбоксы пустые`);
            }
        } catch (err: any) {
            console.error(`[CALLBACK] ❌ Ошибка загрузки настроек:`, err.message || err);
            setLoadCurrentError(err.message || 'Не удалось получить настройки');
        } finally {
            setIsLoadingCurrent(false);
        }
    }, [formData.id, formData.name, formData.vkProjectId, hasToken, hasGroupId, isLocal]);

    // ─── Автозагрузка настроек callback при открытии секции «Интеграции» ──
    const hasAutoLoadedRef = useRef(false);

    useEffect(() => {
        // Загружаем настройки callback-сервера при первом открытии секции «Интеграции»
        if (activeAccordion === 'integrations' && canAutoSetup && !hasAutoLoadedRef.current && !currentState) {
            hasAutoLoadedRef.current = true;
            console.log(`[CALLBACK] 🚀 Автозагрузка настроек callback при открытии секции «Интеграции»`);
            loadCurrentSettings();
        }
    }, [activeAccordion, canAutoSetup, currentState, loadCurrentSettings]);

    // Сброс флага при смене проекта
    useEffect(() => {
        hasAutoLoadedRef.current = false;
        setCurrentState(null);
    }, [formData.id]);

    // ─── Обработчик автонастройки ─────────────────────────────────
    const handleAutoSetup = useCallback(async () => {
        if (!formData.id || !hasToken || !hasGroupId) return;

        const useTunnel = isLocal && tunnelMode === 'ssh-tunnel';
        // ВСЕГДА передаём явный список событий — ровно то что на чекбоксах
        const eventsToSend: string[] = Array.from(selectedEvents);
        console.log(`[CALLBACK] ⚡ Автонастройка Callback для "${formData.name}" (id=${formData.id}, group=${formData.vkProjectId})`);
        console.log(`[CALLBACK] 📋 Параметры: isLocal=${isLocal}, tunnelMode=${tunnelMode}, useTunnel=${useTunnel}, events=${eventsToSend.length} шт`);

        setIsSettingUp(true);
        setSetupResult(null);
        setSetupError(null);

        try {
            const result = await setupCallbackAuto({
                project_id: formData.id,
                is_local: isLocal,
                use_tunnel: useTunnel,
                // Всегда передаём явный список — бэкенд отфильтрует always-on события
                events: eventsToSend,
            });

            if (result.success) {
                console.log(`[CALLBACK] ✅ Автонастройка успешна: server="${result.server_name}" (id=${result.server_id}), url=${result.callback_url}, action=${result.action}`);
                console.log(`[CALLBACK] 🔑 Confirmation code: ${result.confirmation_code}`);
            } else {
                console.warn(`[CALLBACK] ⚠️ Автонастройка не удалась: ${result.message} (error_code=${result.error_code})`);
            }

            setSetupResult(result);

            // Если успешно и получен confirmation_code — обновляем поле в форме
            if (result.success && result.confirmation_code) {
                // Имитируем событие для handleFormChange
                const syntheticEvent = {
                    target: {
                        name: 'vk_confirmation_code',
                        value: result.confirmation_code,
                    },
                } as React.ChangeEvent<HTMLInputElement>;
                handleFormChange(syntheticEvent);
            }

            // Авто-обновляем текущее состояние из VK после успешной настройки
            if (result.success) {
                console.log(`[CALLBACK] 🔄 Авто-обновление текущих настроек из VK после успешного сетапа`);
                loadCurrentSettings();
            }
        } catch (err: any) {
            console.error(`[CALLBACK] ❌ Ошибка автонастройки:`, err.message || err);
            setSetupError(err.message || 'Неизвестная ошибка');
        } finally {
            setIsSettingUp(false);
        }
    }, [formData.id, formData.name, formData.vkProjectId, hasToken, hasGroupId, isLocal, tunnelMode, selectedEvents, handleFormChange, loadCurrentSettings]);

    return {
        state: {
            isSettingUp,
            setupResult,
            setupError,
            tunnelMode,
            tunnelStatus,
            isCheckingTunnel,
            currentState,
            isLoadingCurrent,
            loadCurrentError,
            selectedEvents,
            showEventSelector,
            allSelected,
            isLocal,
            hasToken,
            hasGroupId,
            canAutoSetup,
        },
        actions: {
            handleTunnelModeChange,
            checkTunnelStatus,
            toggleEvent,
            toggleCategory,
            selectAll,
            deselectAll,
            toggleEventSelector,
            handleAutoSetup,
            loadCurrentSettings,
        },
    };
}
