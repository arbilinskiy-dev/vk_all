import React from 'react';

// =====================================================================
// Блок FAQ — часто задаваемые вопросы
// =====================================================================
export const SidebarNavOverview_FAQ: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Часто задаваемые вопросы</h2>

        <div className="not-prose space-y-4 my-8">
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">Почему я не вижу некоторые проекты в сайдбаре?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Скорее всего проекты находятся в секции «Отключённые». Прокрутите список вниз и разверните 
                    эту секцию кнопкой с иконкой глаза. Также проверьте активные фильтры — возможно, выбрана 
                    конкретная команда или фильтр по количеству постов.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">Что означает жёлтый треугольник рядом с проектом?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Жёлтый (янтарный) треугольник — это индикатор ошибки доступа. Система не смогла получить данные 
                    из ВКонтакте. Обычно это означает, что токен сообщества устарел или отозван. Нужно обновить 
                    токен в настройках проекта.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">Как быстро найти нужный проект среди 50+ сообществ?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Используйте поле поиска — начните вводить название сообщества. Также можно фильтровать 
                    по командам (если вы их настроили) или по количеству постов (на вкладках «Отложенные» и «Предложенные»).
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">Зачем отключать проекты?</summary>
                <p className="text-sm text-gray-700 mt-2">
                    Отключение проектов полезно для сообществ, с которыми вы временно не работаете. Отключённые 
                    проекты не участвуют в глобальном обновлении, что ускоряет загрузку данных. Проект можно 
                    включить обратно в любой момент через настройки.
                </p>
            </details>
        </div>
    </>
);
