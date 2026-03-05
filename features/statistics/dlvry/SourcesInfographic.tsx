/**
 * Инфографика по источникам заказов DLVRY.
 * Бенто-сетка карточек в стиле Stories Dashboard (rounded-3xl, hover-рамка, подметрики).
 * Сводная карточка с горизонтальным stacked bar + 4 карточки по источникам.
 * Без внешних зависимостей — чистый React + Tailwind + SVG.
 */

import React, { useMemo } from 'react';
import { formatMoney } from './dlvryFormatUtils';

/** Компактное форматирование: 696 тыс. ₽ / 2,56 млн ₽ */
function formatCompact(value: number): string {
    if (value >= 1_000_000) {
        const m = value / 1_000_000;
        // Если ровные миллионы — без дробной части
        return m % 1 === 0 ? `${m} млн` : `${m.toFixed(2).replace('.', ',')} млн`;
    }
    if (value >= 1_000) {
        const k = Math.round(value / 1_000);
        return `${new Intl.NumberFormat('ru-RU').format(k)} тыс.`;
    }
    return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

// ─── Типы ────────────────────────────────────────────────────────────────────

interface SourceTotals {
    source_site: number;
    sum_source_site: number;
    source_vkapp: number;
    sum_source_vkapp: number;
    source_ios: number;
    sum_source_ios: number;
    source_android: number;
    sum_source_android: number;
    orders: number;
    revenue: number;
}

interface SourcesInfographicProps {
    /** Агрегированные итоги по источникам (из totals в SalesTabContent) */
    totals: SourceTotals | null;
    /** Загрузка данных */
    isLoading: boolean;
}

// ─── Конфигурация источников ─────────────────────────────────────────────────

interface SourceDef {
    key: string;
    label: string;
    icon: React.ReactNode;
    /** Цвет сегмента stacked bar */
    color: string;
    /** Tailwind-класс для крупного числа */
    numberClass: string;
    /** Tailwind-класс для иконки */
    iconClass: string;
    /** Tailwind-класс для фона иконки */
    iconBgClass: string;
    /** Tailwind-класс для hover-бордера */
    hoverBorderClass: string;
    /** Tailwind-класс для прогресс-бара */
    barClass: string;
    /** Tailwind-класс для бейджа */
    badgeBg: string;
    badgeText: string;
    /** Tailwind-класс для цветной точки */
    dotClass: string;
}

const SOURCES: SourceDef[] = [
    {
        key: 'vkapp',
        label: 'VK Mini App',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.188 1.368 1.259 2.183 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.248.998-1.33 1.398-2.143 1.273-2.49-.119-.332-.852-.244-.852-.244l-2.449.015s-.182-.025-.316.056c-.131.079-.215.263-.215.263s-.386 1.029-.9 1.904c-1.086 1.846-1.52 1.943-1.697 1.828-.413-.268-.31-1.075-.31-1.649 0-1.793.272-2.54-.529-2.735-.266-.065-.462-.107-1.141-.114-.872-.01-1.61.003-2.028.208-.278.136-.492.44-.362.457.161.022.527.099.72.363.25.341.24 1.11.24 1.11s.143 2.11-.334 2.372c-.327.18-.776-.187-1.74-1.868-.494-.86-.866-1.81-.866-1.81s-.072-.176-.2-.27c-.155-.114-.373-.15-.373-.15l-2.328.016s-.35.01-.478.162c-.114.135-.009.414-.009.414s1.815 4.244 3.87 6.383c1.883 1.962 4.023 1.834 4.023 1.834z"/>
            </svg>
        ),
        color: '#4C75A3',
        numberClass: 'text-blue-700',
        iconClass: 'text-blue-600',
        iconBgClass: 'bg-blue-50',
        hoverBorderClass: 'hover:border-blue-300',
        barClass: 'bg-blue-500',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        dotClass: 'bg-blue-500',
    },
    {
        key: 'site',
        label: 'Сайт',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
        color: '#6366F1',
        numberClass: 'text-indigo-700',
        iconClass: 'text-indigo-600',
        iconBgClass: 'bg-indigo-50',
        hoverBorderClass: 'hover:border-indigo-300',
        barClass: 'bg-indigo-500',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-700',
        dotClass: 'bg-indigo-500',
    },
    {
        key: 'ios',
        label: 'iOS',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
        ),
        color: '#374151',
        numberClass: 'text-gray-900',
        iconClass: 'text-gray-700',
        iconBgClass: 'bg-gray-100',
        hoverBorderClass: 'hover:border-gray-400',
        barClass: 'bg-gray-600',
        badgeBg: 'bg-gray-200',
        badgeText: 'text-gray-700',
        dotClass: 'bg-gray-600',
    },
    {
        key: 'android',
        label: 'Android',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.44-.65-3.06-1.01-4.76-1.01-1.7 0-3.32.36-4.76 1.01L5.08 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C2.86 11.3.86 14.43.86 18h22.28c0-3.57-2-6.7-4.94-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
            </svg>
        ),
        color: '#16A34A',
        numberClass: 'text-green-700',
        iconClass: 'text-green-600',
        iconBgClass: 'bg-green-50',
        hoverBorderClass: 'hover:border-green-300',
        barClass: 'bg-green-500',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700',
        dotClass: 'bg-green-500',
    },
];

