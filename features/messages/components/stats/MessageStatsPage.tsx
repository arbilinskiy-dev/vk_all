/**
 * Главная страница статистики сообщений.
 * Кросс-проектный дашборд с тремя вкладками:
 *   - «Входящие» — сводка, график, таблица проектов (фокус на входящих)
 *   - «Исходящие» — сводка, график, таблица администраторов + проектов (фокус на исходящих)
 *   - «Подписки» — подписки/отписки (message_allow / message_deny)
 * Шапка, фильтры периода и панель чата — общие для всех вкладок.
 *
 * Hub-файл: импортирует хук и под-компоненты, контракт не изменён.
 */

import React, { useState, useCallback } from 'react';
import { Project } from '../../../../shared/types';
import { CustomDatePicker } from '../../../../shared/components/pickers/CustomDatePicker';
import { MessageStatsChart } from './MessageStatsChart';
import { PERIOD_OPTIONS, STATS_TAB_OPTIONS } from './messageStatsConstants';
import { useMessageStatsLogic } from './useMessageStatsLogic';
import { MessageStatsSkeleton } from './MessageStatsSkeleton';
import { SummaryCard } from './MessageStatsHelpers';
import { ProjectsStatsTable } from './ProjectsStatsTable';
import { AdminStatsTable } from './AdminStatsTable';
import { MonitoringChatPanel, MonitoringChatUser } from './MonitoringChatPanel';
import { SubscriptionsChart } from './SubscriptionsChart';
import { SubscriptionsProjectsTable } from './SubscriptionsProjectsTable';

interface MessageStatsPageProps {
    /** Список всех проектов (для маппинга project_id → название) */
    projects: Project[];
    /** Колбэк перехода в чат с пользователем */
    onNavigateToChat?: (projectId: string, vkUserId: number) => void;
}

