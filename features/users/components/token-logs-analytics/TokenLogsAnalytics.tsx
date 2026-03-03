import React from 'react';
import { useTokenLogsAnalytics } from './useTokenLogsAnalytics';
import {
    AccountSelector,
    HorizontalBarChart,
    StatsTable,
    SummaryCards,
    ViewModeToggle,
    SelectAccountsEmpty,
    LoadingState,
    NoDataEmpty,
} from './components';

/**
 * Основной компонент аналитики VK API токенов
 * 
 * Это хаб-компонент, который:
 * - Использует хук useTokenLogsAnalytics для управления логикой
 * - Композирует UI из дочерних компонентов
 * - Определяет общий лейаут страницы
 */
export const TokenLogsAnalytics: React.FC = () => {
    const {
        accounts,
        selectedAccountIds,
        selectedIdsArray,
        stats,
        summary,
        isLoading,
        viewMode,
        hasData,
        hasSelectedAccounts,
        setSelectedAccountIds,
        setViewMode,
    } = useTokenLogsAnalytics();

    // Определяем какой контент показывать
    const renderContent = () => {
        // Нет выбранных аккаунтов
        if (!hasSelectedAccounts) {
            return <SelectAccountsEmpty />;
        }

        // Загрузка
        if (isLoading) {
            return <LoadingState />;
        }

        // Есть данные — показываем статистику
        if (hasData && stats && summary) {
            return (
                <div className="space-y-4">
                    {/* Саммари карточки */}
                    <SummaryCards
                        totalCalls={summary.totalCalls}
                        uniqueMethods={summary.uniqueMethods}
                        accountsCount={summary.accountsCount}
                    />

                    {/* Переключатель вида */}
                    <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />

                    {/* Основной контент */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        {viewMode === 'chart' ? (
                            <HorizontalBarChart 
                                data={stats}
                                accounts={accounts}
                                selectedAccountIds={selectedIdsArray}
                            />
                        ) : (
                            <StatsTable 
                                data={stats}
                                accounts={accounts}
                                selectedAccountIds={selectedIdsArray}
                            />
                        )}
                    </div>
                </div>
            );
        }

        // Нет данных
        return <NoDataEmpty />;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Заголовок и селектор */}
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Аналитика VK API</h2>
                        <p className="text-sm text-gray-500">
                            Сравнение использования методов по выбранным токенам
                        </p>
                    </div>
                    <AccountSelector 
                        accounts={accounts}
                        selectedIds={selectedAccountIds}
                        onChange={setSelectedAccountIds}
                    />
                </div>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50 p-4">
                {renderContent()}
            </div>
        </div>
    );
};
