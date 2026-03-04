import React from 'react';
import { NavigationLink } from '../shared';

// =====================================================================
// Секция: Совет эксперта + Итоги + Навигация к следующим разделам
// =====================================================================
export const CalendarGridSummary: React.FC = () => (
    <>
        {/* Совет эксперта */}
        <div className="not-prose bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg my-8">
            <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div>
                    <h3 className="font-bold text-indigo-900 text-lg mb-2">Совет эксперта</h3>
                    <p className="text-sm text-gray-700 mb-3">
                        Привыкни использовать сетку как <strong>визуальный планировщик</strong>. 
                        Держи календарь открытым на второй монитор или во вкладке — 
                        так ты всегда будешь видеть "загруженность" недели и пустые дни.
                    </p>
                    <p className="text-sm text-gray-700">
                        Используй <strong>цвета заметок</strong> для разделения типов задач: 
                        красные — срочные, жёлтые — важные, зелёные — выполнено. 
                        Так сетка становится не просто календарём, а полноценным рабочим инструментом.
                    </p>
                </div>
            </div>
        </div>

        <hr className="!my-10" />

        {/* Итоги */}
        <div className="not-prose bg-gray-100 border border-gray-300 rounded-lg p-6 my-8">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Итоги: что нужно запомнить</h3>
            <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Сетка показывает 7 дней (неделю) одновременно</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Каждый день — отдельная колонка с заголовком, историями, постами и заметками</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Контент внутри дня отсортирован по времени</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Призрачные посты показывают будущие повторения автоматизаций</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Обычные посты и заметки можно перетаскивать между днями</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Системные посты и призраки перетаскивать нельзя</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Двойной клик по пустому месту = быстрое создание заметки</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Кнопка "+" в заголовке дня = создание поста</span>
                </li>
            </ul>
        </div>

        <hr className="!my-10" />

        {/* Навигация к следующим разделам */}
        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <NavigationLink
                to="2-1-3-1-day-columns"
                title="2.1.3.1 Дневные колонки"
                description="Подробнее о структуре и работе отдельной колонки"
                variant="next"
            />
            <NavigationLink
                to="2-1-3-2-grid-interaction"
                title="2.1.3.2 Взаимодействие с сеткой"
                description="Как работать с контентом в сетке календаря"
                variant="related"
            />
        </div>
    </>
);
