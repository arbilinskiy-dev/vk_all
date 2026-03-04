import React from 'react';

// =====================================================================
// Секция: Сценарии использования сетки календаря
// =====================================================================
export const CalendarGridScenarios: React.FC = () => (
    <>
        {/* Сценарии использования */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Сценарии использования</h2>

        <div className="not-prose space-y-4 my-8">
            <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50 rounded-r-lg">
                <h3 className="font-bold text-green-900 mb-2">Планирование контента на неделю</h3>
                <p className="text-sm text-gray-700 mb-2">
                    <strong>Ситуация:</strong> Нужно распределить 10 постов на неделю вперёд.
                </p>
                <p className="text-sm text-gray-700">
                    <strong>Действия:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-3">
                    <li>Открой вкладку "Расписание"</li>
                    <li>Убедись, что видишь текущую неделю</li>
                    <li>Создай посты через кнопку "+" в нужных днях</li>
                    <li>Посмотри на сетку — видно все пустые места и загруженные дни</li>
                    <li>Если нужно, перетащи посты на другие дни для равномерного распределения</li>
                </ol>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-lg">
                <h3 className="font-bold text-blue-900 mb-2">Проверка автоматизаций</h3>
                <p className="text-sm text-gray-700 mb-2">
                    <strong>Ситуация:</strong> Настроил AI-ленту на ежедневную публикацию в 9:00. 
                    Хочу убедиться, что она будет работать всю неделю.
                </p>
                <p className="text-sm text-gray-700">
                    <strong>Действия:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-3">
                    <li>Открой вкладку "Расписание"</li>
                    <li>Посмотри на сетку — должны быть видны призрачные посты AI-ленты на каждый день</li>
                    <li>Если призраки есть на всех днях в 9:00 — всё настроено правильно</li>
                    <li>Если призраков нет — проверь настройки автоматизации</li>
                </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                <h3 className="font-bold text-purple-900 mb-2">Перенос постов на другую неделю</h3>
                <p className="text-sm text-gray-700 mb-2">
                    <strong>Ситуация:</strong> Запланировал посты на эту неделю, 
                    но понял что нужно их сдвинуть на неделю вперёд.
                </p>
                <p className="text-sm text-gray-700">
                    <strong>Действия:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-3">
                    <li>Включи режим выбора (кнопка "Выбрать" в шапке)</li>
                    <li>Выбери все нужные посты чекбоксами</li>
                    <li>Нажми на стрелку вправо в навигации (переключись на следующую неделю)</li>
                    <li>Нажми "Переместить сюда" в массовых действиях</li>
                    <li>Посты переместятся на те же дни недели, но уже на следующей неделе</li>
                </ol>
            </div>

            <div className="border-l-4 border-orange-500 pl-4 py-3 bg-orange-50 rounded-r-lg">
                <h3 className="font-bold text-orange-900 mb-2">Быстрое добавление напоминаний</h3>
                <p className="text-sm text-gray-700 mb-2">
                    <strong>Ситуация:</strong> В среду нужно не забыть подготовить фото для пятничного поста.
                </p>
                <p className="text-sm text-gray-700">
                    <strong>Действия:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-3">
                    <li>Найди колонку среды в сетке</li>
                    <li>Дважды кликни по пустому месту в колонке</li>
                    <li>Откроется форма создания заметки</li>
                    <li>Напиши текст напоминания, выбери цвет</li>
                    <li>Сохрани — заметка появится в сетке</li>
                </ol>
            </div>
        </div>
    </>
);
