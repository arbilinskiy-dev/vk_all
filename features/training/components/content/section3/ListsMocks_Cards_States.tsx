// =====================================================================
// MOCK КОМПОНЕНТЫ: КАРТОЧКА В РАЗНЫХ СОСТОЯНИЯХ
// =====================================================================

import React, { useState } from 'react';
import { UsersIcon } from './ListsMocks_Icons';

// --- Демо одного состояния карточки ---

interface CardStatesDemoProps {
    showState: 'normal' | 'hover' | 'active' | 'loading' | 'empty';
}

export const CardStatesDemo: React.FC<CardStatesDemoProps> = ({ showState }) => {
    const getCardClasses = () => {
        const base = "relative bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all duration-200 w-40 h-[160px] flex flex-col";
        
        switch (showState) {
            case 'hover':
                return `${base} border-gray-300 shadow-md`;
            case 'active':
                return `${base} border-transparent ring-2 ring-indigo-500 shadow-md`;
            case 'loading':
                return `${base} border-gray-200`;
            case 'empty':
                return `${base} border-gray-200`;
            default:
                return `${base} border-gray-200`;
        }
    };

    return (
        <div className={getCardClasses()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-lg flex items-center justify-center">
                    <UsersIcon />
                </div>
                
                {showState === 'loading' ? (
                    <div className="p-1.5">
                        <div className="h-4 w-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <button className={`p-1.5 rounded-full transition-colors ${
                        showState === 'hover' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'
                    }`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {showState === 'empty' ? '0' : '1,234'}
                </div>
                <div className="text-sm font-medium text-gray-700 leading-tight line-clamp-2 mb-2">
                    Подписчики
                </div>
                
                {/* Блок статуса загрузки */}
                <div className="h-5 mt-auto">
                    {showState === 'loading' && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                            <div className="h-3 w-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="truncate">Загрузка...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">
                        {showState === 'empty' ? 'Нет данных' : '23 дек, 14:30'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- Демо всех состояний в ряду ---

export const AllCardStates: React.FC = () => {
    return (
        <div className="flex flex-wrap gap-6">
            <div className="flex flex-col items-center gap-2">
                <CardStatesDemo showState="normal" />
                <span className="text-sm font-medium text-gray-700">Обычное</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <CardStatesDemo showState="hover" />
                <span className="text-sm font-medium text-gray-700">При наведении</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <CardStatesDemo showState="active" />
                <span className="text-sm font-medium text-gray-700">Активная</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <CardStatesDemo showState="loading" />
                <span className="text-sm font-medium text-gray-700">Обновляется</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <CardStatesDemo showState="empty" />
                <span className="text-sm font-medium text-gray-700">Пустая</span>
            </div>
        </div>
    );
};

// --- Интерактивная карточка с переключением состояний ---

export const InteractiveCardDemo: React.FC = () => {
    const [currentState, setCurrentState] = useState<'normal' | 'hover' | 'active' | 'loading' | 'empty'>('normal');

    return (
        <div className="flex gap-6">
            {/* Карточка */}
            <div>
                <CardStatesDemo showState={currentState} />
            </div>

            {/* Панель управления */}
            <div className="flex flex-col gap-2">
                <h4 className="text-sm font-bold text-gray-700 mb-2">Переключить состояние:</h4>
                <button
                    onClick={() => setCurrentState('normal')}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        currentState === 'normal'
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Обычное
                </button>
                <button
                    onClick={() => setCurrentState('hover')}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        currentState === 'hover'
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    При наведении
                </button>
                <button
                    onClick={() => setCurrentState('active')}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        currentState === 'active'
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Активная
                </button>
                <button
                    onClick={() => setCurrentState('loading')}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        currentState === 'loading'
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Обновляется
                </button>
                <button
                    onClick={() => setCurrentState('empty')}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        currentState === 'empty'
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    Пустая
                </button>
            </div>
        </div>
    );
};
