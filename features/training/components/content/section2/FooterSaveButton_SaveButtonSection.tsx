import React from 'react';

// =====================================================================
// Секция 4: Кнопка «Сохранить» / «Создать» — главная кнопка действия
// =====================================================================

export const SaveButtonSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Кнопка «Сохранить» / «Создать»
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Это главная кнопка действия — зелёная, яркая, привлекает внимание. В зависимости от контекста на ней может быть написано <strong>«Сохранить»</strong> (при редактировании), <strong>«Создать»</strong> (при создании нового элемента) или <strong>«Применить»</strong> (при массовом изменении).
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Внешний вид
        </h3>
        <div className="not-prose my-6 space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600">Активна:</span>
                <button 
                    className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 w-28 flex justify-center items-center"
                >
                    Сохранить
                </button>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600">Заблокирована:</span>
                <button 
                    disabled
                    className="px-4 py-2 text-sm font-medium rounded-md bg-gray-400 text-white w-28 flex justify-center items-center cursor-not-allowed"
                >
                    Сохранить
                </button>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Технические детали
        </h3>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`<button
    onClick={handleSave}
    disabled={isSaving || !title.trim()}
    className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 w-28 flex justify-center items-center"
>
    {isSaving ? <div className="loader border-white border-t-transparent h-4 w-4"></div> : 'Создать'}
</button>`}
            </pre>
        </div>

        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>bg-green-600</code> — зелёный фон (цвет основного действия в приложении)</li>
            <li><code>hover:bg-green-700</code> — становится темнее при наведении курсора</li>
            <li><code>disabled:bg-gray-400</code> — серый фон, если кнопка заблокирована</li>
            <li><code>w-28</code> — фиксированная ширина 112px (7rem)</li>
            <li><code>flex justify-center items-center</code> — содержимое выровнено по центру (важно для индикатора загрузки)</li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Зачем фиксированная ширина?
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Когда начинается сохранение, текст «Создать» заменяется на крутящийся индикатор загрузки. Если бы ширина кнопки была автоматической, она бы "сжалась" (индикатор уже, чем текст), и футер визуально "дёрнулся" бы. Фиксированная ширина (<code>w-28</code>) решает эту проблему — кнопка остаётся неподвижной.
        </p>
    </section>
);
