import React from 'react';
import { ActiveTab } from './_data';

// =====================================================================
// Sandbox: Колонка 1 — Главная панель с иконками модулей и выдвижным меню
// =====================================================================

interface SandboxMainPanelProps {
    /** Текущая активная вкладка */
    activeTab: ActiveTab;
    /** Переключение вкладки */
    setActiveTab: (tab: ActiveTab) => void;
    /** Открыто ли меню автоматизаций */
    automationsOpen: boolean;
    /** Переключение меню автоматизаций */
    setAutomationsOpen: (open: boolean) => void;
}

export const SandboxMainPanel: React.FC<SandboxMainPanelProps> = ({
    activeTab,
    setActiveTab,
    automationsOpen,
    setAutomationsOpen,
}) => (
    <div className="flex bg-white border-r border-gray-200 rounded">
        {/* Иконки модулей */}
        <div className="w-16 border-r border-gray-200 flex flex-col items-center justify-between py-4">
            <div className="space-y-4">
                {/* Контент-менеджмент (активная) */}
                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                {/* Списки */}
                <div className="w-12 h-12 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                {/* Сообщения */}
                <div className="w-12 h-12 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
            </div>
            {/* Настройки внизу */}
            <div className="w-12 h-12 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>
        </div>

        {/* Выдвижное меню с вкладками */}
        <div className="w-40 flex flex-col py-4 px-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Контент</div>
        <div className="space-y-2">
            <button 
                onClick={() => setActiveTab('schedule')}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                Отложенные
            </button>
            <button 
                onClick={() => setActiveTab('suggested')}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${activeTab === 'suggested' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                Предложенные
            </button>
            <button 
                onClick={() => setActiveTab('products')}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${activeTab === 'products' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}`}
            >
                Товары
            </button>
            <button 
                onClick={() => setAutomationsOpen(!automationsOpen)}
                className="w-full text-left p-2 rounded-md text-sm transition-colors text-gray-500 hover:bg-gray-100 flex items-center justify-between"
            >
                <span>Автоматизации</span>
                <svg className={`w-4 h-4 transition-transform ${automationsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {automationsOpen && (
                <div className="pl-4 space-y-1 mt-1">
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">Посты в истории</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">Конкурс отзывов</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">Дроп промокодов</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">Конкурсы</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">AI посты</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">С др</div>
                    <div className="text-xs text-gray-600 p-1.5 hover:bg-gray-50 rounded cursor-pointer">Конкурс Актив</div>
                </div>
            )}
        </div>
        </div>
    </div>
);
