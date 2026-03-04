/**
 * Секция «Типы кнопок фильтров»: описание всех видов кнопок в панели фильтров.
 */
import React from 'react';

export const ButtonTypesSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            🎯 Типы кнопок фильтров
        </h2>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            1. Кнопка "Все"
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Всегда видна. Показывает общее количество товаров в проекте. По умолчанию активна при открытии страницы.
        </p>
        <div className="not-prose mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-900">
                <strong>Когда использовать:</strong> Нужно увидеть весь каталог без ограничений.
            </p>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            2. Кнопка "Без подборки"
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Появляется <strong>только если есть</strong> товары, которые не добавлены ни в одну подборку. Показывает количество таких товаров.
        </p>
        <div className="not-prose mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p className="text-sm text-yellow-900">
                <strong>Зачем это нужно:</strong> Часто после импорта новых товаров они оказываются без подборок. Эта кнопка помогает быстро найти их и распределить.
            </p>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            3. Кнопки индивидуальных подборок
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Каждая подборка (альбом) отображается отдельной кнопкой с названием и количеством товаров. Кнопка состоит из <strong>трёх частей</strong>:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><strong>Основная кнопка</strong> — клик фильтрует товары по этой подборке</li>
            <li><strong>Разделитель</strong> — вертикальная линия (визуальное разделение)</li>
            <li><strong>Иконка со стрелкой</strong> — открывает подборку в VK в новой вкладке</li>
        </ul>

        <div className="not-prose mt-4 p-3 bg-purple-50 border-l-4 border-purple-500 rounded">
            <p className="text-sm text-purple-900">
                <strong>Совет:</strong> Внешняя ссылка удобна, когда нужно проверить как подборка выглядит для покупателей в VK, или добавить/удалить товары через интерфейс VK.
            </p>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            4. Кнопка "+ Создать подборку"
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Пунктирная кнопка голубого цвета. При нажатии превращается в форму для ввода названия новой подборки.
        </p>
        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Форма создания:</strong>
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li>Поле ввода с подсказкой "Название новой подборки..." (автофокус)</li>
            <li>Зелёная кнопка "Ок" — сохраняет подборку</li>
            <li>Кнопка с крестиком — отменяет создание</li>
            <li><strong>Клавиша Enter</strong> — то же, что "Ок"</li>
            <li><strong>Клавиша Escape</strong> — то же, что крестик</li>
        </ul>
    </section>
);
