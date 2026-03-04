import React from 'react';

// =====================================================================
// Секция: Типы контента в сетке (посты, заметки, истории)
// =====================================================================
export const CalendarGridContentTypes: React.FC = () => (
    <>
        {/* Типы контента */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что показывается в сетке?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700 mb-6">
            В сетке календаря отображаются три основных типа контента:
        </p>

        <div className="not-prose space-y-6 my-8">
            {/* Посты */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">📝</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Посты</h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Основной тип контента. Посты бывают трёх видов:
                        </p>
                    </div>
                </div>
                
                <div className="space-y-3 ml-10">
                    <div className="bg-gray-50 rounded p-3 border-l-2 border-gray-400">
                        <p className="font-semibold text-gray-900 mb-1">Обычные запланированные посты</p>
                        <p className="text-xs text-gray-600">
                            Посты, которые ты создал сам. Белый фон, обычная рамка. 
                            Можно перетаскивать, редактировать, удалять.
                        </p>
                    </div>
                    
                    <div className="bg-indigo-50 rounded p-3 border-l-2 border-indigo-400">
                        <p className="font-semibold text-indigo-900 mb-1">Системные посты (автоматизации)</p>
                        <p className="text-xs text-gray-600 mb-2">
                            Посты, которые создаются автоматически по расписанию. 
                            Цветной фон, пунктирная рамка. Нельзя перетаскивать.
                        </p>
                        <div className="text-xs text-gray-700 space-y-1">
                            <p>• <strong>AI-лента</strong> — индиго фон</p>
                            <p>• <strong>Конкурс победителей</strong> — фуксия фон</p>
                            <p>• <strong>Универсальный конкурс старт</strong> — небесно-голубой фон</p>
                            <p>• <strong>Универсальный конкурс итоги</strong> — оранжевый фон</p>
                        </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded p-3 border-l-2 border-purple-400">
                        <p className="font-semibold text-purple-900 mb-1">"Призрачные" посты</p>
                        <p className="text-xs text-gray-600">
                            Полупрозрачные копии системных постов с циклическим повторением. 
                            Показывают будущие публикации автоматизации. Прозрачность 70%, более светлый фон, пунктирная рамка.
                        </p>
                    </div>
                </div>
            </div>

            {/* Заметки */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">🗒</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Заметки</h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Личные напоминания и задачи. Отображаются как <strong>цветные карточки</strong> с текстом. 
                            Доступны 7 цветов для визуального разделения задач.
                        </p>
                        <p className="text-xs text-gray-600">
                            Заметки можно сворачивать (показывается только время и заголовок) или разворачивать 
                            (виден весь текст и кнопки действий).
                        </p>
                    </div>
                </div>
            </div>

            {/* Истории */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                    <div className="text-2xl">⭕</div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Истории</h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Опубликованные истории ВКонтакте. Показываются как <strong>кружки</strong> в верхней части дня, 
                            наслаиваются друг на друга если их несколько.
                        </p>
                        <p className="text-xs text-gray-600">
                            <strong>Фото-истории</strong> — индиго фон. <strong>Видео-истории</strong> — фиолетовый фон и красный значок воспроизведения.<br/>
                            При наведении кружок увеличивается. При клике открывается полноэкранный просмотрщик истории.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </>
);
