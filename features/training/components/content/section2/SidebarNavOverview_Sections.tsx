import React from 'react';

// =====================================================================
// Блок «Подробные разделы» — навигационная сетка к подразделам
// =====================================================================
export const SidebarNavOverview_Sections: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Подробные разделы</h2>

        <p className="!text-base !leading-relaxed !text-gray-700 mb-6">
            Основные 4 части сайдбара (проекты, индикаторы, счётчики, фильтры) описаны подробно в своих разделах. 
            Остальные 3 части (глобальное обновление, отключённые проекты, блок пользователя) работают автоматически:
        </p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-indigo-900 mb-2">Элементы списка проектов</h3>
                <p className="text-sm text-gray-700">Из чего состоит один элемент: название, счётчик, кнопки.</p>
                <p className="text-xs text-gray-500 mt-2 italic">→ Раздел 2.1.2</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-indigo-900 mb-2">Индикаторы состояния</h3>
                <p className="text-sm text-gray-700">Что означают значки и когда они появляются.</p>
                <p className="text-xs text-gray-500 mt-2 italic">→ Раздел 2.1.3</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-indigo-900 mb-2">Счётчики постов</h3>
                <p className="text-sm text-gray-700">Цвета и значения счётчиков, их смысл.</p>
                <p className="text-xs text-gray-500 mt-2 italic">→ Раздел 2.1.4</p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-indigo-900 mb-2">Фильтры и поиск</h3>
                <p className="text-sm text-gray-700">Как быстро найти нужный проект среди всех сообществ.</p>
                <p className="text-xs text-gray-500 mt-2 italic">→ Раздел 2.1.5</p>
            </div>
        </div>
    </>
);
