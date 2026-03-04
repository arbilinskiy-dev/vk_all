/**
 * Секция «Практические сценарии»: 5 типовых ситуаций работы с фильтрами.
 */
import React from 'react';

export const ScenariosSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            💼 Практические сценарии
        </h2>

        {/* Сценарий 1 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 1: Проверка товаров в акции
        </h3>
        <div className="not-prose mt-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 mb-2"><strong>Ситуация:</strong> Заказчик спросил, сколько товаров сейчас в подборке "Летняя распродажа".</p>
            <p className="text-sm text-blue-900"><strong>Действия:</strong></p>
            <ol className="text-sm text-blue-900 space-y-1 ml-5 mt-2">
                <li>1. Открываете вкладку "Товары" проекта</li>
                <li>2. Кликаете на кнопку "Летняя распродажа"</li>
                <li>3. Смотрите количество рядом с названием (например, "Летняя распродажа - 23")</li>
                <li>4. Проверяете список товаров — видите только те, что в подборке</li>
            </ol>
        </div>

        {/* Сценарий 2 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 2: Разбор новых товаров
        </h3>
        <div className="not-prose mt-3 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-900 mb-2"><strong>Ситуация:</strong> После импорта 50 новых товаров нужно распределить их по подборкам.</p>
            <p className="text-sm text-yellow-900"><strong>Действия:</strong></p>
            <ol className="text-sm text-yellow-900 space-y-1 ml-5 mt-2">
                <li>1. Кликаете кнопку "Без подборки"</li>
                <li>2. Видите список неразобранных товаров</li>
                <li>3. Открываете каждый товар, смотрите на его категорию</li>
                <li>4. В карточке товара добавляете нужные подборки</li>
                <li>5. Когда закончите — кнопка "Без подборки" исчезнет (если всё разобрали)</li>
            </ol>
        </div>

        {/* Сценарий 3 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 3: Создание новой подборки
        </h3>
        <div className="not-prose mt-3 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-900 mb-2"><strong>Ситуация:</strong> Появилась новая категория товаров — нужно создать подборку "Новогодние товары".</p>
            <p className="text-sm text-green-900"><strong>Действия:</strong></p>
            <ol className="text-sm text-green-900 space-y-1 ml-5 mt-2">
                <li>1. Кликаете "+ Создать подборку"</li>
                <li>2. Вводите название: "Новогодние товары"</li>
                <li>3. Нажимаете Enter (или кнопку "Ок")</li>
                <li>4. Новая кнопка с подборкой появляется в фильтрах</li>
                <li>5. Теперь можно добавлять туда товары через их карточки</li>
            </ol>
        </div>

        {/* Сценарий 4 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 4: Быстрый переход в VK
        </h3>
        <div className="not-prose mt-3 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-900 mb-2"><strong>Ситуация:</strong> Заказчик говорит, что подборка "Хиты продаж" выглядит странно на сайте VK.</p>
            <p className="text-sm text-purple-900"><strong>Действия:</strong></p>
            <ol className="text-sm text-purple-900 space-y-1 ml-5 mt-2">
                <li>1. Наводите курсор на кнопку "Хиты продаж"</li>
                <li>2. Видите иконку со стрелкой справа</li>
                <li>3. Кликаете на иконку</li>
                <li>4. Открывается новая вкладка с этой подборкой в VK</li>
                <li>5. Видите проблему и решаете её (например, изменяете порядок товаров)</li>
            </ol>
        </div>

        {/* Сценарий 5 */}
        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">
            Сценарий 5: Комбинация поиска и фильтра
        </h3>
        <div className="not-prose mt-3 p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-900 mb-2"><strong>Ситуация:</strong> Нужно найти все футболки из подборки "Акции".</p>
            <p className="text-sm text-indigo-900"><strong>Действия:</strong></p>
            <ol className="text-sm text-indigo-900 space-y-1 ml-5 mt-2">
                <li>1. Вводите в поиск: "футболка"</li>
                <li>2. Кликаете кнопку "Акции"</li>
                <li>3. Видите только футболки из акционной подборки</li>
                <li>4. Если результатов нет — значит футболок в акциях сейчас нет</li>
            </ol>
        </div>
    </section>
);
