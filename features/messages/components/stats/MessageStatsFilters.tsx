/**
 * Фильтры периода и индикатор проекта на странице мониторинга сообщений.
 * Pill-переключатели периода, CustomDatePicker, бейдж выбранного проекта.
 */

import React from 'react';
import { Project } from '../../../../shared/types';
import { CustomDatePicker } from '../../../../shared/components/pickers/CustomDatePicker';
import { PERIOD_OPTIONS } from './messageStatsConstants';
import type { PeriodType } from './messageStatsConstants';

interface MessageStatsFiltersProps {
    /** Текущий выбранный период */
    periodType: PeriodType;
    /** Смена периода */
    onPeriodChange: (value: PeriodType) => void;
    /** Начало кастомного диапазона */
    customStartDate: string;
    /** Конец кастомного диапазона */
    customEndDate: string;
    /** Изменение начальной даты */
    onCustomStartDateChange: (value: string) => void;
    /** Изменение конечной даты */
    onCustomEndDateChange: (value: string) => void;
    /** ID выбранного проекта (фильтр) */
    selectedProjectId: string | null;
    /** Маппинг проектов */
    projectsMap: Map<string, Project>;
    /** Сбросить фильтр по проекту */
    onClearProjectFilter: () => void;
}

export const MessageStatsFilters: React.FC<MessageStatsFiltersProps> = ({
    periodType,
    onPeriodChange,
    customStartDate,
    customEndDate,
    onCustomStartDateChange,
    onCustomEndDateChange,
    selectedProjectId,
    projectsMap,
    onClearProjectFilter,
}) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Период:</span>
        <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto custom-scrollbar">
            {PERIOD_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onPeriodChange(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                        periodType === opt.value
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>

        {/* Кастомные даты при выборе «Свой период» */}
        {periodType === 'custom' && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm animate-expand-down">
                <CustomDatePicker
                    value={customStartDate}
                    onChange={onCustomStartDateChange}
                    placeholder="Начало"
                    className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                />
                <span className="text-gray-300 text-xs px-1">—</span>
                <CustomDatePicker
                    value={customEndDate}
                    onChange={onCustomEndDateChange}
                    placeholder="Конец"
                    className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                />
            </div>
        )}

        {/* Индикатор фильтра по проекту */}
        {selectedProjectId && (
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                <span className="text-xs text-indigo-700 font-medium">
                    {projectsMap.get(selectedProjectId)?.name || selectedProjectId}
                </span>
                <button
                    onClick={onClearProjectFilter}
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
);
