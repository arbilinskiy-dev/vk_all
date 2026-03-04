import React from 'react';

// =====================================================================
// Секция «Ключевые действия» — 5 кнопок управления на вкладке «Посты»
// =====================================================================

/** Описание одной кнопки-действия */
interface ActionItem {
    title: React.ReactNode;
    description: string;
    iconBg: string;
    iconBorder: string;
    iconColor: string;
    svgPath: string;
}

/** 5 ключевых действий */
const KEY_ACTIONS: ActionItem[] = [
    {
        title: 'Обновить список',
        description: 'Перезагружает таблицу участников из базы данных. Используется для проверки актуальных статусов после автоматических процессов.',
        iconBg: 'bg-gray-100',
        iconBorder: 'border-gray-300',
        iconColor: 'text-gray-500',
        svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    },
    {
        title: <>Очистить список <span className="text-xs text-red-600">(только администраторы)</span></>,
        description: 'Удаляет всех участников из базы данных. Используется для начала нового конкурса с чистого листа. Требуется подтверждение действия.',
        iconBg: 'bg-red-50',
        iconBorder: 'border-red-200',
        iconColor: 'text-red-500',
        svgPath: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    },
    {
        title: 'Комментировать отзывы',
        description: 'Отправляет комментарии к отзывам всех новых участников, используя шаблон из настроек. Автоматически меняет статус на "Принят".',
        iconBg: 'bg-green-50',
        iconBorder: 'border-green-600',
        iconColor: 'text-green-600',
        svgPath: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    },
    {
        title: 'Провести розыгрыш',
        description: 'Случайным образом выбирает победителей среди участников со статусом "Принят". После выбора отправляет им личные сообщения и публикует пост с результатами в сообществе.',
        iconBg: 'bg-amber-50',
        iconBorder: 'border-amber-500',
        iconColor: 'text-amber-600',
        svgPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    },
    {
        title: 'Собрать посты',
        description: 'Запускает поиск новых отзывов на товары сообщества по ключевым словам. Найденные отзывы добавляются в таблицу со статусом "Новый".',
        iconBg: 'bg-indigo-600',
        iconBorder: '',
        iconColor: 'text-white',
        svgPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    },
];

export const KeyActionsSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Ключевые действия
        </h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            На вкладке "Посты" доступны 5 основных действий для управления конкурсом:
        </p>

        <div className="not-prose mt-6 space-y-4">
            {KEY_ACTIONS.map((action, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${action.iconBg} ${action.iconBorder ? `border ${action.iconBorder}` : ''} flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${action.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.svgPath} />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
                            <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
