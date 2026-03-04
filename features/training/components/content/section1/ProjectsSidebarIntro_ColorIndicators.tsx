import React from 'react';

// =====================================================================
// Секция: цветовые индикаторы счётчиков постов
// =====================================================================

/** 4 карточки — система цветовых уровней для оценки состояния проекта */
export const ColorIndicatorsSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Цветовые индикаторы счётчиков</h2>

        <p className="!text-base !leading-relaxed !text-gray-700 mb-4">
            Система из <strong>4 уровней</strong> для быстрой оценки состояния проекта:
        </p>

        <div className="not-prose grid md:grid-cols-4 gap-3 my-6">
            {/* Красный */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-red-900">Красный</h3>
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-red-200 text-red-900 font-medium rounded-full text-xs">
                        0
                    </span>
                </div>
                <p className="text-sm text-gray-700">
                    <strong>Критично!</strong> Нет отложенных постов.
                </p>
            </div>

            {/* Оранжевый */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-orange-900">Оранжевый</h3>
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-orange-200 text-orange-900 font-medium rounded-full text-xs">
                        1-4
                    </span>
                </div>
                <p className="text-sm text-gray-700">
                    <strong>Внимание!</strong> Мало постов, скоро закончатся.
                </p>
            </div>

            {/* Серый */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">Серый</h3>
                    <span className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full text-xs">
                        5-10
                    </span>
                </div>
                <p className="text-sm text-gray-700">
                    <strong>Нормально.</strong> Запас постов на несколько дней.
                </p>
            </div>

            {/* Зелёный */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-green-900">Зелёный</h3>
                    <span className="px-2 py-0.5 bg-gradient-to-t from-gray-300 to-green-200 text-green-900 font-medium rounded-full text-xs">
                        11+
                    </span>
                </div>
                <p className="text-sm text-gray-700">
                    <strong>Отлично!</strong> Большой запас контента.
                </p>
            </div>
        </div>
    </>
);
