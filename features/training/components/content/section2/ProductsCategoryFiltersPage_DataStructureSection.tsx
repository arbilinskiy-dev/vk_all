/**
 * Секция «Структура данных MarketCategory» — формат данных, группировка, разделение имени.
 */
import React from 'react';

export const DataStructureSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            🔧 Структура данных MarketCategory
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Каждая категория в системе имеет следующую структуру:
        </p>

        <div className="not-prose mt-4 p-4 bg-gray-50 rounded-lg font-mono text-sm">
            <pre className="text-gray-800">
{`{
  id: 123,                             // Уникальный ID категории
  name: "Одежда / Футболки / Мужские", // Полный путь с разделителями
  section_id: 1,                       // ID раздела (секции)
  section_name: "Одежда"               // Название раздела
}`}
            </pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Группировка категорий
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Категории группируются по полю <code>section_name</code>. Это создаёт структуру с
            липкими заголовками в dropdown:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li>
                <strong>ОДЕЖДА</strong> — Футболки / Мужские, Футболки / Женские, Джинсы...
            </li>
            <li>
                <strong>ОБУВЬ</strong> — Кроссовки / Мужские, Ботинки...
            </li>
            <li>
                <strong>АКСЕССУАРЫ</strong> — Рюкзаки, Шапки...
            </li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Разделение названия на части
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Система автоматически разбивает <code>name</code> на две части для отображения:
        </p>
        <div className="not-prose mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-900 mb-2">
                <strong>Входные данные:</strong>
            </p>
            <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                "Одежда / Футболки / Мужские"
            </code>
            <p className="text-sm text-blue-900 mt-3 mb-2">
                <strong>Отображение:</strong>
            </p>
            <div className="bg-white p-2 rounded border border-blue-300">
                <p className="text-sm font-medium text-gray-800">Мужские</p>
                <p className="text-[10px] text-gray-400">Одежда / Футболки</p>
            </div>
        </div>
    </section>
);
