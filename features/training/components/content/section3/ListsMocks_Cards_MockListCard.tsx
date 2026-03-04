// =====================================================================
// MOCK КОМПОНЕНТ: КАРТОЧКА СПИСКА
// =====================================================================

import React, { useState } from 'react';
import type { ListType, ListCardData } from './ListsMocks_Cards_Types';
import { getListCardData } from './ListsMocks_Cards_Data';

// --- Пропсы: передаём либо data, либо type ---

interface MockListCardPropsWithData {
    data: ListCardData;
    type?: never;
    isActive?: boolean;
    isRefreshing?: boolean;
    refreshStatus?: string | null;
    onClick?: () => void;
}

interface MockListCardPropsWithType {
    type: ListType;
    data?: never;
    isActive?: boolean;
    isRefreshing?: boolean;
    refreshStatus?: string | null;
    onClick?: () => void;
}

type MockListCardProps = MockListCardPropsWithData | MockListCardPropsWithType;

export const MockListCard: React.FC<MockListCardProps> = (props) => {
    const { isActive = false, isRefreshing = false, refreshStatus = null, onClick } = props;
    
    // Определяем данные: либо из props.data, либо по props.type
    const data = 'data' in props && props.data 
        ? props.data 
        : getListCardData().find(item => item.type === props.type)!;
    
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`
                relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all h-[200px] flex flex-col
                ${isActive ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-lg' : 'border-gray-200'}
                ${isHovered && !isActive ? 'shadow-md' : 'shadow-sm'}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Верхняя часть: иконка + счётчик */}
            <div className="flex items-start justify-between mb-2">
                {/* Цветная иконка */}
                <div className={`${data.bgColor} rounded-lg p-3 flex-shrink-0`}>
                    {data.icon}
                </div>

                {/* Счётчик */}
                <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800 leading-none">
                        {data.count.toLocaleString()}
                    </div>
                    {data.vkCount && (
                        <div className="text-[10px] text-gray-400 mt-1">
                            из {data.vkCount.toLocaleString()} в VK
                        </div>
                    )}
                </div>
            </div>

            {/* Название списка */}
            <div className="flex-1 flex items-start">
                <div className="text-sm font-medium text-gray-700 line-clamp-3 leading-snug" title={data.title}>
                    {data.title}
                </div>
            </div>

            {/* Нижняя часть: дата обновления + кнопка */}
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-100">
                {/* Дата обновления */}
                {data.lastUpdated && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">{data.lastUpdated}</span>
                    </div>
                )}

                {/* Кнопка обновления */}
                <button 
                    className={`p-1.5 rounded transition-colors ${
                        isRefreshing 
                            ? 'text-indigo-600 cursor-wait' 
                            : 'text-gray-400 hover:text-indigo-600'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        // Имитация обновления
                    }}
                >
                    {isRefreshing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Статус обновления (если есть) */}
            {refreshStatus && (
                <div className="mt-2 text-[10px] text-indigo-600 animate-pulse">
                    {refreshStatus}
                </div>
            )}
        </div>
    );
};
