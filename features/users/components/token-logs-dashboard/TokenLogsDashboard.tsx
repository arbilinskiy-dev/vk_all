import React from 'react';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';
import { useTokenLogsDashboard } from './useTokenLogsDashboard';
import { DashboardHeader, FilterBar, LogsTable } from './components';
import { TokenLogsDashboardProps } from './types';

/**
 * Основной компонент дашборда логов токенов (VK и AI)
 * 
 * Это хаб-компонент, который:
 * - Использует хук useTokenLogsDashboard для управления логикой
 * - Композирует UI из дочерних компонентов
 * - Определяет общий лейаут страницы
 */
export const TokenLogsDashboard: React.FC<TokenLogsDashboardProps> = ({ mode }) => {
    const {
        activeTab,
        
        // VK данные
        vkLogs,
        vkAccounts,
        vkProjects,
        vkSelectedAccountIds,
        setVkSelectedAccountIds,
        vkOptions,
        
        // AI данные
        aiLogs,
        aiTokens,
        aiSelectedTokenIds,
        setAiSelectedTokenIds,
        aiOptions,
        
        // Состояния
        isLoading,
        isRefreshing,
        isLoadingMore,
        isDeleting,
        hasMore,
        totalCount,
        currentLogsCount,
        
        // Фильтры
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        
        // Выбор записей
        selectedLogIds,
        toggleSelectLog,
        toggleSelectAll,
        
        // Удаление
        confirmAction,
        confirmMessage,
        handleDeleteOne,
        handleDeleteSelected,
        handleDeleteAll,
        executeDelete,
        cancelDelete,
        
        // Infinite scroll
        scrollContainerRef,
        loadMore,
        fetchLogsInitial,
    } = useTokenLogsDashboard({ mode });

    return (
        <div className="flex flex-col h-full">
            {/* Заголовок с кнопками */}
            <DashboardHeader
                activeTab={activeTab}
                currentLogsCount={currentLogsCount}
                totalCount={totalCount}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isDeleting={isDeleting}
                onDeleteAll={handleDeleteAll}
                onRefresh={() => fetchLogsInitial({ soft: true })}
            />

            {/* Панель фильтров и выбора */}
            <FilterBar
                selectedLogIds={selectedLogIds}
                currentLogsCount={currentLogsCount}
                isDeleting={isDeleting}
                onDeleteSelected={handleDeleteSelected}
                activeTab={activeTab}
                vkOptions={vkOptions}
                aiOptions={aiOptions}
                vkSelectedAccountIds={vkSelectedAccountIds}
                aiSelectedTokenIds={aiSelectedTokenIds}
                onVkAccountsChange={setVkSelectedAccountIds}
                onAiTokensChange={setAiSelectedTokenIds}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
            />

            {/* Таблица с infinite scroll */}
            <LogsTable
                ref={scrollContainerRef}
                activeTab={activeTab}
                vkLogs={vkLogs}
                vkAccounts={vkAccounts}
                vkProjects={vkProjects}
                aiLogs={aiLogs}
                aiTokens={aiTokens}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                isDeleting={isDeleting}
                hasMore={hasMore}
                selectedLogIds={selectedLogIds}
                onToggleSelect={toggleSelectLog}
                onToggleSelectAll={toggleSelectAll}
                onDeleteOne={handleDeleteOne}
                onLoadMore={loadMore}
            />

            {/* Модальное окно подтверждения удаления */}
            {confirmAction && (
                <ConfirmationModal
                    title="Подтверждение удаления"
                    message={confirmMessage}
                    onConfirm={executeDelete}
                    onCancel={cancelDelete}
                    confirmText="Удалить"
                    confirmButtonVariant="danger"
                    isConfirming={isDeleting}
                />
            )}
        </div>
    );
};
