import React from 'react';

// =====================================================================
// Секция 5: Индикатор загрузки (крутящийся спиннер)
// =====================================================================

export const SpinnerSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Индикатор загрузки (крутящийся спиннер)
        </h2>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Когда вы нажимаете «Сохранить» или «Создать», данные отправляются на сервер. Пока идёт отправка (обычно 0.5–2 секунды), текст кнопки заменяется на крутящийся спиннер — белый кружок с анимацией вращения.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Как это выглядит
        </h3>
        <div className="not-prose my-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-sm text-gray-600">Сохранение:</span>
                <button 
                    className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white w-28 flex justify-center items-center"
                >
                    <div className="loader border-white border-t-transparent h-4 w-4"></div>
                </button>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Код спиннера
        </h3>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`{isSaving ? (
    <div className="loader border-white border-t-transparent h-4 w-4"></div>
) : (
    'Создать'
)}`}
            </pre>
        </div>

        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Что означают классы:</strong>
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>loader</code> — глобальный CSS-класс с анимацией вращения (определён в <code>index.css</code>)</li>
            <li><code>border-white</code> — белая рамка вокруг круга (хорошо видна на зелёной кнопке)</li>
            <li><code>border-t-transparent</code> — верхняя часть рамки прозрачная (создаёт эффект "незавершённого круга")</li>
            <li><code>h-4 w-4</code> — размер 16×16 пикселей</li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            CSS-анимация
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Анимация вращения определена глобально в файле стилей:
        </p>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`.loader {
    border-radius: 50%;
    border: 2px solid;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}`}
            </pre>
        </div>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Спиннер делает полный оборот за 0.6 секунды и повторяет анимацию бесконечно, пока <code>isSaving</code> равен <code>true</code>.
        </p>
    </section>
);
