import React from 'react';

// =====================================================================
// Секция: Как работает сетка (особенности работы)
// =====================================================================
export const CalendarGridFeatures: React.FC = () => (
    <>
        {/* Особенности работы */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как работает сетка?</h2>

        <div className="not-prose space-y-4 my-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Отображение прошедших дней</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Если ты листаешь календарь в прошлое, то увидишь:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Опубликованные посты (с зелёной меткой "Опубликовано")</li>
                    <li>Старые заметки</li>
                    <li>Опубликованные истории</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                    <strong>Важно:</strong> Системные посты в прошлом не показываются — они нужны только для будущих публикаций.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Призрачные посты</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Когда у системного поста включено <strong>циклическое повторение</strong>, 
                    сетка автоматически показывает будущие копии этого поста.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Призраки имеют прозрачность 70% и более светлый фон с пунктирной рамкой</li>
                    <li>Показывают, когда автоматизация сработает в будущем</li>
                    <li>При клике на призрак открывается настройка оригинального поста</li>
                    <li>Призраки нельзя перетаскивать или редактировать</li>
                    <li>Генерируются только для активных системных постов</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                    Например: если AI-лента настроена публиковаться каждый день в 9:00, 
                    ты увидишь призрачные копии на каждый день недели.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Перетаскивание (Drag-and-Drop)</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Обычные посты и заметки можно <strong>перетаскивать</strong> между днями:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Зажми карточку мышью и перетащи на другой день</li>
                    <li>При наведении колонка-цель подсвечивается синим фоном</li>
                    <li>Отпусти кнопку мыши — пост/заметка переместится</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                    <strong>Нельзя перетаскивать:</strong> системные посты, призрачные посты, опубликованные посты.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Быстрое создание заметки</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Есть два способа быстро создать заметку на конкретный день:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li><strong>Кнопка "+" в заголовке дня</strong> — создаёт пост</li>
                    <li><strong>Двойной клик по пустому месту колонки</strong> — создаёт заметку</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                    Это работает только для будущих дней — в прошлое создавать нельзя.
                </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">Режим выбора</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Когда включён режим выбора (через кнопку "Выбрать" в шапке):
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>На каждой карточке появляется чекбокс</li>
                    <li>Клик по карточке = выбор/снятие выбора</li>
                    <li>Перетаскивание отключается</li>
                    <li>Можно выбрать несколько постов/заметок и выполнить массовое действие</li>
                </ul>
            </div>
        </div>
    </>
);
