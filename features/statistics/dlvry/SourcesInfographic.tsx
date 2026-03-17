/**
 * Инфографика по источникам заказов DLVRY — ХАБ-контейнер.
 * Бенто-сетка карточек: сводная (Bar Race) + 4 карточки по источникам.
 *
 * Логика и подкомпоненты вынесены:
 *   sourcesTypes.ts    — типы
 *   sourcesConfig.tsx   — SOURCES[] (SVG + Tailwind)
 *   BarRaceToggle.tsx  — переключатель заказы/выручка
 *   StackedBar.tsx     — горизонтальный stacked bar
 */

import React, { useMemo } from 'react';
import { formatMoney, formatCompact } from './dlvryFormatUtils';
import type { SourcesInfographicProps } from './sourcesTypes';
import { SOURCES } from './sourcesConfig';
import { BarRaceToggle } from './BarRaceToggle';

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
                            <span className="text-sm font-normal text-gray-500 ml-3">Заказов <span className="font-bold text-gray-900">{totalSourceOrders}</span></span>
                            <span className="text-sm font-normal text-gray-500 ml-3">Средний чек <span className="font-bold text-gray-900">{formatMoney(Math.round(totalSourceRevenue / totalSourceOrders))} ₽</span></span>
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