// ─── Горизонтальный Stacked Bar ──────────────────────────────────────────────

interface StackedBarProps {
    segments: Array<{ value: number; color: string; label: string }>;
    height?: string;
}

const StackedBar: React.FC<StackedBarProps> = ({ segments, height = 'h-3' }) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return <div className={`w-full ${height} bg-gray-100 rounded-full`} />;

    return (
        <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden flex`}>
            {segments
                .filter(seg => seg.value > 0)
                .map((seg, i) => {
                    const pct = (seg.value / total) * 100;
                    return (
                        <div
                            key={seg.label}
                            className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                            style={{ width: `${pct}%`, backgroundColor: seg.color }}
                            title={`${seg.label}: ${pct.toFixed(1)}%`}
                        />
                    );
                })
            }
        </div>
    );
};

// ─── Основной компонент ──────────────────────────────────────────────────────

export const SourcesInfographic: React.FC<SourcesInfographicProps> = ({ totals, isLoading }) => {
    // Подготавливаем данные по источникам
    const sourceData = useMemo(() => {
        if (!totals) return [];
        return SOURCES.map(src => {
            const orders = (totals as any)[`source_${src.key}`] as number || 0;
            const revenue = (totals as any)[`sum_source_${src.key}`] as number || 0;
            const avgCheck = orders > 0 ? revenue / orders : 0;
            return { ...src, orders, revenue, avgCheck };
        });
    }, [totals]);

    // Общие числа
    const totalSourceOrders = useMemo(() => sourceData.reduce((s, d) => s + d.orders, 0), [sourceData]);
    const totalSourceRevenue = useMemo(() => sourceData.reduce((s, d) => s + d.revenue, 0), [sourceData]);

    // Скелетон загрузки
    if (isLoading && !totals) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm animate-pulse">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-3 bg-gray-200 rounded w-20" />
                            <div className="w-9 h-9 bg-gray-100 rounded-xl" />
                        </div>
                        <div className="h-7 bg-gray-200 rounded w-16 mb-3" />
                        <div className="h-2 bg-gray-100 rounded-full w-full mb-3" />
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-100 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!totals || totalSourceOrders === 0) return null;

    // Сортируем по заказам по убыванию (для визуальной иерархии)
    const sorted = [...sourceData].sort((a, b) => b.orders - a.orders);
    const maxOrders = sorted[0]?.orders || 1;
    const maxRevenue = sorted[0]?.revenue || 1;

    return (
        /* Одна строка: summary (28.5%) + 4 карточки источников (71.5%) */
        <div className="flex flex-col lg:flex-row gap-4">

            {/* ── Сводная карточка: Bar Race (28.5%) ──────────────────────── */}
            <div style={{ width: '28.5%' }} className="w-full lg:!w-[28.5%] bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:border-indigo-300 transition-colors flex flex-col shrink-0 max-lg:!w-full">
                {/* Шапка + тумблер на одной строке */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-500 text-sm font-semibold">Источники заказов</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
                            {formatCompact(totalSourceRevenue)} ₽
                            <span className="text-base font-medium text-gray-400 ml-2">· {totalSourceOrders} заказов</span>
                        </h3>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl shrink-0 flex items-center justify-center border border-gray-200">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                    </div>
                </div>

                {/* Bar Race + тумблер */}
                <BarRaceToggle
                    sorted={sorted}
                    totalOrders={totalSourceOrders}
                    totalRevenue={totalSourceRevenue}
                    maxOrders={maxOrders}
                    maxRevenue={maxRevenue}
                />
            </div>

            {/* ── 4 карточки источников (75%) ──────────────────────────── */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sorted.map(src => {
                const revenuePct = totalSourceRevenue > 0 ? ((src.revenue / totalSourceRevenue) * 100) : 0;

                return (
                    <div
                        key={src.key}
                        className={`bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col transition-colors ${src.hoverBorderClass}`}
                    >
                        {/* Иконка + название */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-10 h-10 ${src.iconBgClass} rounded-xl flex items-center justify-center border border-gray-200 ${src.iconClass}`}>
                                {src.icon}
                            </div>
                            <p className="text-gray-500 text-xs font-semibold">{src.label}</p>
                        </div>

                        {/* Основная метрика: выручка */}
                        <h3 className={`text-xl font-bold ${src.numberClass} mb-1`}>{formatCompact(src.revenue)} ₽</h3>

                        {/* Доля выручки */}
                        <p className={`text-sm font-semibold ${src.numberClass} mb-2`}>
                            {revenuePct.toFixed(1)}% <span className="text-gray-400 font-normal text-xs">от выручки</span>
                        </p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${src.barClass}`}
                                style={{ width: `${revenuePct}%` }}
                            />
                        </div>

                        {/* Вторичные метрики */}
                        <div className="space-y-1 mt-auto text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Заказов</span>
                                <span className="font-bold text-gray-900">{src.orders}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Ср. чек</span>
                                <span className="font-bold text-gray-900">{formatMoney(Math.round(src.avgCheck))} ₽</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};

// ─── Bar Race с переключателем заказы/выручка ────────────────────────────────

interface BarRaceSource {
    key: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    dotClass: string;
    iconClass: string;
    numberClass: string;
    orders: number;
    revenue: number;
    avgCheck: number;
}

interface BarRaceToggleProps {
    sorted: BarRaceSource[];
    totalOrders: number;
    totalRevenue: number;
    maxOrders: number;
    maxRevenue: number;
}

const BarRaceToggle: React.FC<BarRaceToggleProps> = ({ sorted, totalOrders, totalRevenue, maxOrders, maxRevenue }) => {
    const [mode, setMode] = React.useState<'orders' | 'revenue'>('revenue');

    return (
        <div className="flex-1 flex flex-col">
            {/* Тумблер над барами */}
            <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-0.5 self-start">
                <button
                    onClick={() => setMode('revenue')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        mode === 'revenue'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Выручка
                </button>
                <button
                    onClick={() => setMode('orders')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        mode === 'orders'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Заказы
                </button>
            </div>

            {/* Bar Race — горизонтальные бары */}
            <div className="space-y-3 flex-1">
                {sorted.map(src => {
                    const value = mode === 'orders' ? src.orders : src.revenue;
                    const total = mode === 'orders' ? totalOrders : totalRevenue;
                    const max = mode === 'orders' ? maxOrders : maxRevenue;
                    const pct = total > 0 ? ((value / total) * 100) : 0;
                    const barWidth = max > 0 ? ((value / max) * 100) : 0;
                    const display = mode === 'orders' ? String(src.orders) : `${formatMoney(src.revenue)} ₽`;

                    return (
                        <div key={src.key}>
                            {/* Название + значение + процент */}
                            <div className="flex items-center justify-between mb-1 min-w-0">
                                <span className="flex items-center gap-1.5 text-xs text-gray-700 font-medium truncate">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${src.dotClass}`} />
                                    {src.label}
                                </span>
                                <span className="text-xs tabular-nums whitespace-nowrap ml-2">
                                    <span className="font-bold text-gray-900">{display}</span>
                                    <span className="text-gray-400 ml-1.5">{pct.toFixed(1)}%</span>
                                </span>
                            </div>
                            {/* Горизонтальный бар (ширина относительно макс.) */}
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${barWidth}%`, backgroundColor: src.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
