import React from 'react';

/**
 * Секция «Как пользоваться статистикой»
 * Три сценария использования + совет по частоте обновлений.
 */
export const ScenariosSection: React.FC = () => {
    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как пользоваться статистикой</h2>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Сценарий 1: Первый просмотр статистики</h3>

            <ol className="!text-base !leading-relaxed !text-gray-700">
                <li>Откройте страницу "Статистика" (вкладка справа от "Настройки и История")</li>
                <li>Дождитесь загрузки дашборда и таблицы (может занять 2-3 секунды)</li>
                <li>Посмотрите на дашборд — там сводные цифры за всё время</li>
                <li>Прокрутите вниз до таблицы — там список всех историй</li>
                <li>Если у каких-то историй нет детальной статистики (только просмотры), нажмите "Обновить статистику" → выберите период</li>
            </ol>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Сценарий 2: Анализ эффективности за неделю</h3>

            <ol className="!text-base !leading-relaxed !text-gray-700">
                <li>Нажмите на фильтр "За неделю" в дашборде</li>
                <li>Все метрики пересчитаются и покажут данные за последние 7 дней</li>
                <li>Сравните CTR и ER View — если CTR &lt; 1%, значит ссылки не кликают; если ER View &lt; 3%, значит контент не цепляет</li>
                <li>Переключите фильтр типа на "Авто" — посмотрите работает ли автоматизация лучше чем ручные публикации</li>
            </ol>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Сценарий 3: Обновление статистики конкретной истории</h3>

            <ol className="!text-base !leading-relaxed !text-gray-700">
                <li>Найдите нужную историю в таблице (по дате или превью)</li>
                <li>Нажмите кнопку "Обновить" в колонке "Действия"</li>
                <li>Кнопка изменит текст на "Обновление..." и станет серой</li>
                <li>Через 2-5 секунд детальная статистика загрузится с VK API</li>
                <li>Появятся все 8 метрик: лайки, клики, репосты, подписки и т.д.</li>
            </ol>

            <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                        <strong>Совет:</strong> Обновляйте статистику раз в день, а не каждый час. 
                        VK API имеет ограничения на количество запросов, и частые обновления могут привести к временной блокировке.
                    </span>
                </p>
            </div>
        </>
    );
};
