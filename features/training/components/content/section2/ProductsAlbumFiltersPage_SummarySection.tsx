/**
 * Секция «Итоги»: резюме пройденного материала.
 */
import React from 'react';

export const SummarySection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            ✅ Итоги
        </h2>
        <div className="not-prose mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
            <h4 className="font-bold text-green-900 mb-4 text-lg">Что вы узнали:</h4>
            <ul className="text-sm text-green-800 space-y-2">
                <li>✅ Фильтры по подборкам — быстрый способ найти товары нужной категории</li>
                <li>✅ Кнопка "Без подборки" помогает найти неразобранные товары после импорта</li>
                <li>✅ Каждая кнопка подборки имеет внешнюю ссылку для проверки в VK</li>
                <li>✅ Можно создать новую подборку прямо из фильтров (кнопка "+", Enter для сохранения)</li>
                <li>✅ Фильтрация работает после поиска — можно комбинировать</li>
                <li>✅ Во время загрузки показывается скелетон из 4 блоков</li>
            </ul>
        </div>
    </section>
);