export const MessageStatsPage: React.FC<MessageStatsPageProps> = ({
    projects,
    onNavigateToChat,
}) => {
    const { state, actions } = useMessageStatsLogic(projects);

    // --- Состояние панели чата справа ---
    const [chatUser, setChatUser] = useState<MonitoringChatUser | null>(null);

    /** Выбрать пользователя для просмотра переписки в панели справа */
    const handleSelectChatUser = useCallback((user: MonitoringChatUser) => {
        setChatUser(prev => {
            // Если тот же пользователь — закрываем панель
            if (prev && prev.vkUserId === user.vkUserId && prev.projectId === user.projectId) {
                return null;
            }
            return user;
        });
    }, []);

    /** Закрыть панель чата */
    const handleCloseChatPanel = useCallback(() => {
        setChatUser(null);
    }, []);

    // --- Рендер: Скелетон ---
    if (state.isLoading && !state.summary) {
        return <MessageStatsSkeleton />;
    }

    // --- Рендер: Ошибка ---
    if (state.error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{state.error}</p>
                    <button
                        onClick={actions.loadDashboard}
                        className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Повторить
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-gray-50">
            {/* === Основной контент (скроллится) === */}
            <div className={`h-full overflow-y-auto custom-scrollbar flex-1 min-w-0 transition-all duration-300 ${chatUser ? '' : ''}`}>
            <div className="max-w-7xl px-6 py-6 space-y-6">

                {/* === Заголовок + кнопки === */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Мониторинг сообщений</h1>
                        <p className="text-sm text-gray-500">Нагрузка по всем проектам</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={actions.handleReconcile}
                            disabled={state.isReconciling}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-amber-50 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Сверить статистику с реальными данными VK API (messages.getHistory)"
                        >
                            <svg className={`w-4 h-4 ${state.isReconciling ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {state.isReconciling ? 'Сверка...' : 'Сверка'}
                        </button>
                        <button
                            onClick={actions.handleSyncFromLogs}
                            disabled={state.isSyncing}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Заполнить статистику из существующих callback-логов"
                        >
                            <svg className={`w-4 h-4 ${state.isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            {state.isSyncing ? 'Синхронизация...' : 'Синхр. из логов'}
                        </button>
                        <button
                            onClick={actions.loadDashboard}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            title="Обновить данные"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Обновить
                        </button>
                    </div>
                </div>

                {/* Прогресс синхронизации из логов */}
                {state.syncProgress && state.isSyncing && (
                    <div className="rounded-md px-4 py-3 text-sm bg-blue-50 text-blue-700 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                                {state.syncProgress.message || 'Синхронизация...'}
                            </span>
                            <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        {/* Основной прогресс — чтение логов */}
                        {(state.syncProgress.total ?? 0) > 0 && (
                            <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.round(((state.syncProgress.loaded ?? 0) / (state.syncProgress.total ?? 1)) * 100)}%` }}
                                />
                            </div>
                        )}
                        {/* Вложенный прогресс — фаза сохранения */}
                        {state.syncProgress.sub_message && (
                            <div className="mt-1">
                                <span className="text-xs text-blue-600">{state.syncProgress.sub_message}</span>
                                {(state.syncProgress.sub_total ?? 0) > 0 && (
                                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                                        <div
                                            className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.round(((state.syncProgress.sub_loaded ?? 0) / (state.syncProgress.sub_total ?? 1)) * 100)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Результат синхронизации */}
                {state.syncResult && !state.isSyncing && (
                    <div className={`rounded-md px-4 py-3 text-sm flex items-center justify-between ${state.syncResult.startsWith('Ошибка') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <span>{state.syncResult}</span>
                        <button onClick={() => actions.setSyncResult(null)} className="text-gray-400 hover:text-gray-600 ml-3" title="Закрыть">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Результат сверки / прогресс */}
                {state.reconcileProgress && state.isReconciling && (
                    <div className="rounded-md px-4 py-3 text-sm bg-amber-50 text-amber-700 border border-amber-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                                Сверка: {state.reconcileProgress.processed} / {state.reconcileProgress.total} диалогов ({state.reconcileProgress.percent}%)
                            </span>
                            <svg className="w-4 h-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <div className="w-full bg-amber-200 rounded-full h-2">
                            <div
                                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${state.reconcileProgress.percent}%` }}
                            />
                        </div>
                    </div>
                )}
                {state.reconcileResult && !state.isReconciling && (
                    <div className={`rounded-md px-4 py-3 text-sm flex items-center justify-between ${state.reconcileResult.startsWith('Ошибка') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        <span>{state.reconcileResult}</span>
                        <button onClick={() => actions.setReconcileResult(null)} className="text-gray-400 hover:text-gray-600 ml-3" title="Закрыть">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* === Переключатель вкладок: Входящие / Исходящие / Подписки === */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
                    {STATS_TAB_OPTIONS.map(tab => {
                        const isActive = state.activeTab === tab.value;
                        const colorMap: Record<string, string> = {
                            incoming: 'bg-green-100 text-green-700 shadow-sm',
                            outgoing: 'bg-orange-100 text-orange-700 shadow-sm',
                            subscriptions: 'bg-blue-100 text-blue-700 shadow-sm',
                        };
                        const activeClasses = colorMap[tab.value] || 'bg-gray-100 text-gray-700 shadow-sm';
                        const dotColor: Record<string, string> = {
                            incoming: 'bg-green-500',
                            outgoing: 'bg-orange-500',
                            subscriptions: 'bg-blue-500',
                        };
                        return (
                            <button
                                key={tab.value}
                                onClick={() => actions.setActiveTab(tab.value)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                                    isActive
                                        ? activeClasses
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${
                                    dotColor[tab.value] || 'bg-gray-500'
                                }`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* === Фильтры периода (pill-переключатели) — общие для обеих вкладок === */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Период:</span>
                    <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto custom-scrollbar">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => actions.setPeriodType(opt.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                    state.periodType === opt.value
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Кастомные даты при выборе «Свой период» */}
                    {state.periodType === 'custom' && (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm animate-expand-down">
                            <CustomDatePicker
                                value={state.customStartDate}
                                onChange={actions.setCustomStartDate}
                                placeholder="Начало"
                                className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                            />
                            <span className="text-gray-300 text-xs px-1">—</span>
                            <CustomDatePicker
                                value={state.customEndDate}
                                onChange={actions.setCustomEndDate}
                                placeholder="Конец"
                                className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                            />
                        </div>
                    )}

                    {/* Индикатор фильтра по проекту */}
                    {state.selectedProjectId && (
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                            <span className="text-xs text-indigo-700 font-medium">
                                {state.projectsMap.get(state.selectedProjectId)?.name || state.selectedProjectId}
                            </span>
                            <button
                                onClick={() => actions.setSelectedProjectId(null)}
                                className="text-indigo-400 hover:text-indigo-600"
                                title="Сбросить фильтр проекта"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* ============================================================
                    ВКЛАДКА: ВХОДЯЩИЕ
                   ============================================================ */}
                {state.activeTab === 'incoming' && state.displaySummary && (
                    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        {/* --- Блок 1: Сообщения --- */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Сообщения</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <SummaryCard label="Всего входящих" value={state.displaySummary.total_incoming} color="green"
                                    onClick={() => actions.setIncomingSubFilter('all')} />
                                <SummaryCard label="По кнопке / бот" value={state.displaySummary.incoming_payload ?? 0} color="indigo"
                                    active={state.incomingSubFilter === 'payload'}
                                    onClick={() => actions.toggleIncomingSubFilter('payload')} />
                                <SummaryCard label="Реальные (набранные)" value={(state.displaySummary as any).filtered_incoming_text ?? state.displaySummary.incoming_text ?? 0} color="green"
                                    active={state.incomingSubFilter === 'text'}
                                    onClick={() => actions.toggleIncomingSubFilter('text')} />
                            </div>
                        </div>

                        {/* --- Блок 2: Диалоги --- */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Диалоги</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <SummaryCard label="Всего диалогов" value={state.displaySummary.incoming_dialogs ?? state.displaySummary.unique_dialogs ?? 0} color="purple"
                                    onClick={() => actions.setIncomingSubFilter('all')} />
                                <SummaryCard label="С нажатием кнопки" value={state.displaySummary.dialogs_with_payload ?? 0} color="indigo"
                                    active={state.incomingSubFilter === 'payload'}
                                    onClick={() => actions.toggleIncomingSubFilter('payload')} />
                                <SummaryCard label="С реальными сообщ." value={state.displaySummary.dialogs_with_text ?? 0} color="green"
                                    active={state.incomingSubFilter === 'text'}
                                    onClick={() => actions.toggleIncomingSubFilter('text')} />
                            </div>
                        </div>

                        {/* --- Блок 3: Юзеры --- */}
                        <div>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Пользователи</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <SummaryCard label="Уник. юзеров всего" value={state.displaySummary.incoming_users ?? 0} color="purple"
                                    onClick={() => actions.setIncomingSubFilter('all')} />
                                <SummaryCard label="Нажимали кнопки" value={state.displaySummary.unique_payload_users ?? 0} color="indigo"
                                    active={state.incomingSubFilter === 'payload'}
                                    onClick={() => actions.toggleIncomingSubFilter('payload')} />
                                <SummaryCard label="Отправляли сообщ." value={state.displaySummary.unique_text_users ?? 0} color="green"
                                    active={state.incomingSubFilter === 'text'}
                                    onClick={() => actions.toggleIncomingSubFilter('text')} />
                            </div>
                        </div>

                        {/* --- График (только входящие) --- */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                График входящих
                                {state.incomingSubFilter !== 'all' && (
                                    <span className="text-sm font-normal text-indigo-500 ml-2">
                                        — {state.incomingSubFilter === 'text' ? 'реальные (набранные)' : 'по кнопке / бот'}
                                    </span>
                                )}
                                {state.selectedProjectId && (
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        — {state.projectsMap.get(state.selectedProjectId)?.name || state.selectedProjectId}
                                    </span>
                                )}
                            </h2>
                            <MessageStatsChart
                                data={state.filteredChartData}
                                visibleLines="incoming"
                                overlayMetrics={state.displaySummary ? [
                                    // Сообщения
                                    { key: 'incoming_payload', label: 'Кнопка/бот', total: state.displaySummary.incoming_payload ?? 0 },
                                    { key: 'incoming_text', label: 'Реальные', total: state.displaySummary.incoming_text ?? 0 },
                                    // Диалоги
                                    { key: 'incoming_dialogs', label: 'Диалогов', total: state.displaySummary.incoming_dialogs ?? state.displaySummary.unique_dialogs ?? 0 },
                                    // Пользователи
                                    { key: 'unique_users', label: 'Юзеров всего', total: state.displaySummary.incoming_users ?? 0 },
                                    { key: 'unique_payload_users', label: 'Нажимали кнопки', total: state.displaySummary.unique_payload_users ?? 0 },
                                    { key: 'unique_text_users', label: 'Отправляли сообщ.', total: state.displaySummary.unique_text_users ?? 0 },
                                ] : undefined}
                            />
                        </div>

                        {/* --- Таблица проектов (акцент на входящих) --- */}
                        <ProjectsStatsTable
                            filteredProjectsStats={state.displayProjectsStats}
                            projectsMap={state.projectsMap}
                            expandedProjects={state.expandedProjects}
                            usersDataMap={state.usersDataMap}
                            selectedProjectId={state.selectedProjectId}
                            directionFilter={state.directionFilter}
                            projectSearch={state.projectSearch}
                            activeTab={state.activeTab}
                            toggleProjectExpand={actions.toggleProjectExpand}
                            handleProjectFilter={actions.handleProjectFilter}
                            setProjectSearch={actions.setProjectSearch}
                            filterUsersByDirection={actions.filterUsersByDirection}
                            onNavigateToChat={onNavigateToChat}
                            onSelectChatUser={handleSelectChatUser}
                            activeChatUser={chatUser}
                        />
                    </div>
                )}

                {/* ============================================================
                    ВКЛАДКА: ИСХОДЯЩИЕ
                   ============================================================ */}
                {state.activeTab === 'outgoing' && state.displaySummary && (
                    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        {/* --- Сводка исходящих --- */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <SummaryCard label="Исходящих всего" value={state.displaySummary.total_outgoing} color="orange" />
                            <SummaryCard label="Администратор" value={state.displaySummary.outgoing_system ?? 0} color="orange" />
                            <SummaryCard label="Бот / рассылка" value={state.displaySummary.outgoing_bot ?? 0} color="indigo" />
                            <SummaryCard label="Получателей" value={state.displaySummary.outgoing_recipients ?? 0} color="purple" />
                        </div>

                        {/* --- Детализация исходящих --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Уник. пользователей (исх.)</p>
                                <p className="text-2xl font-bold text-orange-700">{(state.displaySummary.outgoing_users ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Уник. диалогов</p>
                                <p className="text-2xl font-bold text-purple-600">{(state.displaySummary.unique_dialogs ?? 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Проектов с исходящими</p>
                                <p className="text-2xl font-bold text-indigo-600">{state.filteredProjectsStats.filter(p => p.total_outgoing > 0).length}</p>
                            </div>
                        </div>

                        {/* --- График (только исходящие) --- */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                График исходящих
                                {state.selectedProjectId && (
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        — {state.projectsMap.get(state.selectedProjectId)?.name || state.selectedProjectId}
                                    </span>
                                )}
                            </h2>
                            <MessageStatsChart
                                data={state.chartData}
                                visibleLines="outgoing"
                                overlayMetrics={state.displaySummary ? [
                                    // Исходящие: детализация
                                    { key: 'outgoing_system', label: 'Админ', total: state.displaySummary.outgoing_system ?? 0 },
                                    { key: 'outgoing_bot', label: 'Бот/рассылка', total: state.displaySummary.outgoing_bot ?? 0 },
                                    { key: 'outgoing_recipients', label: 'Получателей', total: state.displaySummary.outgoing_recipients ?? 0 },
                                ] : undefined}
                            />
                        </div>

                        {/* --- Таблица администраторов (только на вкладке исходящих) --- */}
                        <AdminStatsTable
                            adminStats={state.adminStats}
                            expandedAdmins={state.expandedAdmins}
                            adminDialogsMap={state.adminDialogsMap}
                            projectsMap={state.projectsMap}
                            toggleAdminExpand={actions.toggleAdminExpand}
                            onNavigateToChat={onNavigateToChat}
                            onSelectChatUser={handleSelectChatUser}
                            activeChatUser={chatUser}
                        />

                        {/* --- Таблица проектов (акцент на исходящих) --- */}
                        <ProjectsStatsTable
                            filteredProjectsStats={state.filteredProjectsStats}
                            projectsMap={state.projectsMap}
                            expandedProjects={state.expandedProjects}
                            usersDataMap={state.usersDataMap}
                            selectedProjectId={state.selectedProjectId}
                            directionFilter={state.directionFilter}
                            projectSearch={state.projectSearch}
                            activeTab={state.activeTab}
                            toggleProjectExpand={actions.toggleProjectExpand}
                            handleProjectFilter={actions.handleProjectFilter}
                            setProjectSearch={actions.setProjectSearch}
                            filterUsersByDirection={actions.filterUsersByDirection}
                            onNavigateToChat={onNavigateToChat}
                            onSelectChatUser={handleSelectChatUser}
                            activeChatUser={chatUser}
                        />
                    </div>
                )}

                {/* ============================================================
                    ВКЛАДКА: ПОДПИСКИ / ОТПИСКИ
                   ============================================================ */}
                {state.activeTab === 'subscriptions' && (
                    <div className="space-y-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                        {/* --- Лоадер ленивой загрузки --- */}
                        {state.subsLoading && !state.subsSummary && (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-sm">Загрузка данных подписок...</span>
                                </div>
                            </div>
                        )}

                        {/* --- Сводка подписок --- */}
                        {state.subsSummary && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <SummaryCard label="Подписок (allow)" value={state.subsSummary.total_allow} color="green" />
                                    <SummaryCard label="Отписок (deny)" value={state.subsSummary.total_deny} color="red" />
                                </div>

                                {/* --- График подписок/отписок --- */}
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        График подписок / отписок
                                        {state.selectedProjectId && (
                                            <span className="text-sm font-normal text-gray-500 ml-2">
                                                — {state.projectsMap.get(state.selectedProjectId)?.name || state.selectedProjectId}
                                            </span>
                                        )}
                                    </h2>
                                    <SubscriptionsChart data={state.subsChart} />
                                </div>

                                {/* --- Таблица проектов подписок --- */}
                                <SubscriptionsProjectsTable
                                    projects={state.filteredSubsProjects}
                                    projectsMap={state.projectsMap}
                                    expandedProjects={state.subsExpandedProjects}
                                    usersMap={state.subsUsersMap}
                                    projectSearch={state.projectSearch}
                                    setProjectSearch={actions.setProjectSearch}
                                    toggleExpand={actions.toggleSubsProjectExpand}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>
            </div>

            {/* === Панель чата справа (read-only превью переписки) === */}
            {chatUser && (
                <div className="w-[420px] h-full flex-shrink-0 border-l border-gray-200 animate-fade-in">
                    <MonitoringChatPanel
                        chatUser={chatUser}
                        projectsMap={state.projectsMap}
                        onClose={handleCloseChatPanel}
                        onNavigateToChat={onNavigateToChat}
                    />
                </div>
            )}
        </div>
    );
};
