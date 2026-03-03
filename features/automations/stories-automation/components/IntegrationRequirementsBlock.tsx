import React, { useEffect } from 'react';
import {
    IntegrationRequirementsState,
    IntegrationRequirementsActions,
    CallbackSetupState,
    CallbackSetupActions,
} from '../hooks/useIntegrationRequirements';
import { useAnimatedCollapse } from '../hooks/useAnimatedCollapse';
// Переиспользуем компоненты автонастройки callback из IntegrationsSection
import { CallbackAutoSetupBlock } from '../../../projects/components/modals/settings-sections/CallbackAutoSetupBlock';
import { CallbackCurrentStateBlock } from '../../../projects/components/modals/settings-sections/CallbackCurrentStateBlock';
import { CallbackEventSelector } from '../../../projects/components/modals/settings-sections/CallbackEventSelector';
import { CallbackSetupResult } from '../../../projects/components/modals/settings-sections/CallbackSetupResult';
// Извлечённые подкомпоненты
import { Spinner, StatusBadge } from './shared/RequirementIcons';
import { RequirementRow } from './shared/RequirementRow';
import { InlineTokenForm } from './InlineTokenForm';

// ─── Основной компонент (хаб-контейнер) ───────────────────────────

interface IntegrationRequirementsBlockProps {
    state: IntegrationRequirementsState;
    actions: IntegrationRequirementsActions;
    /** Инлайн-автонастройка callback (переиспользуются компоненты из IntegrationsSection) */
    callbackSetup: {
        state: CallbackSetupState;
        actions: CallbackSetupActions;
    };
}

