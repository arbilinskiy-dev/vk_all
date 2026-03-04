import React from 'react';

// =====================================================================
// Карточки описания основных разделов модуля «Контент-менеджмент»
// (Отложенные, Предложенные, Товары, Автоматизации)
// =====================================================================
export const ModuleSectionsCards: React.FC = () => (
    <div className="not-prose space-y-4 my-8">
        {/* Вкладка 1: Отложенные */}
        <div className="border-l-4 border-indigo-400 pl-4 py-3 bg-indigo-50">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-indigo-900 mb-2">Отложенные</h3>
                    <p className="text-sm text-gray-700">
                        Календарь с постами, которые <strong>запланированы к публикации</strong>. 
                        Здесь ты создаёшь системные черновики, отправляешь их в VK как отложенные посты, 
                        видишь уже опубликованные записи и планируешь контент на неделю вперёд.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        <strong>Основной инструмент:</strong> Календарь с сеткой по дням и часам.
                    </p>
                </div>
            </div>
        </div>

        {/* Вкладка 2: Предложенные */}
        <div className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-50">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-purple-900 mb-2">Предложенные</h3>
                    <p className="text-sm text-gray-700">
                        Посты, которые <strong>предложили участники сообщества</strong> (предложка). 
                        Отображаются в виде списка карточек. Для каждого поста можно использовать AI-редактор, 
                        который автоматически исправляет ошибки и подготавливает текст к публикации.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        <strong>Основной инструмент:</strong> Список карточек постов с AI-редактором.
                    </p>
                </div>
            </div>
        </div>

        {/* Вкладка 3: Товары */}
        <div className="border-l-4 border-green-400 pl-4 py-3 bg-green-50">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-green-900 mb-2">Товары</h3>
                    <p className="text-sm text-gray-700">
                        Управление товарами в сообществе. Табличный интерфейс со списком всех товаров, 
                        их характеристиками и ценами. Можно редактировать описания, цены (включая старую цену для отображения скидки), 
                        загружать новые фотографии, указывать SKU прямо в таблице.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        <strong>Основной инструмент:</strong> Редактируемая таблица товаров с колонками: Фото, New Фото, Название, Описание, Цена, Старая цена, SKU.
                    </p>
                </div>
            </div>
        </div>

        {/* Секция 4: Автоматизации */}
        <div className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-50">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-amber-900 mb-2">Автоматизации</h3>
                    <p className="text-sm text-gray-700">
                        Раздел с инструментами автоматизации работы сообщества: <strong>посты в истории</strong> (автоматическая публикация постов как сториз), 
                        <strong>конкурсы отзывов</strong>, <strong>дроп промокодов</strong>, <strong>AI-генерация постов</strong> и другие автоматизированные механики.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                        <strong>Основной инструмент:</strong> Раскрывающийся список с 7 подразделами автоматизаций.
                    </p>
                </div>
            </div>
        </div>
    </div>
);
