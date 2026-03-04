import React from 'react';

// =====================================================================
// Секция 3: Кнопка «Отмена» — внешний вид и технические детали
// =====================================================================

export const CancelButtonSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Кнопка «Отмена»
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Кнопка «Отмена» — это вторичная кнопка, которая закрывает всплывающее окно без сохранения изменений. Она всегда серая, чтобы визуально отличаться от главной зелёной кнопки.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Внешний вид
        </h3>
        <div className="not-prose my-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600">Обычное состояние:</span>
                <button 
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300"
                >
                    Отмена
                </button>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Технические детали
        </h3>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`<button 
    onClick={onClose} 
    disabled={isSaving}
    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
>
    Отмена
</button>`}
            </pre>
        </div>

        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>bg-gray-200</code> — серый фон в обычном состоянии</li>
            <li><code>hover:bg-gray-300</code> — становится темнее при наведении курсора</li>
            <li><code>disabled:opacity-50</code> — становится полупрозрачной, если идёт сохранение</li>
            <li><code>px-4 py-2</code> — отступы 16px по горизонтали, 8px по вертикали</li>
            <li><code>text-sm font-medium</code> — размер текста 14px, средняя жирность</li>
        </ul>

        <p className="!text-base !leading-relaxed !text-gray-700 !mt-4">
            <strong>Когда кнопка заблокирована:</strong> Пока идёт сохранение (например, создаётся новый альбом или товар), кнопка «Отмена» становится полупрозрачной (<code>opacity: 0.5</code>) и не реагирует на клики. Это предотвращает случайное закрытие окна во время отправки данных на сервер.
        </p>
    </section>
);
