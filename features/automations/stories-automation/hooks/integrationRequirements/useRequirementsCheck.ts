import { useState, useEffect, useCallback, useRef } from 'react';
import { Project } from '../../../../../shared/types';
import {
    getCurrentCallbackState,
    setupCallbackAuto,
    CallbackCurrentStateResponse,
} from '../../../../../services/api/vk.api';
import { IntegrationRequirementsState } from './types';
import { INITIAL_STATE } from './constants';
import { getIsLocal, getTunnelMode } from './utils';

// ─── Параметры хука проверки требований ──────────────────────────

interface UseRequirementsCheckParams {
    projectId?: string;
    project?: Project;
    handleUpdateProjectSettings: (project: Project) => Promise<void>;
}

/**
 * Хук проверки интеграционных требований.
 *
 * Проверяет последовательно:
 * 1. Токен сообщества — из данных проекта (контекст)
 * 2. Callback API сервер — запрос getCurrentCallbackState к бэкенду
 * 3. Событие wall_post_new — из ответа callback state
 */
export function useRequirementsCheck({ projectId, project, handleUpdateProjectSettings }: UseRequirementsCheckParams) {
    const [state, setState] = useState<IntegrationRequirementsState>(INITIAL_STATE);
    const [isEnabling, setIsEnabling] = useState(false);
    const [isSavingToken, setIsSavingToken] = useState(false);
    const checkedRef = useRef(false);
    // Фикс B: ref для отслеживания реальной смены projectId (переживает StrictMode remount)
    const prevProjectIdRef = useRef<string | undefined>();

    // ─── Основная проверка ───────────────────────────

    const checkRequirements = useCallback(async () => {
        if (!projectId || !project) {
            return;
        }

        const hasToken = Boolean(project.communityToken);
        const hasGroupId = Boolean(project.vkProjectId);
        const groupName = project.vkGroupName || null;
        const groupShortName = project.vkGroupShortName || null;
        const groupId = project.vkProjectId || null;

        // Если нет токена или ID группы — дальше проверять нечего
        if (!hasToken || !hasGroupId) {
            setState({
                ...INITIAL_STATE,
                isChecked: true,
                hasToken,
                groupName,
                groupShortName,
                groupId,
            });
            return;
        }

        setState(prev => ({ ...prev, isChecking: true, error: null }));

        try {
            const isLocal = getIsLocal();
            const callbackState: CallbackCurrentStateResponse = await getCurrentCallbackState(projectId, isLocal);

            const hasCallback = callbackState.found && callbackState.server !== null;
            const serverName = callbackState.server?.title || null;
            const serverUrl = callbackState.server?.url || null;
            const callbackStatus = callbackState.server?.status || null;
            const enabledEvents = callbackState.enabled_events || [];
            const enabledEventsCount = callbackState.enabled_count || 0;
            const hasWallPostNew = callbackState.events?.['wall_post_new'] === 1;

            const isReady = hasToken && hasCallback && hasWallPostNew;

            setState({
                isChecked: true,
                isChecking: false,
                isReady,
                error: null,
                hasToken,
                groupName,
                groupShortName,
                groupId,
                hasCallback,
                serverName,
                serverUrl,
                callbackStatus,
                enabledEventsCount,
                enabledEvents,
                hasWallPostNew,
            });
        } catch (err: any) {
            console.error('[INTEGRATION] Ошибка проверки callback:', err);
            setState({
                ...INITIAL_STATE,
                isChecked: true,
                hasToken,
                groupName,
                groupShortName,
                groupId,
                error: err.message || 'Не удалось проверить настройки callback',
            });
        }
    }, [projectId, project]);

    // ─── Фикс B: Сброс при реальной смене проекта (ref переживает StrictMode remount) ─────

    useEffect(() => {
        if (projectId !== prevProjectIdRef.current) {
            prevProjectIdRef.current = projectId;
            checkedRef.current = false;
            setState(INITIAL_STATE);
        }
    }, [projectId]);

    // ─── Автопроверка при монтировании / смене проекта ─────

    useEffect(() => {
        if (projectId && project && !checkedRef.current) {
            checkedRef.current = true;
            checkRequirements();
        }
    }, [projectId, project, checkRequirements]);

    // ─── Сохранение токена сообщества ─────────────────

    const saveToken = useCallback(async (token: string) => {
        if (!projectId || !project) {
            return;
        }
        const trimmed = token.trim();
        if (!trimmed) {
            window.showAppToast?.('Введите токен сообщества', 'error');
            return;
        }

        setIsSavingToken(true);
        try {
            const updatedProject: Project = {
                ...project,
                communityToken: trimmed,
            };
            await handleUpdateProjectSettings(updatedProject);
            window.showAppToast?.('Токен сообщества сохранён', 'success');

            // Перепроверяем все требования (теперь токен есть)
            checkedRef.current = false;
            // Даём контексту обновиться перед проверкой
            setTimeout(() => {
                checkRequirements();
            }, 300);
        } catch (err: any) {
            console.error('Ошибка сохранения токена:', err);
            window.showAppToast?.(err.message || 'Не удалось сохранить токен', 'error');
        } finally {
            setIsSavingToken(false);
        }
    }, [projectId, project, handleUpdateProjectSettings, checkRequirements]);

    // ─── Включение wall_post_new ─────────────────────

    const enableWallPostNew = useCallback(async () => {
        if (!projectId || !project) {
            return;
        }

        setIsEnabling(true);
        try {
            const isLocal = getIsLocal();
            const tunnelMode = getTunnelMode();
            const useTunnel = isLocal && tunnelMode === 'ssh-tunnel';

            // Берём текущие включённые события + добавляем wall_post_new
            const events = [...new Set([...state.enabledEvents, 'wall_post_new'])];

            await setupCallbackAuto({
                project_id: projectId,
                is_local: isLocal,
                use_tunnel: useTunnel,
                events,
            });

            window.showAppToast?.('Событие wall_post_new включено', 'success');

            // Перепроверяем все требования
            checkedRef.current = false;
            await checkRequirements();
        } catch (err: any) {
            console.error('Ошибка включения wall_post_new:', err);
            window.showAppToast?.(err.message || 'Не удалось включить событие', 'error');
        } finally {
            setIsEnabling(false);
        }
    }, [projectId, project, state.enabledEvents, checkRequirements]);

    return {
        state,
        isEnabling,
        isSavingToken,
        saveToken,
        enableWallPostNew,
        checkRequirements,
        checkedRef,
    };
}
