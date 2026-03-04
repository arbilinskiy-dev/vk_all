import React from 'react';

// =====================================================================
// Секция «Подробнее о модулях» — карточки КМ, АМ, Списки
// =====================================================================

/** Детальные карточки модулей: Контент-менеджмент, Работа с сообщениями, Списки */
export const ModulesSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Подробнее о модулях</h2>

        <div className="not-prose space-y-4 my-6">
            {/* Контент-менеджмент */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-indigo-900 text-lg mb-1">Контент-менеджмент (КМ)</h3>
                        <p className="text-sm text-gray-600 mb-3">Главный рабочий модуль для SMM-специалистов</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Отложенные
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Предложенные
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Товары
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Автоматизации
                                <span className="text-gray-400 text-[10px]">+6</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Работа с сообщениями */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-amber-900 text-lg">Работа с сообщениями (АМ)</h3>
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold uppercase rounded">В разработке</span>
                        </div>
                        <p className="text-sm text-gray-600">
                            Модуль для работы с сообщениями сообщества. Функционал автоматизаций пока доступен через подменю в Контент-менеджменте.
                        </p>
                    </div>
                </div>
            </div>

            {/* Списки */}
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-purple-900 text-lg mb-1">Списки</h3>
                        <p className="text-sm text-gray-600 mb-3">Управление списками для автоматизаций и конкурсов</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-full text-xs font-medium text-purple-700">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Системные
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-full text-xs font-medium text-purple-700 opacity-60">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                Пользовательские
                                <span className="text-[10px]">🔧</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-200 rounded-full text-xs font-medium text-purple-700">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                Автоматизации
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
);
