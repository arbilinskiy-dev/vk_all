// =====================================================================
// MOCK КОМПОНЕНТ: КАРТОЧКА С DROPDOWN МЕНЮ
// =====================================================================

import React, { useState } from 'react';
import { DocumentIcon } from './ListsMocks_Icons';

export const CardWithDropdown: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleOptionClick = (option: string) => {
        setSelectedOption(option);
        setMenuOpen(false);
        setTimeout(() => setSelectedOption(null), 2000);
    };

    return (
        <div className="relative">
            <div className="relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-40 h-[160px] flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-indigo-800 text-white rounded-lg flex items-center justify-center">
                        <DocumentIcon />
                    </div>
                    
                    <button 
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-1.5 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col">
                    <div className="mb-1">
                        <div className="text-2xl font-bold text-gray-900">856</div>
                        <p className="text-[10px] text-gray-500">из 3,240 в VK</p>
                    </div>
                    <div className="text-sm font-medium text-gray-700 leading-tight line-clamp-2 mb-2">
                        Посты (История)
                    </div>
                    
                    {selectedOption && (
                        <div className="h-5 flex items-center gap-2 text-xs text-green-600 font-medium animate-pulse">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate">{selectedOption}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">24 дек, 09:15</span>
                    </div>
                </div>
            </div>

            {/* Dropdown меню */}
            {menuOpen && (
                <div className="absolute top-12 right-0 bg-white rounded-md shadow-xl border border-gray-200 py-1 z-50 w-48 animate-fade-in">
                    <button
                        onClick={() => handleOptionClick('Обновлено 1000')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                        Обновить 1000 (быстро)
                    </button>
                    <button
                        onClick={() => handleOptionClick('Обновлено всё')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                        Обновить всё (долго)
                    </button>
                </div>
            )}
        </div>
    );
};
