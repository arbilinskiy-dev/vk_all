import React from 'react';

// =====================================================================
// Навигация по подразделам модуля «Контент-менеджмент»
// (2.1 — 2.4 с описанием подтем)
// =====================================================================
export const SectionNavigation: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Структура раздела</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Раздел "Контент-менеджмент" подробно описан в следующих подразделах:
        </p>

        <div className="not-prose my-6 space-y-3">
            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-indigo-900 mb-2">2.1. Вкладка "Отложенные" (Календарь)</h3>
                <p className="text-sm text-gray-700 mb-3">
                    Подробное описание работы с календарём отложенных постов: сайдбар проектов, 
                    шапка календаря, сетка с постами, заметки, истории.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                    <p>→ 2.1.1. Сайдбар проектов</p>
                    <p>→ 2.1.2. Шапка календаря</p>
                    <p>→ 2.1.3. Сетка календаря</p>
                    <p>→ 2.1.4. Посты в календаре</p>
                    <p>→ 2.1.5. Заметки</p>
                    <p>→ 2.1.6. Истории (Stories)</p>
                    <p>→ 2.1.7. Всплывающее окно поста</p>
                    <p>→ 2.1.8. Операции с постами</p>
                </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-purple-900 mb-2">2.2. Вкладка "Предложенные"</h3>
                <p className="text-sm text-gray-700">
                    Работа с постами, которые предложили участники сообщества. Интерфейс представляет собой 
                    список карточек с текстом постов и кнопками действий (одобрить, отклонить).
                </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-green-900 mb-2">2.3. Вкладка "Товары"</h3>
                <p className="text-sm text-gray-700">
                    Управление товарами в сообществе через табличный интерфейс.
                </p>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <h3 className="font-bold text-amber-900 mb-2">2.4. Автоматизации</h3>
                <p className="text-sm text-gray-700 mb-3">
                    Инструменты для автоматизации работы с контентом: автоматическая публикация постов в истории, 
                    конкурсы отзывов с автоматической модерацией, дроп промокодов, AI-генерация контента и другие автоматизированные процессы.
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                    <p>→ 2.4.1. Посты в истории</p>
                    <p>→ 2.4.2. Конкурс отзывов</p>
                    <p>→ 2.4.3. Дроп промокодов</p>
                    <p>→ + другие автоматизации</p>
                </div>
            </div>
        </div>
    </>
);
