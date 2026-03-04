import React from 'react';

// =====================================================================
// Секция 2: Структура футера — HTML-элемент <footer> и CSS-классы
// =====================================================================

export const StructureSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Как устроен футер
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Футер — это HTML-элемент <code>&lt;footer&gt;</code> с фиксированным набором стилей. Вот как он выглядит в коде:
        </p>

        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`<footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 flex-shrink-0">
    <button className="...">Отмена</button>
    <button className="...">Сохранить</button>
</footer>`}
            </pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Разбор классов
        </h3>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>p-4</code> — внутренние отступы 16px со всех сторон</li>
            <li><code>border-t</code> — тонкая верхняя граница, отделяющая футер от содержимого</li>
            <li><code>flex justify-end gap-3</code> — кнопки выровнены справа, между ними отступ 12px</li>
            <li><code>bg-gray-50</code> — светло-серый фон (отличается от белого фона основного содержимого)</li>
            <li><code>flex-shrink-0</code> — футер никогда не сжимается, даже если содержимое окна слишком большое</li>
        </ul>

        <p className="!text-base !leading-relaxed !text-gray-700 !mt-4">
            <strong>Важный момент:</strong> класс <code>flex-shrink-0</code> гарантирует, что футер всегда останется на экране с полной высотой, даже если форма внутри окна очень длинная. Это означает, что кнопки «Отмена» и «Сохранить» никогда не "схлопнутся" и не исчезнут.
        </p>
    </section>
);
