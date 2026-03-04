import React, { useState } from 'react';
import { Sandbox } from '../shared';
import { MockMetricCard } from './ProductsStoriesStatsPage_MockComponents';

/**
 * Секция «Обзор эффективности (Дашборд)»
 * Фильтры, метрики, бенто-сетка, нижний ряд карточек.
 */
export const DashboardSection: React.FC = () => {
    const [filterType, setFilterType] = useState<'all' | 'manual' | 'auto'>('all');
    const [periodType, setPeriodType] = useState<'all' | 'week' | 'month'>('all');

    return (
        <>
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Обзор эффективности (Дашборд)</h2>

            <p className="!text-base !leading-relaxed !text-gray-700">
                В верхней части страницы находится дашборд — набор карточек с ключевыми метриками. 
                Здесь собраны цифры, которые показывают насколько хорошо работают ваши истории.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Фильтры</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Перед метриками расположены два ряда фильтров, которые позволяют выбрать период и тип историй для анализа.
            </p>

            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>Фильтр периода</strong> (6 кнопок):
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>За всё время</strong> — показывает данные с момента первой публикации</li>
                <li><strong>За неделю</strong> — последние 7 дней</li>
                <li><strong>За месяц</strong> — последние 30 дней</li>
                <li><strong>За квартал</strong> — последние 90 дней</li>
                <li><strong>За год</strong> — последние 365 дней</li>
                <li><strong>Свой период</strong> — появляются два календаря для выбора точных дат начала и конца</li>
            </ul>

            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>Фильтр типа</strong> (3 кнопки):
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Всё</strong> — все истории без разделения</li>
                <li><strong>Ручные</strong> — только те истории, которые были опубликованы вручную через кнопку "Опубликовать"</li>
                <li><strong>Авто</strong> — только истории, опубликованные автоматически нашим сервисом</li>
            </ul>

            <Sandbox
                title="Попробуйте фильтры"
                description="Переключайте фильтры и наблюдайте как меняется визуальное состояние кнопок."
                instructions={[
                    'Выберите <strong>период</strong> из шести вариантов',
                    'Переключите <strong>тип</strong> между "Всё", "Ручные" и "Авто"',
                    'Активная кнопка периода подсвечивается индиго цветом',
                    'Активная кнопка типа становится синей с белым текстом'
                ]}
            >
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex flex-col gap-4">
                        {/* Фильтр периода */}
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-2">Период:</p>
                            <div className="flex flex-wrap gap-2 p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
                                {['all', 'week', 'month'].map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setPeriodType(period as any)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                            periodType === period
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {period === 'all' ? 'За всё время' : period === 'week' ? 'За неделю' : 'За месяц'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Фильтр типа */}
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-2">Тип:</p>
                            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                                {['all', 'manual', 'auto'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type as any)}
                                        className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            filterType === type
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        {type === 'all' ? 'Всё' : type === 'manual' ? 'Ручные' : 'Авто'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Sandbox>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Метрики (Бенто-сетка)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Ниже фильтров расположены карточки с ключевыми показателями. Они организованы в бенто-сетку — 
                адаптивную раскладку, где карточки разных размеров создают визуальную иерархию.
            </p>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">1. Сумма показов (большая карточка)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Самая заметная карточка в верхнем ряду. Занимает два столбца и показывает общее количество просмотров всех историй.
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Иконка:</strong> Глаз (символ просмотров)</li>
                <li><strong>Значение:</strong> Крупное число с разделителями тысяч (например: 12,345)</li>
                <li><strong>График:</strong> Линейный график показов за период (мини-sparkline внизу карточки)</li>
                <li><strong>Цвета:</strong> Индиго (синий) — основной цвет показов</li>
            </ul>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">2. Эквивалент в рекламе</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Показывает сколько денег вы сэкономили, получив охват через истории вместо платной рекламы. 
                Расчёт: 1000 показов = 150 рублей (средний CPM в таргетированной рекламе ВКонтакте).
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Иконка:</strong> Денежный знак с кружком</li>
                <li><strong>Значение:</strong> Сумма в рублях (например: 1,850 ₽)</li>
                <li><strong>Подсказка:</strong> При наведении курсора на иконку вопроса появляется всплывающая подсказка с объяснением расчёта</li>
                <li><strong>Бейдж внизу:</strong> Зелёная плашка "Вы сэкономили бюджет"</li>
                <li><strong>Цвета:</strong> Изумрудно-зелёный (emerald)</li>
            </ul>

            <div className="not-prose bg-green-50 border border-green-200 rounded-lg p-4 my-6">
                <p className="text-sm text-green-800 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                        <strong>Пример:</strong> Если ваши истории набрали 10,000 просмотров, эквивалент в рекламе = 1,500₽. 
                        Это примерная стоимость покупки такого же охвата через таргет ВКонтакте.
                    </span>
                </p>
            </div>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">3. Клики (с CTR)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Количество переходов по ссылкам в историях. Внизу карточки показывается CTR — процент кликов от просмотров.
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Иконка:</strong> Курсор с лучами (клик)</li>
                <li><strong>Значение:</strong> Число кликов</li>
                <li><strong>График:</strong> Линия кликов за период</li>
                <li><strong>CTR (справа внизу):</strong> Процент с одним знаком после запятой (например: 2.4%)</li>
                <li><strong>Расчёт CTR:</strong> (Клики / Просмотры) × 100</li>
                <li><strong>Цвета:</strong> Голубой (blue)</li>
            </ul>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">4. Активность (вовлечённость)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Суммарное количество активных действий: лайки + репосты + ответы. Внизу карточки — детализация по каждому типу.
            </p>

            <ul className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Иконка:</strong> Сердечко</li>
                <li><strong>Значение:</strong> Общая сумма активности</li>
                <li><strong>Детализация:</strong>
                    <ul>
                        <li>Лайки (розовая точка)</li>
                        <li>Репосты (фиолетовая точка)</li>
                        <li>Ответы (синяя точка)</li>
                    </ul>
                </li>
                <li><strong>Цвета:</strong> Розовый (pink)</li>
            </ul>

            <Sandbox
                title="Пример карточек метрик"
                description="Так выглядят основные карточки дашборда с разными показателями."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MockMetricCard
                        title="Сумма показов"
                        value="12,345"
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        bgColor="bg-white"
                        iconColor="bg-indigo-50"
                        valueColor="text-indigo-900"
                        showGraph={true}
                        graphColor="text-indigo-500"
                    />
                    
                    <MockMetricCard
                        title="Эквивалент в рекламе"
                        value="1,850 ₽"
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        bgColor="bg-white"
                        iconColor="bg-emerald-50"
                        valueColor="text-emerald-600"
                    />
                </div>
            </Sandbox>

            <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Нижний ряд (мини-карточки)</h3>

            <p className="!text-base !leading-relaxed !text-gray-700">
                В самом низу дашборда находятся 4 маленькие карточки с дополнительными метриками:
            </p>

            <ol className="!text-base !leading-relaxed !text-gray-700">
                <li><strong>Историй</strong> — количество историй в выборке (с иконкой архива, индиго цвет)</li>
                <li><strong>Новых подписок</strong> — сколько людей подписались через истории (оранжевая иконка пользователя с плюсом)</li>
                <li><strong>Скрытий</strong> — сколько раз пользователи скрыли истории (серая иконка перечёркнутого круга)</li>
                <li><strong>ER View</strong> — уровень вовлечённости (процент, градиент индиго, иконка графика вверх)</li>
            </ol>

            <p className="!text-base !leading-relaxed !text-gray-700">
                <strong>ER View</strong> (Engagement Rate View) — это процент вовлечённости на просмотр. 
                Расчёт: (Лайки + Репосты + Ответы) / Просмотры × 100. Чем выше процент, тем лучше контент цепляет аудиторию.
            </p>
        </>
    );
};
