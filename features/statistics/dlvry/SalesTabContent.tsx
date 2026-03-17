/**
 * Таб «Статистика продаж» — ХАБ-контейнер.
 * Данные из DLVRY API. Логика вынесена в useSalesTabLogic,
 * UI-секции — в подкомпоненты.
 */

import React from 'react';
import { Project } from '../../../shared/types';
import { COLUMN_GROUPS } from './salesTabConstants';
import { useSalesTabLogic } from './useSalesTabLogic';
import { useSalesChartData } from './useSalesChartData';
import { SalesSyncButtons } from './SalesSyncButtons';
import { SalesPeriodSelector } from './SalesPeriodSelector';
import { SalesChart } from './SalesChart';
import { SalesDailyTable } from './SalesDailyTable';
import { SourcesInfographic } from './SourcesInfographic';

interface SalesTabContentProps {
    project: Project;
    affiliateId?: string | null;
}

export const SalesTabContent: React.FC<SalesTabContentProps> = ({ project, affiliateId }) => {
    const { state, actions } = useSalesTabLogic({ projectId: String(project.id), affiliateId });
    const { chartData, granularity, isLoading: chartLoading } = useSalesChartData({
        projectId: String(project.id),
        affiliateId,
        dateFrom: state.dateFrom,
        dateTo: state.dateTo,
        activePreset: state.activePreset,
    });

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* ─── Кнопки + карточки ──────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <SalesSyncButtons
                    isSyncing={state.isSyncing}
                    onSync={actions.handleSync}
                    onFullSync={actions.handleFullSync}
                    fullSyncProgress={state.fullSyncProgress}
                />

                {/* Выбор периода */}
                <SalesPeriodSelector
                    activePreset={state.activePreset}
                    onPresetChange={actions.applyPreset}
                    ymYear={state.ymYear}
                    ymMonth={state.ymMonth}
                    yearDropdownOpen={state.yearDropdownOpen}
                    yearDropdownRef={state.yearDropdownRef}
                    availableMonths={state.availableMonths}
                    onYmYearChange={actions.setYmYear}
                    onYmMonthChange={actions.setYmMonth}
                    onYearDropdownToggle={actions.setYearDropdownOpen}
                    onApplyYearMonth={actions.applyYearMonth}
                    dateFrom={state.dateFrom}
                    dateTo={state.dateTo}
                    onDateFromChange={actions.setDateFrom}
                    onDateToChange={actions.setDateTo}
                />

                {/* ── Инфографика источников заказов ─────────────────────── */}
                <SourcesInfographic totals={state.totals} isLoading={state.isLoading} />

                {/* ── Линейный график динамики ────────────────────────────── */}
                <div className="mt-4">
                    <SalesChart data={chartData} granularity={granularity} isLoading={chartLoading} />
                </div>
            </div>

            {/* ─── Фильтры: колонки ──────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 py-3 bg-gray-50/50 border-b border-gray-200">
                <div className="flex flex-col gap-3">
                    {/* Чипы групп колонок */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Колонки:</span>
                        {COLUMN_GROUPS.map(g => (
                            <button
                                key={g.key}
                                onClick={() => actions.toggleGroup(g.key)}
                                disabled={g.key === 'main'}
                                className={`px-3 py-1 text-xs font-medium rounded-md border transition-all duration-200 whitespace-nowrap ${
                                    state.activeGroups.has(g.key)
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                                } ${g.key === 'main' ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ошибка загрузки */}
            {state.error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{state.error}</div>
            )}

            {/* ─── Таблица дневной статистики ──────────────────────────────── */}
            <SalesDailyTable
                days={state.days}
                totals={state.totals}
                activeGroups={state.activeGroups}
                isLoading={state.isLoading}
                isLoadingMore={state.isLoadingMore}
                hasMore={state.hasMore}
                totalCount={state.totalCount}
                isSyncing={state.isSyncing}
                tableScrollRef={state.tableScrollRef}
                onSync={actions.handleSync}
                onLoadMore={actions.loadMore}
            />
        </div>
    );
};
