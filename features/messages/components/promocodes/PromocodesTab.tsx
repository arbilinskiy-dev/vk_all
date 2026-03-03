/**
 * PromocodesTab — хаб-контейнер вкладки «Промокоды» в правой панели сообщений.
 * Вся логика — в usePromocodesTabLogic, рендер — в подкомпонентах.
 * Внешний контракт: PromocodesTab({ projectId, vkGroupId?, onNavigateToChat? })
 */

import React from 'react';
import { usePromocodesTabLogic } from './usePromocodesTabLogic';
import { PromoListForm } from './PromoListForm';
import { PromoAddCodesForm } from './PromoAddCodesForm';
import { PromoCodesTable } from './PromoCodesTable';
import { PromoListsView } from './PromoListsView';

interface PromocodesTabProps {
    /** ID проекта */
    projectId: string | null;
    /** VK group_id сообщества (для ссылок на ЛС) */
    vkGroupId?: number | null;
    /** Колбэк навигации к чату внутри системы (по VK user_id) */
    onNavigateToChat?: (vkUserId: number) => void;
}

export const PromocodesTab: React.FC<PromocodesTabProps> = ({ projectId, vkGroupId, onNavigateToChat }) => {
    const { state, actions } = usePromocodesTabLogic({ projectId });

    // === Загрузка ===
    if (state.isLoadingLists && state.mode === 'lists') {
        return (
            <div className="flex-1 flex items-center justify-center py-8">
                <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                <span className="text-xs text-gray-400 ml-2">Загрузка промокодов...</span>
            </div>
        );
    }

    // === Ошибка ===
    if (state.listsError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-red-400 text-center">{state.listsError}</p>
            </div>
        );
    }

    // === Форма создания/редактирования списка ===
    if (state.mode === 'create-list' || state.mode === 'edit-list') {
        return (
            <PromoListForm
                editingList={state.editingList}
                formName={state.formName}
                formSlug={state.formSlug}
                formOneTime={state.formOneTime}
                isSaving={state.isSaving}
                onFormNameChange={actions.setFormName}
                onFormSlugChange={actions.setFormSlug}
                onFormOneTimeChange={actions.setFormOneTime}
                generateSlug={actions.generateSlug}
                onSave={actions.handleSaveList}
                onCancel={() => actions.setMode(state.editingList ? 'codes' : 'lists')}
            />
        );
    }

    // === Форма добавления промокодов ===
    if (state.mode === 'add-codes' && state.selectedListId) {
        return (
            <PromoAddCodesForm
                bulkText={state.bulkText}
                isSaving={state.isSaving}
                onBulkTextChange={actions.setBulkText}
                onSave={actions.handleSaveCodes}
                onCancel={() => actions.setMode('codes')}
            />
        );
    }

    // === Таблица промокодов внутри списка ===
    if (state.mode === 'codes' && state.selectedList) {
        return (
            <PromoCodesTable
                selectedList={state.selectedList}
                selectedListId={state.selectedListId}
                codes={state.codes}
                codesResponse={state.codesResponse}
                isLoadingCodes={state.isLoadingCodes}
                statusFilter={state.statusFilter}
                onStatusFilterChange={actions.setStatusFilter}
                confirmDeleteCode={state.confirmDeleteCode}
                confirmDeleteAllFree={state.confirmDeleteAllFree}
                isDeleting={state.isDeleting}
                onSetConfirmDeleteCode={actions.setConfirmDeleteCode}
                onSetConfirmDeleteAllFree={actions.setConfirmDeleteAllFree}
                onBackToLists={actions.handleBackToLists}
                onEditList={actions.handleEditList}
                onAddCodesMode={actions.handleAddCodesMode}
                onDeleteCode={actions.handleDeleteCode}
                onDeleteAllFree={actions.handleDeleteAllFree}
                vkGroupId={vkGroupId}
                onNavigateToChat={onNavigateToChat}
            />
        );
    }

    // === Главный экран: списки промокодов ===
    return (
        <PromoListsView
            filteredLists={state.filteredLists}
            variables={state.variables}
            searchQuery={state.searchQuery}
            confirmDeleteList={state.confirmDeleteList}
            isDeleting={state.isDeleting}
            onSearchChange={actions.setSearchQuery}
            onCreateList={actions.handleCreateList}
            onOpenCodes={actions.handleOpenCodes}
            onEditList={actions.handleEditList}
            onDeleteList={actions.handleDeleteList}
            onSetConfirmDeleteList={actions.setConfirmDeleteList}
        />
    );
};

