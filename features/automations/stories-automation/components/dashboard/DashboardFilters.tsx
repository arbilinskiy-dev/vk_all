import React from 'react';
import { PeriodType, FilterType } from './types';
import { CustomDatePicker } from '../../../../../shared/components/pickers/CustomDatePicker';

interface DashboardFiltersProps {
    periodType: PeriodType;
    setPeriodType: (type: PeriodType) => void;
    filterType: FilterType;
    setFilterType: (type: FilterType) => void;
    customStartDate: string;
    setCustomStartDate: (date: string) => void;
    customEndDate: string;
    setCustomEndDate: (date: string) => void;
}

/** Компонент фильтров дашборда: период + тип историй */
export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
    periodType, setPeriodType,
    filterType, setFilterType,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
}) => {
    return (
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div>
                 <h2 className="text-xl font-bold text-gray-900 tracking-tight">Обзор эффективности</h2>
                 <p className="text-sm text-gray-500">Сводные показатели за выбранный период</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                
                {/* Period Filter */}
                <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Период:</span>
                    <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                        {[
                            { value: 'all', label: 'За всё время' },
                            { value: 'week', label: 'За неделю' },
                            { value: 'month', label: 'За месяц' },
                            { value: 'quarter', label: 'За квартал' },
                            { value: 'year', label: 'За год' },
                            { value: 'custom', label: 'Свой период' },
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriodType(opt.value as PeriodType)}
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

                    {/* Custom Date Inputs */}
                    {periodType === 'custom' && (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm animate-in fade-in zoom-in duration-200">
                            <CustomDatePicker 
                                value={customStartDate} 
                                onChange={setCustomStartDate} 
                                placeholder="Начало" 
                                className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                            />
                            <span className="text-gray-300 text-xs px-1">—</span>
                            <CustomDatePicker 
                                value={customEndDate} 
                                onChange={setCustomEndDate} 
                                placeholder="Конец" 
                                className="!w-24 !text-xs !py-1.5 !border-gray-100 !bg-gray-50 focus:!bg-white !rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Type Filter */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex-shrink-0">
                    {['all', 'manual', 'auto'].map((type) => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type as FilterType)}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${
                                filterType === type 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            {{'all': 'Всё', 'manual': 'Ручные', 'auto': 'Авто'}[type]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