export const IntegrationRequirementsBlock: React.FC<IntegrationRequirementsBlockProps> = ({
    state,
    actions,
    callbackSetup,
}) => {
    // Блок виден только когда проверка завершена И есть проблемы (лоадер убран — дёргал интерфейс)
    const showContent = state.isChecked && !state.isReady;
    const isVisible = showContent;

    // Хук анимации сворачивания/разворачивания
    const { containerRef, innerRef, containerHeight, updateHeight } = useAnimatedCollapse({ isVisible });

    // Обновляем высоту при смене содержимого
    useEffect(() => {
        updateHeight();
    }, [isVisible, showContent, state.isChecked, state.hasToken, state.hasCallback, state.hasWallPostNew, updateHeight]);

    // ─── Фикс C: Early-exit — когда блок скрыт, не рендерим тяжёлую иерархию ───
    if (!isVisible) {
        return (
            <div ref={containerRef} className="overflow-hidden transition-all duration-300 ease-in-out" style={{ height: 0, opacity: 0 }}>
                <div ref={innerRef} />
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
                height: containerHeight === 'auto' ? 'auto' : `${containerHeight}px`,
                opacity: isVisible ? 1 : 0,
            }}
        >
            <div ref={innerRef}>
                {/* Полный блок настроек — показывается после проверки, если есть проблемы */}
                {showContent && (
                    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex-shrink-0 animate-fade-in-up">
            {/* Заголовок */}
            <div className="px-6 py-3 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900">Настройка интеграции</h3>
                </div>
                {/* Кнопка повторной проверки */}
                <button
                    type="button"
                    onClick={() => actions.recheck()}
                    disabled={state.isChecking}
                    className="text-xs text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                    {state.isChecking ? (
                        <Spinner className="h-3.5 w-3.5" />
                    ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                    Проверить
                </button>
            </div>

            <div className="p-5 space-y-4">
                <p className="text-xs text-gray-500">
                    Для работы автоматизации историй необходимы все перечисленные ниже компоненты интеграции.
                    Включение автоматизации будет доступно после выполнения всех требований.
                </p>

                {/* ─── Ошибка проверки ─────────────────────────── */}
                {state.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{state.error}</span>
                    </div>
                )}

                {/* ─── 1. Токен сообщества ────────────────────── */}
                <RequirementRow
                    passed={state.hasToken}
                    label="Токен сообщества"
                    dependencyMet={true}
                >
                    {state.hasToken ? (
                        <div className="ml-7 p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs text-gray-600 space-y-0.5">
                            {state.groupName && (
                                <p>Группа: <span className="font-medium text-gray-900">{state.groupName}</span></p>
                            )}
                            {state.groupShortName && (
                                <p>Short name: <code className="bg-green-100/50 px-1 py-0.5 rounded text-[10px]">{state.groupShortName}</code></p>
                            )}
                            {state.groupId && (
                                <p>ID группы: <span className="font-medium">{state.groupId}</span></p>
                            )}
                        </div>
                    ) : (
                        <InlineTokenForm actions={actions} />
                    )}
                </RequirementRow>

                {/* ─── 2. Callback API сервер (переиспользуем компоненты из IntegrationsSection) ─── */}
                <RequirementRow
                    passed={state.hasCallback}
                    label="Callback API сервер"
                    dependencyMet={state.hasToken}
                >
                    {state.hasToken && state.hasCallback ? (
                        <div className="ml-7 p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs text-gray-600 space-y-0.5">
                            <p className="flex items-center gap-1.5">
                                Сервер: <span className="font-medium text-gray-900">«{state.serverName}»</span>
                                {state.callbackStatus && <StatusBadge status={state.callbackStatus} />}
                            </p>
                            {state.serverUrl && (
                                <p>URL: <code className="bg-green-100/50 px-1 py-0.5 rounded text-[10px] break-all">{state.serverUrl}</code></p>
                            )}
                            <p>Включено событий: <span className="font-medium">{state.enabledEventsCount}</span></p>
                        </div>
                    ) : state.hasToken && !state.hasCallback ? (
                        <div className="ml-7 space-y-3">
                            {/* Блок автонастройки (дубль из IntegrationsSection) */}
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <CallbackAutoSetupBlock
                                    isLocal={callbackSetup.state.isLocal}
                                    tunnelMode={callbackSetup.state.tunnelMode}
                                    tunnelStatus={callbackSetup.state.tunnelStatus}
                                    isCheckingTunnel={callbackSetup.state.isCheckingTunnel}
                                    canAutoSetup={callbackSetup.state.canAutoSetup}
                                    isSettingUp={callbackSetup.state.isSettingUp}
                                    hasToken={state.hasToken}
                                    hasGroupId={callbackSetup.state.hasGroupId}
                                    allSelected={callbackSetup.state.allSelected}
                                    selectedEventsCount={callbackSetup.state.selectedEvents.size}
                                    vkGroupShortName={actions.projectData?.vkGroupShortName}
                                    vkProjectId={actions.projectData?.vkProjectId}
                                    onAutoSetup={callbackSetup.actions.handleAutoSetup}
                                    onTunnelModeChange={callbackSetup.actions.handleTunnelModeChange}
                                    onCheckTunnel={callbackSetup.actions.checkTunnelStatus}
                                />

                                {/* Селектор событий */}
                                <CallbackEventSelector
                                    showEventSelector={callbackSetup.state.showEventSelector}
                                    onToggleSelector={callbackSetup.actions.toggleEventSelector}
                                    selectedEvents={callbackSetup.state.selectedEvents}
                                    onToggleEvent={callbackSetup.actions.toggleEvent}
                                    onToggleCategory={callbackSetup.actions.toggleCategory}
                                    onSelectAll={callbackSetup.actions.selectAll}
                                    onDeselectAll={callbackSetup.actions.deselectAll}
                                />

                                {/* Текущее состояние из VK */}
                                <CallbackCurrentStateBlock
                                    currentState={callbackSetup.state.currentState}
                                    isLoadingCurrent={callbackSetup.state.isLoadingCurrent}
                                    loadCurrentError={callbackSetup.state.loadCurrentError}
                                    onLoadCurrentSettings={callbackSetup.actions.loadCurrentSettings}
                                />

                                {/* Результат автонастройки */}
                                <CallbackSetupResult
                                    setupResult={callbackSetup.state.setupResult}
                                    setupError={callbackSetup.state.setupError}
                                    vkGroupShortName={actions.projectData?.vkGroupShortName}
                                    vkProjectId={actions.projectData?.vkProjectId}
                                />
                            </div>
                        </div>
                    ) : null}
                </RequirementRow>

                {/* ─── 3. Событие wall_post_new ──────────────── */}
                <RequirementRow
                    passed={state.hasWallPostNew}
                    label="Событие wall_post_new"
                    dependencyMet={state.hasToken && state.hasCallback}
                >
                    {state.hasToken && state.hasCallback && state.hasWallPostNew ? (
                        <div className="ml-7 p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs text-green-700">
                            Событие «Добавление записи на стене» активно. Система будет получать уведомления о новых постах.
                        </div>
                    ) : state.hasToken && state.hasCallback && !state.hasWallPostNew ? (
                        <div className="ml-7 space-y-2">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                                <p className="font-medium">Событие «wall_post_new» не включено</p>
                                <p>
                                    Для корректной работы автоматизации историй необходимо включить событие 
                                    <code className="bg-amber-100 px-1 py-0.5 rounded mx-0.5">wall_post_new</code>
                                    (Добавление записи на стене). Без него система не будет получать уведомления о новых постах.
                                </p>
                                <p className="text-amber-600">
                                    Текущие настройки callback будут дополнены — уже включённые события ({state.enabledEventsCount}) останутся без изменений.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => actions.enableWallPostNew()}
                                disabled={actions.isEnabling}
                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors shadow-sm ${
                                    actions.isEnabling
                                        ? 'bg-indigo-300 text-white cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                            >
                                {actions.isEnabling ? (
                                    <>
                                        <Spinner className="h-4 w-4" />
                                        Включение...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Включить wall_post_new
                                    </>
                                )}
                            </button>
                        </div>
                    ) : null}
                </RequirementRow>
            </div>
                    </div>
                )}
            </div>
        </div>
    );
};

