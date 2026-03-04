import React from 'react';
import { Sandbox } from '../shared';
import { MockFilterButton } from './ProductsStoriesDashboardPage_MockComponents';

// =====================================================================
// Раздел 1: Система фильтров дашборда
// =====================================================================

/** Пропсы секции фильтров — интерактивное демо */
interface FiltersSectionProps {
    periodFilter: string;
    setPeriodFilter: (value: string) => void;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
    periodFilter,
    setPeriodFilter,
    typeFilter,
    setTypeFilter,
}) => (
    <>
        {/* РАЗДЕЛ 1: СИСТЕМА ФИЛЬТРОВ */}
        <hr className="!my-10" />
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">1. Система фильтров</h2>
        
        <p className="!text-base !leading-relaxed !text-gray-700">
            В верхней части дашборда расположены два фильтра, которые работают вместе и мгновенно обновляют все карточки и графики.
        </p>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Фильтр по периоду времени</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Позволяет выбрать временной диапазон для анализа. Доступны 6 вариантов:
        </p>

        <div className="not-prose">
            <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">Все истории</span> — показывает статистику за всё время без ограничений
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">За неделю</span> — последние 7 дней (удобно для анализа текущей недели)
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">За месяц</span> — последние 30 дней (для ежемесячных отчётов)
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">За квартал</span> — последние 90 дней (квартальная аналитика)
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">За год</span> — последние 365 дней (годовая статистика)
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">Свой период</span> — при выборе появляются два поля для выбора даты начала и конца. 
                        Можно выбрать любой произвольный диапазон (например, с 1 по 15 марта)
                    </div>
                </li>
            </ul>
        </div>

        <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Фильтр по типу историй</h3>
        <p className="!text-base !leading-relaxed !text-gray-700">
            Позволяет разделить статистику по способу публикации. Доступны 3 варианта:
        </p>

        <div className="not-prose">
            <ul className="space-y-2 mt-4">
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">Все истории</span> — показывает суммарную статистику (и автоматические, и ручные)
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">Вручную</span> — только истории, опубликованные без автоматизации
                    </div>
                </li>
                <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 mt-1">•</span>
                    <div>
                        <span className="font-semibold">Наш сервис</span> — только истории, опубликованные через автоматизацию из товаров
                    </div>
                </li>
            </ul>
        </div>

        {/* Интерактивная демонстрация фильтров */}
        <Sandbox
            title="Попробуйте фильтры"
            description="Переключайте фильтры и наблюдайте, как меняется отображение выбранных параметров."
            instructions={[
                "Нажимайте на кнопки <strong>фильтра периода</strong> — активная подсвечивается фиолетовым фоном",
                "Нажимайте на кнопки <strong>фильтра типа</strong> — активная становится тёмно-фиолетовой с тенью"
            ]}
        >
            <div className="space-y-4">
                {/* Фильтр периода */}
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Период:</p>
                    <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-gray-200">
                        {[
                            { value: 'all', label: 'Все истории' },
                            { value: 'week', label: 'За неделю' },
                            { value: 'month', label: 'За месяц' },
                            { value: 'quarter', label: 'За квартал' },
                            { value: 'year', label: 'За год' },
                            { value: 'custom', label: 'Свой период' }
                        ].map(opt => (
                            <MockFilterButton
                                key={opt.value}
                                label={opt.label}
                                active={periodFilter === opt.value}
                                onClick={() => setPeriodFilter(opt.value)}
                                variant="period"
                            />
                        ))}
                    </div>
                    {periodFilter === 'custom' && (
                        <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 animate-fade-in-up">
                            <input type="date" className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50" />
                            <span className="text-gray-300">—</span>
                            <input type="date" className="px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50" />
                        </div>
                    )}
                </div>

                {/* Фильтр типа */}
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Тип:</p>
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                        {[
                            { value: 'all', label: 'Все истории' },
                            { value: 'manual', label: 'Вручную' },
                            { value: 'auto', label: 'Наш сервис' }
                        ].map(opt => (
                            <MockFilterButton
                                key={opt.value}
                                label={opt.label}
                                active={typeFilter === opt.value}
                                onClick={() => setTypeFilter(opt.value)}
                                variant="type"
                            />
                        ))}
                    </div>
                </div>

                {/* Информация о выбранных фильтрах */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold">Выбрано:</span> {
                            periodFilter === 'all' ? 'Все истории' :
                            periodFilter === 'week' ? 'За неделю' :
                            periodFilter === 'month' ? 'За месяц' :
                            periodFilter === 'quarter' ? 'За квартал' :
                            periodFilter === 'year' ? 'За год' :
                            'Свой период'
                        } + {
                            typeFilter === 'all' ? 'Все типы' :
                            typeFilter === 'manual' ? 'Вручную' :
                            'Наш сервис'
                        }
                    </p>
                </div>
            </div>
        </Sandbox>
    </>
);
