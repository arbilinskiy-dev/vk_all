// =====================================================================
// MOCK КОМПОНЕНТ: АНАТОМИЯ КАРТОЧКИ СПИСКА
// =====================================================================

import React from 'react';
import { UsersIcon } from './ListsMocks_Icons';

export const ListCardAnatomy: React.FC = () => {
    return (
        <div className="relative bg-white p-4 rounded-xl border-2 border-indigo-500 shadow-md w-40 h-[160px] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                {/* Иконка */}
                <div className="relative">
                    <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center">
                        <UsersIcon />
                    </div>
                    <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[8px] font-bold px-1 rounded">
                        Header
                    </div>
                </div>
                
                {/* Кнопка обновления */}
                <div className="relative">
                    <button className="p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                        </svg>
                    </button>
                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-bold px-1 rounded whitespace-nowrap">
                        Кнопка
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col relative">
                <div className="absolute -left-6 top-8 bg-green-600 text-white text-[8px] font-bold px-1 rounded">
                    Body
                </div>
                
                {/* Счётчик */}
                <div className="text-2xl font-bold text-gray-900 mb-1">1,234</div>
                
                {/* Название */}
                <div className="text-sm font-medium text-gray-700 leading-tight line-clamp-2 mb-2">
                    Подписчики
                </div>
                
                {/* Блок статуса */}
                <div className="h-5 mt-auto"></div>
            </div>

            {/* Footer */}
            <div className="relative pt-3 border-t border-gray-100">
                <div className="absolute -bottom-2 -left-2 bg-purple-600 text-white text-[8px] font-bold px-1 rounded">
                    Footer
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">23 дек, 14:30</span>
                </div>
            </div>
        </div>
    );
};
