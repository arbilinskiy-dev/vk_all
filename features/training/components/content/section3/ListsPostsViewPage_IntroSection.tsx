/**
 * Вводный блок страницы «Просмотр постов»
 * Описывает суть таблицы постов — что было раньше и что стало сейчас.
 */
import React from 'react';

export const IntroSection: React.FC = () => (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-purple-900 mt-0 mb-3">Что это за таблица?</h2>
        <p className="text-purple-800 mb-3">
            Таблица постов показывает <strong>историю всех опубликованных записей</strong> в выбранном списке ВКонтакте. 
            Это архив для анализа: какие посты получили больше лайков, какие репостили, сколько просмотров собрал каждый.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-lg">✕</span>
                    </div>
                    <span className="font-bold text-gray-700">Раньше</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    SMM-щик сидел в ВК, листал ленту группы, вручную считал лайки и комментарии в Excel.
                </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-lg">✓</span>
                    </div>
                    <span className="font-bold text-gray-700">Сейчас</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">
                    Все посты автоматически собираются, статистика обновляется, можно сортировать и искать.
                </p>
            </div>
        </div>
    </div>
);
