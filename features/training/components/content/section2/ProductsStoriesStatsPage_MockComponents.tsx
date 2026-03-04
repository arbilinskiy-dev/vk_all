import React from 'react';

// =====================================================================
// Mock-компоненты для демонстрации статистики историй
// =====================================================================

/** Мини-график (упрощённая версия Sparkline) */
export const MockSparkline: React.FC<{ color: string }> = ({ color }) => {
    return (
        <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0,80 L20,60 L40,70 L60,40 L80,50 L100,20" fill="none" stroke="currentColor" strokeWidth="3" className={color} />
            </svg>
        </div>
    );
};

/** Карточка метрики для дашборда */
export const MockMetricCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    valueColor: string;
    showGraph?: boolean;
    graphColor?: string;
}> = ({ title, value, icon, bgColor, iconColor, valueColor, showGraph, graphColor }) => {
    return (
        <div className={`${bgColor} rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-semibold">{title}</p>
                    <h3 className={`text-3xl font-bold ${valueColor} mt-2`}>{value}</h3>
                </div>
                <div className={`p-2 ${iconColor} rounded-xl`}>
                    {icon}
                </div>
            </div>
            {showGraph && graphColor && (
                <div className="mt-6 h-12 w-full -mb-2">
                    <MockSparkline color={graphColor} />
                </div>
            )}
        </div>
    );
};

/** Строка таблицы с историей */
export const MockStoryRow: React.FC<{
    hasPreview: boolean;
    date: string;
    type: string;
    isActive: boolean;
    isAutomated: boolean;
    hasStats: boolean;
}> = ({ hasPreview, date, type, isActive, isAutomated, hasStats }) => {
    return (
        <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-6 py-4 align-top">
                {hasPreview ? (
                    <div className="w-12 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg border border-gray-200 shadow-sm hover:ring-2 ring-indigo-500 transition-all cursor-pointer"></div>
                ) : (
                    <div className="w-12 h-20 bg-gray-100 rounded-lg border flex items-center justify-center text-[9px] text-gray-400 text-center p-1">
                        Нет фото
                    </div>
                )}
            </td>
            
            <td className="px-6 py-4 align-top">
                <div className="flex flex-col gap-2">
                    <div>
                        <div className="text-sm font-medium text-gray-900">{date}</div>
                        <div className="text-xs text-gray-500 capitalize">{type}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">
                                Активна
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                Архив
                            </span>
                        )}
                        {isAutomated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                Наш сервис
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                Вручную
                            </span>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 align-top">
                {hasStats ? (
                    <div className="grid grid-cols-4 gap-2 w-full">
                        <div className="flex flex-col items-center bg-indigo-50 p-1.5 rounded border border-indigo-100 min-w-[50px]">
                            <span className="text-[10px] text-indigo-600 uppercase font-bold">Просм.</span>
                            <span className="text-sm font-bold text-indigo-800">1,234</span>
                        </div>
                        <div className="flex flex-col items-center bg-pink-50 p-1.5 rounded border border-pink-100 min-w-[50px]">
                            <span className="text-[10px] text-pink-600 uppercase font-bold">Лайки</span>
                            <span className="text-sm font-bold text-pink-800">45</span>
                        </div>
                        <div className="flex flex-col items-center bg-green-50 p-1.5 rounded border border-green-100 min-w-[50px]">
                            <span className="text-[10px] text-green-600 uppercase font-bold">Клики</span>
                            <span className="text-sm font-bold text-green-800">12</span>
                        </div>
                        <div className="flex flex-col items-center bg-purple-50 p-1.5 rounded border border-purple-100 min-w-[50px]">
                            <span className="text-[10px] text-purple-600 uppercase font-bold">Репосты</span>
                            <span className="text-sm font-bold text-purple-800">8</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-start gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">856</span>
                            <span className="text-xs text-gray-500 uppercase font-medium">Просмотров</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-xs text-gray-500 max-w-[200px]">
                            Детальная статистика отсутствует. Нажмите "Обновить" для загрузки.
                        </div>
                    </div>
                )}
            </td>

            <td className="px-6 py-4 align-top text-right space-y-2">
                <button className="w-full px-3 py-1.5 rounded text-xs font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors">
                    Обновить
                </button>
            </td>
        </tr>
    );
};
