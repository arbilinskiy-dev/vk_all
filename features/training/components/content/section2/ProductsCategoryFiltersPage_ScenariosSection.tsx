/**
 * Секция «Практические сценарии» — 4 сценария использования фильтров категорий.
 */
import React from 'react';

export const ScenariosSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            💼 Практические сценарии
        </h2>

        {/* Сценарий 1 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 1: Создание нового товара
        </h3>
        <div className="not-prose mt-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">
                <strong>Ситуация:</strong> Нужно добавить футболку в каталог.
            </p>
            <p className="text-sm text-blue-900">
                <strong>Действия:</strong>
            </p>
            <ol className="text-sm text-blue-900 space-y-1 ml-5 mt-2">
                <li>1. Открываете всплывающее окно создания товара</li>
                <li>2. Заполняете название, цену, описание</li>
                <li>3. Кликаете на селектор категории</li>
                <li>4. Вводите в поиск "футбол"</li>
                <li>5. Выбираете "Одежда / Футболки / Мужские"</li>
                <li>6. Сохраняете товар</li>
            </ol>
        </div>

        {/* Сценарий 2 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 2: Изменение категории у существующего товара
        </h3>
        <div className="not-prose mt-3 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900 mb-2">
                <strong>Ситуация:</strong> Товар был в неправильной категории, нужно исправить.
            </p>
            <p className="text-sm text-green-900">
                <strong>Действия:</strong>
            </p>
            <ol className="text-sm text-green-900 space-y-1 ml-5 mt-2">
                <li>1. Находите товар в таблице</li>
                <li>2. Кликаете на селектор в колонке "Категория"</li>
                <li>3. Ищете правильную категорию через поиск</li>
                <li>4. Выбираете нужную категорию</li>
                <li>5. Нажимаете "Сохранить изменения" в шапке таблицы</li>
            </ol>
        </div>

        {/* Сценарий 3 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 3: Массовое изменение категорий
        </h3>
        <div className="not-prose mt-3 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-900 mb-2">
                <strong>Ситуация:</strong> После импорта 50 товаров все оказались в категории
                "Разное", нужно переместить их в "Одежда / Футболки".
            </p>
            <p className="text-sm text-purple-900">
                <strong>Действия:</strong>
            </p>
            <ol className="text-sm text-purple-900 space-y-1 ml-5 mt-2">
                <li>1. Включаете режим выбора (кнопка с галочками)</li>
                <li>2. Отмечаете нужные товары</li>
                <li>3. Нажимаете "Изменить" в шапке</li>
                <li>4. Открывается окно массового редактирования</li>
                <li>5. Выбираете категорию "Одежда / Футболки"</li>
                <li>6. Нажимаете "Применить"</li>
            </ol>
        </div>

        {/* Сценарий 4 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 4: VK добавил новые категории
        </h3>
        <div className="not-prose mt-3 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-900 mb-2">
                <strong>Ситуация:</strong> ВКонтакте добавил категорию "Смартфоны", но в
                приложении её нет.
            </p>
            <p className="text-sm text-yellow-900">
                <strong>Действия:</strong>
            </p>
            <ol className="text-sm text-yellow-900 space-y-1 ml-5 mt-2">
                <li>1. Открываете страницу "Товары"</li>
                <li>2. Нажимаете кнопку с круговой стрелкой (справа вверху)</li>
                <li>3. Ждёте пару секунд (крутится индикатор загрузки)</li>
                <li>4. Теперь при открытии селектора видите новую категорию "Смартфоны"</li>
            </ol>
        </div>
    </section>
);
