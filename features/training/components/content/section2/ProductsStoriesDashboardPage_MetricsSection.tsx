import React from 'react';
import { Sandbox } from '../shared';
import { MockSparkline, MockMetricCard } from './ProductsStoriesDashboardPage_MockComponents';

// =====================================================================
// Раздел 2: Метрики дашборда
// =====================================================================

/** Пропсы секции метрик — данные для демо-графика */
interface MetricsSectionProps {
    demoViews: number[];
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ demoViews }) => (
    <>
        {/* РАЗДЕЛ 2: МЕТРИКИ ДАШБОРДА */}
        <hr className="!my-10" />
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">2. Метрики дашборда</h2>
        
        <p className="!text-base !leading-relaxed !text-gray-700">
            Дашборд показывает 8 карточек с ключевыми показателями эффективности. Карточки размещены в 
            формате бенто-сетки — 4 карточки в верхнем ряду (разного размера) и 4 мини-карточки в нижнем ряду.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Главный ряд карточек</h3>

        {/* Карточка 1: Сумма показов */}
        <div className="not-prose mt-6">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-600 rounded-r-lg p-4">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    1. Сумма показов
                </h4>
                <p className="text-sm text-indigo-800">
                    <strong>Самая большая карточка</strong> (занимает 2 колонки). Показывает общее количество просмотров всех историй.
                </p>
                <ul className="text-sm text-indigo-700 space-y-1 mt-2 ml-4">
                    <li>• <strong>Иконка:</strong> Глаз (фиолетовый фон)</li>
                    <li>• <strong>График:</strong> Линия тренда показов по времени (показывает динамику роста или падения)</li>
                    <li>• <strong>Зачем:</strong> Главный показатель охвата — сколько человек увидели ваши истории</li>
                </ul>
            </div>
        </div>

        {/* Карточка 2: Эквивалент в рекламе */}
        <div className="not-prose mt-4">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-l-4 border-emerald-600 rounded-r-lg p-4">
                <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    2. Эквивалент в рекламе
                </h4>
                <p className="text-sm text-emerald-800">
                    <strong>Показывает экономию бюджета.</strong> Рассчитывает, сколько стоило бы получить такой же охват через таргетированную рекламу ВКонтакте.
                </p>
                <ul className="text-sm text-emerald-700 space-y-1 mt-2 ml-4">
                    <li>• <strong>Иконка:</strong> Денежный знак (зелёный фон)</li>
                    <li>• <strong>Формула:</strong> (Показы / 1000) × 150₽ (CPM = 150₽ за 1000 показов)</li>
                    <li>• <strong>Подсказка:</strong> При наведении курсора на иконку информации появляется объяснение формулы</li>
                    <li>• <strong>Бейдж:</strong> "Вы сэкономили бюджет" (зелёный)</li>
                </ul>
            </div>
        </div>

        {/* Карточка 3: Клики + CTR */}
        <div className="not-prose mt-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-r-lg p-4">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    3. Клики + CTR
                </h4>
                <p className="text-sm text-blue-800">
                    <strong>Показывает эффективность ссылок.</strong> Количество переходов по ссылкам и процент кликнувших пользователей.
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mt-2 ml-4">
                    <li>• <strong>Иконка:</strong> Курсор (синий фон)</li>
                    <li>• <strong>График:</strong> Линия тренда кликов</li>
                    <li>• <strong>CTR:</strong> Click-Through Rate — процент пользователей, перешедших по ссылке</li>
                    <li>• <strong>Формула CTR:</strong> (Клики / Просмотры) × 100%</li>
                    <li>• <strong>Подсказка:</strong> При наведении на "CTR" появляется объяснение метрики</li>
                </ul>
            </div>
        </div>

        {/* Карточка 4: Активность */}
        <div className="not-prose mt-4">
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border-l-4 border-pink-600 rounded-r-lg p-4">
                <h4 className="font-bold text-pink-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    4. Активность
                </h4>
                <p className="text-sm text-pink-800">
                    <strong>Суммарная вовлечённость.</strong> Показывает общее количество действий пользователей с историями.
                </p>
                <ul className="text-sm text-pink-700 space-y-1 mt-2 ml-4">
                    <li>• <strong>Иконка:</strong> Сердечко (розовый фон)</li>
                    <li>• <strong>Разбивка по действиям:</strong></li>
                    <li className="ml-4">◦ 🔴 Лайки — сколько пользователей поставили "Нравится"</li>
                    <li className="ml-4">◦ 🟣 Репосты — сколько раз поделились</li>
                    <li className="ml-4">◦ 🔵 Ответы — ответы в комментариях + личные сообщения</li>
                    <li>• <strong>Зачем:</strong> Показывает реальный интерес аудитории к контенту</li>
                </ul>
            </div>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Нижний ряд мини-карточек</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Четыре компактные карточки с дополнительными метриками и рассчитанными показателями.
        </p>

        <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Карточка 5: Историй */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    5. Историй
                </h4>
                <p className="text-xs text-gray-600">Количество историй в выбранном периоде и типе (с учётом фильтров)</p>
            </div>

            {/* Карточка 6: Подписки */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    6. Подписки
                </h4>
                <p className="text-xs text-gray-600">Новые подписчики, которые подписались после просмотра историй</p>
            </div>

            {/* Карточка 7: Скрытия */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    7. Скрытия
                </h4>
                <p className="text-xs text-gray-600">Сколько пользователей скрыли историю (негативная реакция). Чем меньше — тем лучше</p>
            </div>

            {/* Карточка 8: ER View */}
            <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-lg p-3">
                <h4 className="font-bold text-indigo-900 text-sm mb-1 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    8. ER View
                </h4>
                <p className="text-xs text-indigo-700">
                    <strong>Engagement Rate View</strong> — уровень вовлечённости. 
                    Формула: ((Лайки + Репосты + Ответы) / Просмотры) × 100%
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                    • 3-5% — хороший показатель<br/>
                    • Меньше 1% — стоит улучшить контент
                </p>
            </div>
        </div>

        {/* Интерактивная демонстрация карточек */}
        <Sandbox
            title="Демонстрация метрических карточек"
            description="Посмотрите на примеры карточек с графиками и метриками."
            instructions={[
                "Обратите внимание на <strong>цветовую кодировку</strong> — каждая метрика имеет свой цвет",
                "График показывает <strong>тренд изменения</strong> показателей по времени",
                "Наведите курсор на карточки — появляется эффект подсветки границы"
            ]}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Карточка "Сумма показов" с графиком */}
                <MockMetricCard
                    title="Сумма показов"
                    value="25,430"
                    colSpan="col-span-1 md:col-span-2"
                    bgColor="bg-indigo-50"
                    iconColor="text-indigo-600"
                    textColor="text-indigo-900"
                    icon={
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    }
                >
                    <div className="mt-4 h-16 w-full">
                        <MockSparkline data={demoViews} color="text-indigo-500" />
                    </div>
                </MockMetricCard>

                {/* Карточка "Эквивалент в рекламе" */}
                <MockMetricCard
                    title="Эквивалент в рекламе"
                    value="3,815 ₽"
                    bgColor="bg-emerald-50"
                    iconColor="text-emerald-600"
                    textColor="text-emerald-600"
                    icon={
                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                >
                    <div className="mt-3">
                        <div className="bg-emerald-50 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-800 inline-block">
                            Вы сэкономили бюджет
                        </div>
                    </div>
                </MockMetricCard>

                {/* Карточка "Клики + CTR" */}
                <MockMetricCard
                    title="Клики"
                    value="342"
                    bgColor="bg-blue-50"
                    iconColor="text-blue-600"
                    icon={
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                    }
                >
                    <div className="mt-3 flex items-end gap-2">
                        <div className="flex-1 h-12">
                            <MockSparkline data={[50, 60, 75, 85, 90, 110, 95]} color="text-blue-500" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">CTR</p>
                            <p className="text-lg font-bold text-blue-600">1.3%</p>
                        </div>
                    </div>
                </MockMetricCard>
            </div>
        </Sandbox>
    </>
);
