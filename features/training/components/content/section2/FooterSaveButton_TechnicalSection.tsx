import React from 'react';

// =====================================================================
// Секция 8: Технические детали и лучшие практики
// =====================================================================

export const TechnicalSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Технические детали и лучшие практики
        </h2>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Порядок кнопок
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В приложении соблюдается единый порядок: <strong>сначала вторичная кнопка (слева), потом главная (справа)</strong>. Это соответствует дизайн-паттернам Windows, macOS и веб-приложений — главная кнопка всегда ближе к правому краю.
        </p>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`<footer>
    <button>Отмена</button>     {/* Вторичная — слева */}
    <button>Сохранить</button>  {/* Главная — справа */}
</footer>`}
            </pre>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Клавиша Enter для быстрого сохранения
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Во многих формах (создание альбома, заметка) можно нажать <strong>Enter</strong> в поле ввода, чтобы мгновенно сохранить. Это работает через обработчик <code>onKeyDown</code> на поле:
        </p>
        <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-4 my-4">
            <pre className="text-xs overflow-x-auto">
{`<input
    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
    ...
/>`}
            </pre>
        </div>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Валидация выполняется точно так же, как при клике на кнопку — если поле пустое, появится ошибка.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Типы кнопок действий
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В разных окнах кнопка главного действия может иметь разные цвета:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><strong>Зелёная</strong> (<code>bg-green-600</code>) — создание, сохранение, подтверждение</li>
            <li><strong>Синяя</strong> (<code>bg-indigo-600</code>) — применение изменений, редактирование</li>
            <li><strong>Красная</strong> (<code>bg-red-600</code>) — удаление, опасные действия (используется в ConfirmationModal)</li>
        </ul>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Динамический текст кнопки
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В окне поста текст кнопки меняется в зависимости от выбранного способа публикации:
        </p>
        <ul className="!text-base !leading-relaxed !text-gray-700">
            <li><code>publicationMethod === 'now'</code> → «Опубликовать»</li>
            <li><code>publicationMethod === 'vk'</code> → «В отложку VK»</li>
            <li><code>publicationMethod === 'system'</code> → «Запланировать»</li>
        </ul>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Если создаётся несколько постов одновременно, к тексту добавляется счётчик: <strong>«Запланировать (5)»</strong>.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Компонент ConfirmationModal
        </h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            В приложении есть готовый компонент <code>ConfirmationModal</code> из <code>shared/components/modals/</code>, который используется для подтверждения опасных действий (удаление, закрытие без сохранения). У него тоже есть футер с кнопками, но структура упрощённая — нет тега <code>&lt;footer&gt;</code>, только <code>&lt;div&gt;</code> с классами <code>flex justify-end gap-3</code>.
        </p>
    </section>
);
