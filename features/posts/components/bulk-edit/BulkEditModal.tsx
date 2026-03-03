/**
 * Главная модалка массового редактирования постов
 * Содержит все шаги: поиск, результаты, прогресс, завершение
 */

import React, { useState } from 'react';
import { Project } from '../../../../shared/types';
import { UnifiedPost } from '../../../schedule/hooks/useScheduleData';
import { useBulkEdit } from '../../hooks/useBulkEdit';
import { BulkEditSearchStep } from './BulkEditSearchStep';
import { BulkEditResultsStep } from './BulkEditResultsStep';
import { BulkEditProgressStep } from './BulkEditProgressStep';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';

interface BulkEditModalProps {
    /** Исходный пост, копии которого ищем */
    sourcePost: UnifiedPost;
    /** Все доступные проекты */
    allProjects: Project[];
    /** Колбек при завершении редактирования */
    onComplete: (affectedProjectIds: string[]) => void;
    /** Колбек для закрытия модалки */
    onClose: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
    sourcePost,
    allProjects,
    onComplete,
    onClose
}) => {
    const bulkEdit = useBulkEdit({
        sourcePost,
        allProjects,
        onComplete,
        onClose
    });
    
    // Состояние модалки подтверждения закрытия
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    
    // Определяем, нужно ли подтверждение закрытия
    // Подтверждение нужно на шагах 'search' (если уже настроили критерии) и 'results'
    const needsCloseConfirmation = bulkEdit.step === 'search' || bulkEdit.step === 'results';
    
    // Попытка закрыть модалку (с подтверждением если нужно)
    const requestClose = () => {
        // Во время выполнения — закрытие заблокировано полностью
        if (bulkEdit.step === 'progress') return;
        // На шаге 'complete' — закрываем без подтверждения
        if (bulkEdit.step === 'complete') {
            onClose();
            return;
        }
        // На шагах search/results — показываем подтверждение
        if (needsCloseConfirmation) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    };
    
    // Заголовок в зависимости от шага
    const getTitle = () => {
        switch (bulkEdit.step) {
            case 'search':
                return 'Массовое редактирование — Поиск';
            case 'results':
                return `Массовое редактирование — Найдено ${bulkEdit.searchResponse?.matchedPosts.length || 0}`;
            case 'progress':
                return 'Массовое редактирование — Выполнение';
            case 'complete':
                return 'Массовое редактирование — Завершено';
            default:
                return 'Массовое редактирование';
        }
    };
    
    return (
        <>
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
            onClick={requestClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-up flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Шапка */}
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
                    {/* Кнопка закрытия (скрыта во время выполнения) */}
                    {bulkEdit.step !== 'progress' && (
                        <button 
                            onClick={requestClose} 
                            className="text-gray-400 hover:text-gray-600 transition-colors" 
                            title="Закрыть"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </header>
                
                {/* Контент в зависимости от шага */}
                <main className="flex-1 overflow-y-auto custom-scrollbar">
                    {bulkEdit.step === 'search' && (
                        <BulkEditSearchStep
                            sourcePost={sourcePost}
                            allProjects={allProjects}
                            searchForm={bulkEdit.searchForm}
                            isLoading={bulkEdit.isLoading}
                            error={bulkEdit.error}
                            canSearch={bulkEdit.canSearch}
                            onToggleMatchCriteria={bulkEdit.toggleMatchCriteria}
                            onTogglePostType={bulkEdit.togglePostType}
                            onToggleProject={bulkEdit.toggleProject}
                            onToggleAllProjects={bulkEdit.toggleAllProjects}
                            onUpdateSearchForm={bulkEdit.updateSearchForm}
                            onSearch={bulkEdit.handleSearch}
                            onCancel={requestClose}
                        />
                    )}
                    
                    {bulkEdit.step === 'results' && bulkEdit.searchResponse && (
                        <BulkEditResultsStep
                            sourcePost={sourcePost}
                            allProjects={allProjects}
                            searchResponse={bulkEdit.searchResponse}
                            selectedPosts={bulkEdit.selectedPosts}
                            editForm={bulkEdit.editForm}
                            isLoading={bulkEdit.isLoading}
                            canApply={bulkEdit.canApply}
                            hasChanges={bulkEdit.hasChanges}
                            confirmationText={bulkEdit.confirmationText}
                            onTogglePostSelection={bulkEdit.togglePostSelection}
                            onSelectAll={bulkEdit.selectAllPosts}
                            onDeselectAll={bulkEdit.deselectAllPosts}
                            onUpdateText={bulkEdit.updateEditText}
                            onUpdateImages={bulkEdit.updateEditImages}
                            onUpdateAttachments={bulkEdit.updateEditAttachments}
                            onToggleDateChange={bulkEdit.toggleDateChange}
                            onUpdateDate={bulkEdit.updateEditDate}
                            onApply={bulkEdit.handleApply}
                            onBack={bulkEdit.goBack}
                        />
                    )}
                    
                    {(bulkEdit.step === 'progress' || bulkEdit.step === 'complete') && (
                        <BulkEditProgressStep
                            taskStatus={bulkEdit.taskStatus}
                            isComplete={bulkEdit.step === 'complete'}
                            onClose={bulkEdit.handleComplete}
                        />
                    )}
                </main>
            </div>
            
        </div>

        {/* Подтверждение закрытия — вне основного backdrop, чтобы клики не всплывали */}
        {showCloseConfirm && (
            <ConfirmationModal
                title="Закрыть массовое редактирование?"
                message="Все введённые параметры поиска и найденные результаты будут потеряны."
                confirmText="Закрыть"
                cancelText="Остаться"
                confirmButtonVariant="danger"
                onConfirm={onClose}
                onCancel={() => setShowCloseConfirm(false)}
                zIndex="z-[60]"
            />
        )}
        </>
    );
};
