import React from 'react';
import { Project } from '../../../../shared/types';
import { ALL_EVENT_KEYS } from '../../../../shared/utils/callbackEvents';
import { useBulkCallbackSetupLogic } from '../../hooks/useBulkCallbackSetupLogic';
import { TunnelModeSelector } from './TunnelModeSelector';
import { EventSelector } from './EventSelector';
import { BulkSetupProgress } from './BulkSetupProgress';
import { BulkSetupResults } from './BulkSetupResults';

// ─── Типы ─────────────────────────────────────────────────────────

interface BulkCallbackSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    /** Обновляет проекты в родительском компоненте после массовой настройки */
    onComplete: () => void;
}

// ─── Компонент (хаб-контейнер) ────────────────────────────────────

export const BulkCallbackSetupModal: React.FC<BulkCallbackSetupModalProps> = ({
    isOpen,
    onClose,
    projects,
    onComplete,
}) => {
    const { state, actions } = useBulkCallbackSetupLogic({ projects, onClose, onComplete });

    if (!isOpen) return null;

    const {
        isRunning, isFinished, currentIndex, currentProjectName, results,
        tunnelMode, tunnelStatus, isCheckingTunnel,
        selectedEvents, showEventSelector, allSelected,
        isLocal, eligibleProjects, stats, errorResults,
        retryingProjectId, envLabel, envColor, progressPercent,
        wasAborted, estimatedTimeSec, activeProjectsCount, delayBetweenRequests,
    } = state;

    const {
        handleTunnelModeChange, checkTunnelStatus,
        toggleEvent, toggleCategory, selectAll, deselectAll, toggleShowEventSelector,
        handleStart, retryProject, handleAbort, handleClose,
    } = actions;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* ─── Заголовок ──────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            Массовая настройка Callback-серверов
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Автоматическая настройка для всех проектов с токеном
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* ─── Тело модалки ──────────────────────────────── */}
                <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">

                    {/* Информация об окружении */}
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${envColor}`}>
                        {envLabel}
                    </div>

                    {/* ─── Переключатель режима для локалки ─────────── */}
                    {isLocal && !isRunning && !isFinished && (
                        <TunnelModeSelector
                            tunnelMode={tunnelMode}
                            tunnelStatus={tunnelStatus}
                            isCheckingTunnel={isCheckingTunnel}
                            onModeChange={handleTunnelModeChange}
                            onCheckTunnel={checkTunnelStatus}
                        />
                    )}

                    {/* ─── Выбор событий ─────────────────────────── */}
                    {!isRunning && !isFinished && (
                        <EventSelector
                            selectedEvents={selectedEvents}
                            showEventSelector={showEventSelector}
                            allSelected={allSelected}
                            onToggleShow={toggleShowEventSelector}
                            onToggleEvent={toggleEvent}
                            onToggleCategory={toggleCategory}
                            onSelectAll={selectAll}
                            onDeselectAll={deselectAll}
                        />
                    )}

                    {/* До запуска — информация о кандидатах */}
                    {!isRunning && !isFinished && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {eligibleProjects.length}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            Проектов с заполненным токеном
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Из {activeProjectsCount} активных проектов в базе
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {eligibleProjects.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    Нет проектов с заполненным токеном сообщества и ID группы VK. 
                                    Сначала заполните токены в настройках проектов.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">
                                        Будет выполнена настройка Callback-сервера для каждого проекта:
                                    </p>
                                    <ul className="text-sm text-gray-500 space-y-1 ml-4 list-disc">
                                        <li>Получение кода подтверждения (confirmation code)</li>
                                        <li>Создание / обновление Callback-сервера в VK</li>
                                        <li>Подписка на {allSelected ? 'все' : `${selectedEvents.size} из ${ALL_EVENT_KEYS.length}`} событий</li>
                                        <li>Сохранение кода подтверждения в базу</li>
                                    </ul>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Задержка между запросами: {delayBetweenRequests}мс. 
                                        Примерное время: ~{estimatedTimeSec}с
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Во время выполнения — прогресс */}
                    {isRunning && (
                        <BulkSetupProgress
                            currentIndex={currentIndex}
                            totalCount={eligibleProjects.length}
                            progressPercent={progressPercent}
                            currentProjectName={currentProjectName}
                            stats={stats}
                            hasResults={results.length > 0}
                        />
                    )}

                    {/* После завершения — итоги */}
                    {isFinished && (
                        <BulkSetupResults
                            stats={stats}
                            errorResults={errorResults}
                            wasAborted={wasAborted}
                            retryingProjectId={retryingProjectId}
                            onRetry={retryProject}
                        />
                    )}
                </div>

                {/* ─── Футер с кнопками ──────────────────────────── */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                    {/* До запуска */}
                    {!isRunning && !isFinished && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleStart}
                                disabled={eligibleProjects.length === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Настроить все колбэки ({eligibleProjects.length})
                            </button>
                        </>
                    )}

                    {/* Во время выполнения */}
                    {isRunning && (
                        <button
                            onClick={handleAbort}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                        >
                            Остановить
                        </button>
                    )}

                    {/* После завершения */}
                    {isFinished && (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Готово
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
