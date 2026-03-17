/**
 * Селектор периода: pill-пресеты, режим «По месяцам» (год + 12 месяцев),
 * режим «Свой период» (два date-picker).
 */

import React from 'react';
import { PeriodPreset, PERIOD_PRESETS, MONTH_NAMES_SHORT, getAvailableYears } from './salesTabConstants';
import { CustomDatePicker } from '../../../shared/components/pickers/CustomDatePicker';

interface SalesPeriodSelectorProps {
    activePreset: PeriodPreset;
    onPresetChange: (preset: PeriodPreset) => void;
    // «По месяцам»
    ymYear: number;
    ymMonth: number;
    yearDropdownOpen: boolean;
    yearDropdownRef: React.RefObject<HTMLDivElement>;
    availableMonths: Set<string>;
    onYmYearChange: (year: number) => void;
    onYmMonthChange: (month: number) => void;
    onYearDropdownToggle: (open: boolean) => void;
    onApplyYearMonth: (year: number, month: number) => void;
    // «Свой период»
    dateFrom: string;
    dateTo: string;
    onDateFromChange: (val: string) => void;
    onDateToChange: (val: string) => void;
}

export const SalesPeriodSelector: React.FC<SalesPeriodSelectorProps> = ({
    activePreset,
    onPresetChange,
    ymYear,
    ymMonth,
    yearDropdownOpen,
    yearDropdownRef,
    availableMonths,
    onYmYearChange,
    onYmMonthChange,
    onYearDropdownToggle,
    onApplyYearMonth,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
}) => (
    <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Период:</span>
        <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto custom-scrollbar">
            {PERIOD_PRESETS.map(p => (
                <button
                    key={String(p.key)}
                    onClick={() => onPresetChange(p.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                        activePreset === p.key
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>

        {/* Режим «По месяцам» — выбор года + 12 месяцев */}
        {activePreset === 'year_month' && (
            <div className="flex items-center gap-2 flex-wrap">
                {/* Кастомный дропдаун года */}
                <div ref={yearDropdownRef} className="relative">
                    <button
                        type="button"
                        onClick={() => onYearDropdownToggle(!yearDropdownOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all duration-200"
                    >
                        {ymYear}
                        <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {yearDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 z-50 min-w-[90px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                            {getAvailableYears().map(y => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => {
                                        onYmYearChange(y);
                                        onYearDropdownToggle(false);
                                        const today = new Date();
                                        let m = ymMonth;
                                        if (y === today.getFullYear() && m > today.getMonth()) {
                                            m = today.getMonth();
                                            onYmMonthChange(m);
                                        }
                                        onApplyYearMonth(y, m);
                                    }}
                                    className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors duration-150 ${
                                        y === ymYear
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* 12 месяцев — pill-кнопки */}
                <div className="flex p-0.5 bg-gray-100 rounded-lg gap-0.5">
                    {MONTH_NAMES_SHORT.map((name, idx) => {
                        const today = new Date();
                        const isFuture = ymYear === today.getFullYear() && idx > today.getMonth();
                        const hasData = availableMonths.has(`${ymYear}-${idx + 1}`);
                        const isDisabled = isFuture || !hasData;
                        return (
                            <button
                                key={idx}
                                disabled={isDisabled}
                                onClick={() => {
                                    onYmMonthChange(idx);
                                    onApplyYearMonth(ymYear, idx);
                                }}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                    isDisabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : ymMonth === idx
                                            ? 'bg-white text-indigo-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Кастомный период — date-инпуты */}
        {activePreset === 'custom' && (
            <div className="flex items-center gap-2">
                <CustomDatePicker
                    value={dateFrom}
                    onChange={val => onDateFromChange(val)}
                    placeholder="Начало"
                    className="text-xs"
                />
                <span className="text-gray-400 text-xs">—</span>
                <CustomDatePicker
                    value={dateTo}
                    onChange={val => onDateToChange(val)}
                    placeholder="Конец"
                    className="text-xs"
                />
            </div>
        )}
    </div>
);
