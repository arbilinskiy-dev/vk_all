import React from 'react';

// =====================================================================
// Блок итогов + совет эксперта
// =====================================================================
export const SidebarNavOverview_Summary: React.FC = () => (
    <>
        {/* Итоги */}
        <div className="not-prose bg-gray-100 border border-gray-300 rounded-lg p-6 my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Итоги: что нужно запомнить</h3>
            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Сайдбар состоит из 7 основных блоков: список проектов, индикаторы, счётчики, фильтры, глобальное обновление, отключённые проекты, блок пользователя.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Индикаторы (треугольник, точка) сигнализируют о проблемах или новых данных.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Счётчики показывают количество черновиков, цвет — уровень срочности.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Фильтры по командам и поиск помогают быстро находить нужный проект.</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Блок пользователя внизу всегда виден и показывает текущую сессию.</span>
                </li>
            </ul>
        </div>

        {/* Совет эксперта */}
        <div className="not-prose bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg my-8">
            <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                    <h3 className="font-bold text-indigo-900 text-lg mb-2">Совет эксперта</h3>
                    <p className="text-sm text-gray-700">
                        Начни с раздела «Элементы списка проектов» — это основа для понимания всего остального. 
                        Потом переходи к индикаторам и счётчикам, чтобы научиться читать состояние проектов одним взглядом.
                    </p>
                </div>
            </div>
        </div>
    </>
);
