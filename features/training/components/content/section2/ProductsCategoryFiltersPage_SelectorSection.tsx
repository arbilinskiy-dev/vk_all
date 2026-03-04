/**
 * Секция «Выпадающий список категорий» — описание селектора, структура, поиск.
 */
import React from 'react';

export const SelectorSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            📋 Выпадающий список категорий
        </h2>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Где используется
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Селектор категории встречается в нескольких местах:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li>
                <strong>В таблице товаров</strong> — колонка "Категория" (каждая строка имеет
                свой селектор)
            </li>
            <li>
                <strong>При создании товара</strong> — в модальном окне создания одного или
                нескольких товаров
            </li>
            <li>
                <strong>При массовом редактировании</strong> — изменение категории для
                нескольких товаров сразу
            </li>
            <li>
                <strong>При обновлении из файла</strong> — маппинг категорий из импортируемого
                файла
            </li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Структура селектора
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Селектор состоит из двух частей:
        </p>

        <div className="not-prose mt-4 space-y-3">
            <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-blue-900 font-medium mb-1">1. Кнопка с выбранной категорией</p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>• <strong>Первая строка:</strong> конечная категория (жирным шрифтом)</li>
                    <li>• <strong>Вторая строка:</strong> полный путь (серым цветом, мелким шрифтом)</li>
                    <li>• <strong>Иконка стрелки:</strong> справа, показывает что можно раскрыть</li>
                </ul>
            </div>

            <div className="p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
                <p className="text-sm text-purple-900 font-medium mb-1">
                    2. Выпадающее окно (dropdown)
                </p>
                <ul className="text-sm text-purple-800 space-y-1 ml-4">
                    <li>• <strong>Поле поиска:</strong> вверху, автофокус, серый фон</li>
                    <li>• <strong>Группы категорий:</strong> липкие заголовки (uppercase, серый фон)</li>
                    <li>• <strong>Категории:</strong> двухстрочные кнопки с hover-эффектом (подсветка голубым)</li>
                    <li>• <strong>Скроллбар:</strong> тонкий, стилизованный (max высота 288px)</li>
                </ul>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Поиск по категориям
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Поиск работает в реальном времени и ищет совпадения:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li>В названии категории</li>
            <li>В названии раздела (секции)</li>
            <li>Регистр не важен (поиск case-insensitive)</li>
        </ul>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Пример:</strong> Введите "футбол" — увидите "Одежда / Футболки / Мужские" и
            "Одежда / Футболки / Женские".
        </p>
    </section>
);
