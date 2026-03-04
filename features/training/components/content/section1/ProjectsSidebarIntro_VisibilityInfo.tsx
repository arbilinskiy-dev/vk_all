import React from 'react';

// =====================================================================
// Секция: когда появляется / не появляется сайдбар проектов
// =====================================================================

/** Информационные блоки о видимости сайдбара проектов */
export const VisibilityInfoSection: React.FC = () => (
    <>
        {/* Когда появляется */}
        <div className="not-prose bg-indigo-50 border-l-4 border-indigo-500 p-4 my-6">
            <p className="text-sm text-indigo-900 mb-3">
                <strong>Когда появляется:</strong> При выборе модулей из <strong>верхней группы</strong> главной панели:
            </p>
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Контент-менеджмент
                </span>
                <span className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Списки
                </span>
                <span className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Работа с сообщениями <span className="text-xs">(в разработке)</span>
                </span>
                <span className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Статистика <span className="text-xs">(в разработке)</span>
                </span>
            </div>
        </div>

        {/* НЕ появляется */}
        <div className="not-prose bg-green-50 border-l-4 border-green-500 p-4 my-6">
            <p className="text-sm text-green-900 mb-3">
                <strong>НЕ появляется:</strong> При выборе из <strong>нижней группы</strong> (глобальные действия):
            </p>
            <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0m16 0s0 0 0 0M12 11a4 4 0 100-8 4 4 0 000 8zm0 0v10m0-10L8 7m4 4l4-4" />
                    </svg>
                    База проектов
                </span>
                <span className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                    </svg>
                    Центр обучения
                </span>
                <span className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Настройки
                </span>
                <span className="px-3 py-1.5 bg-white border border-green-200 rounded-lg text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Выйти
                </span>
            </div>
            <p className="text-xs text-green-800 mt-3">
                Эти действия открывают отдельные страницы или выполняют действие, а не работают с проектами.
            </p>
        </div>

        {/* Функция сайдбара */}
        <div className="not-prose bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
            <p className="text-sm text-amber-900">
                <strong>Функция:</strong> Быстрое переключение между проектами (сообществами VK) 
                и визуальная индикация их состояния через цветовые счётчики.
            </p>
        </div>
    </>
);
