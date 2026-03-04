import React from 'react';

// =====================================================================
// Секция: элементы карточки проекта (название, счётчик, кнопки)
// =====================================================================

/** Сетка из 3 карточек — анатомия карточки проекта */
export const CardElementsSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Элементы карточки проекта</h2>

        <div className="not-prose grid md:grid-cols-3 gap-4 my-6">
            {/* Название */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5">
                <div className="flex items-center justify-center mb-3">
                    <div className="px-4 py-2 bg-white border-2 border-blue-300 rounded-lg">
                        <p className="font-semibold text-gray-800 text-sm">Название проекта</p>
                    </div>
                </div>
                <h3 className="font-bold text-blue-900 text-center mb-2">Название</h3>
                <p className="text-sm text-gray-700 text-center">
                    Текст обрезается троеточием, если слишком длинный
                </p>
            </div>

            {/* Счётчик */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-5">
                <div className="flex items-center justify-center mb-3 gap-2">
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-red-200 text-red-900 font-medium rounded-full text-xs">0</span>
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 font-medium rounded-full text-xs">3</span>
                    <span className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full text-xs">7</span>
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-green-200 text-green-900 font-medium rounded-full text-xs">12</span>
                </div>
                <h3 className="font-bold text-purple-900 text-center mb-2">Счётчик</h3>
                <p className="text-sm text-gray-700 text-center">
                    Число постов с цветом: 0=красный, 1-4=оранжевый, 5-10=серый, 11+=зелёный
                </p>
            </div>

            {/* Выдвижные кнопки */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-5">
                <div className="flex items-center justify-center mb-3 gap-2">
                    <button className="p-2 bg-white rounded-full border-2 border-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>
                    </button>
                    <button className="p-2 bg-white rounded-full border-2 border-green-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
                <h3 className="font-bold text-green-900 text-center mb-2">Выдвижные кнопки</h3>
                <p className="text-sm text-gray-700 text-center">
                    При наведении слева появляются кнопки: <strong>Обновить</strong> и <strong>Настройки</strong>.
                    Подробнее о них — в <em>Разделе 2.1.1 "Сайдбар проектов"</em>.
                </p>
            </div>
        </div>
    </>
);
