import React from 'react';

// =====================================================================
// Секция «Как работает конкурс: 5 шагов»
// =====================================================================

/** Данные одного шага рабочего процесса */
interface WorkflowStep {
    number: number;
    title: string;
    description: string;
}

/** 5 шагов работы конкурса отзывов */
const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        number: 1,
        title: 'Настройка условий',
        description: 'Включите конкурс, укажите ключевые слова для поиска (берутся из названий товаров), установите дату старта и условия завершения (по количеству участников, по дате или смешанный режим).',
    },
    {
        number: 2,
        title: 'Сбор участников',
        description: 'Нажмите кнопку "Собрать посты" — система найдёт все отзывы на товары сообщества, которые содержат указанные ключевые слова. Каждый участник получает статус и может быть обработан.',
    },
    {
        number: 3,
        title: 'Проверка и комментирование',
        description: 'Система автоматически комментирует отзывы участников с использованием настраиваемого шаблона. Если включён автоматический черный список, повторные участники отсеиваются.',
    },
    {
        number: 4,
        title: 'Выбор победителей',
        description: 'Когда условия конкурса выполнены (набрано нужное количество участников или наступила дата окончания), нажмите "Провести розыгрыш" — система случайным образом выберет победителей среди принятых участников.',
    },
    {
        number: 5,
        title: 'Уведомление победителей',
        description: 'Система автоматически отправит личные сообщения победителям и опубликует пост в сообществе с результатами розыгрыша. История сохраняется на вкладке "Победители".',
    },
];

export const WorkflowStepsSection: React.FC = () => (
    <section>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">
            Как работает конкурс: 5 шагов
        </h2>

        <div className="not-prose mt-6 space-y-4">
            {WORKFLOW_STEPS.map((step) => (
                <div key={step.number} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                        {step.number}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                </div>
            ))}
        </div>
    </section>
);
