/**
 * Таб «Статистика продаж» — данные из DLVRY API.
 * Пресеты периодов (indigo pill-контейнер), чипы управления колонками, таблица.
 * Дизайн-система: indigo primary, gray secondary, chip-тоглы для групп колонок.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Project } from '../../../shared/types';
import { useDlvryDailyStats } from '../dlvry-stats/useDlvryDailyStats';
import { SalesAggregatedCards } from './SalesAggregatedCards';
import { SourcesInfographic } from './SourcesInfographic';
import { formatMoney, formatDateRu, plural } from './dlvryFormatUtils';
import { useToast } from '../../../shared/components/ToastProvider';
import { CustomDatePicker } from '../../../shared/components/pickers/CustomDatePicker';

interface SalesTabContentProps {
    project: Project;
}

// ─── Определение групп колонок ──────────────────────────────────────────────
type ColGroup = 'main' | 'finance' | 'payment' | 'sources' | 'delivery' | 'repeat';

interface ColGroupDef {
    key: ColGroup;
    label: string;
}

const COLUMN_GROUPS: ColGroupDef[] = [
    { key: 'main', label: 'Основное' },
    { key: 'finance', label: 'Финансы' },
    { key: 'payment', label: 'Оплата' },
    { key: 'sources', label: 'Источники' },
    { key: 'delivery', label: 'Доставка' },
    { key: 'repeat', label: 'Повторные заказы' },
];

// ─── Пресеты периодов ───────────────────────────────────────────────────────
type PeriodPreset = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom' | 'year_month' | null;

const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
    { key: null, label: 'Всё время' },
    { key: 'today', label: 'Сегодня' },
    { key: 'yesterday', label: 'Вчера' },
    { key: 'this_week', label: 'Эта неделя' },
    { key: 'last_week', label: 'Пр. неделя' },
    { key: 'this_month', label: 'Этот месяц' },
    { key: 'last_month', label: 'Пр. месяц' },
    { key: 'this_quarter', label: 'Этот квартал' },
    { key: 'last_quarter', label: 'Пр. квартал' },
    { key: 'this_year', label: 'Этот год' },
    { key: 'last_year', label: 'Пр. год' },
    { key: 'year_month', label: 'По месяцам' },
    { key: 'custom', label: 'Свой период' },
];

const MONTH_NAMES_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

/** Диапазон доступных годов: от 2017 до текущего */
function getAvailableYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current; y >= 2017; y--) years.push(y);
    return years;
}

/** Вычисляет локальную дату в формате YYYY-MM-DD (без сдвига UTC) */
function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

export const SalesTabContent: React.FC<SalesTabContentProps> = ({ project }) => {
    // Вычисляем начальные даты «Этот месяц» синхронно — чтобы первый fetch уже с фильтром
    const [initialDates] = useState(() => {
        const now = new Date();
        return {
            from: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
            to: localDateStr(now),
        };
    });

    const {
        days,
        aggregated,
        isLoading,
        isLoadingMore,
        hasMore,
        totalCount,
        isSyncing,
        error,
        lastSyncResult,
        dateFrom,
        dateTo,
        setDateFrom,
        setDateTo,
        syncFromApi,
        loadMore,
        fullSyncProgress,
        availableMonths,
    } = useDlvryDailyStats({
        projectId: project.id,
        initialDateFrom: initialDates.from,
        initialDateTo: initialDates.to,
    });

    const toast = useToast();
    const tableScrollRef = useRef<HTMLDivElement>(null);

    // ─── Infinite scroll: подгрузка при скролле к низу таблицы ──────────
    useEffect(() => {
        const container = tableScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!hasMore || isLoadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Подгружаем когда до конца осталось < 200px
            if (scrollHeight - scrollTop - clientHeight < 200) {
                loadMore();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, loadMore]);

    // ─── Пресеты периодов ───────────────────────────────────────────────
    const [activePreset, setActivePreset] = useState<PeriodPreset>('this_month');
    // Стейт для режима «По месяцам»
    const [ymYear, setYmYear] = useState(() => new Date().getFullYear());
    const [ymMonth, setYmMonth] = useState(() => new Date().getMonth()); // 0-based
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    // Закрытие кастомного дропдауна года при клике вне
    useEffect(() => {
        if (!yearDropdownOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
                setYearDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [yearDropdownOpen]);

    /** Применяет диапазон дат для выбранного года+месяца */
    const applyYearMonth = useCallback((year: number, month: number) => {
        const today = new Date();
        const from = new Date(year, month, 1);
        // Если текущий месяц текущего года — до сегодня, иначе до конца месяца
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const to = isCurrentMonth ? today : new Date(year, month + 1, 0);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo]);

    /** Вычисляет даты для пресета и применяет */
    const applyPreset = useCallback((preset: PeriodPreset) => {
        if (preset === 'custom' || preset === null || preset === 'year_month') {
            setActivePreset(preset);
            if (preset === null) { setDateFrom(''); setDateTo(''); }
            if (preset === 'year_month') {
                // При переключении на «По месяцам» — применяем текущий выбранный год+месяц
                applyYearMonth(ymYear, ymMonth);
            }
            return;
        }
        const today = new Date();
        let from: Date;
        let to: Date = today;

        switch (preset) {
            case 'today':
                from = today;
                break;
            case 'yesterday': {
                const y = new Date(today); y.setDate(y.getDate() - 1);
                from = y; to = y;
                break;
            }
            case 'this_week': {
                const dow = today.getDay() || 7;
                from = new Date(today); from.setDate(today.getDate() - dow + 1);
                break;
            }
            case 'last_week': {
                const dow = today.getDay() || 7;
                to = new Date(today); to.setDate(today.getDate() - dow);
                from = new Date(to); from.setDate(to.getDate() - 6);
                break;
            }
            case 'this_month':
                from = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_month':
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'this_quarter': {
                const qm = Math.floor(today.getMonth() / 3) * 3;
                from = new Date(today.getFullYear(), qm, 1);
                break;
            }
            case 'last_quarter': {
                const qm = Math.floor(today.getMonth() / 3) * 3;
                from = new Date(today.getFullYear(), qm - 3, 1);
                to = new Date(today.getFullYear(), qm, 0);
                break;
            }
            case 'this_year':
                from = new Date(today.getFullYear(), 0, 1);
                break;
            case 'last_year':
                from = new Date(today.getFullYear() - 1, 0, 1);
                to = new Date(today.getFullYear() - 1, 11, 31);
                break;
            default:
                from = today;
        }
        setActivePreset(preset);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo, applyYearMonth, ymYear, ymMonth]);

    // При первом рендере применяем пресет «Этот месяц»
    useEffect(() => {
        applyPreset('this_month');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Чипы управления колонками ────────────────────────────────────
    const [activeGroups, setActiveGroups] = useState<Set<ColGroup>>(new Set(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat']));

    const toggleGroup = useCallback((g: ColGroup) => {
        setActiveGroups(prev => {
            const next = new Set(prev);
            if (next.has(g)) next.delete(g);
            else next.add(g);
            // «Основное» всегда включена
            next.add('main');
            return next;
        });
    }, []);

    // ─── Подсчёт итогов по всем полям ────────────────────────────────────
    const totals = useMemo(() => {
        if (days.length === 0) return null;
        const t = {
            orders: 0, revenue: 0, avg_check: 0, first_orders: 0, unique_clients: 0,
            canceled: 0, canceled_sum: 0, cost: 0, discount: 0,
            first_orders_sum: 0, first_orders_cost: 0,
            count_payment_cash: 0, sum_cash: 0,
            count_payment_card: 0, sum_card: 0,
            count_payment_online: 0, sum_online_success: 0, sum_online_fail: 0,
            source_vkapp: 0, sum_source_vkapp: 0,
            source_site: 0, sum_source_site: 0,
            source_ios: 0, sum_source_ios: 0,
            source_android: 0, sum_source_android: 0,
            delivery_count: 0, delivery_sum: 0,
            delivery_self_count: 0, delivery_self_sum: 0,
            repeat_order_2: 0, repeat_order_3: 0, repeat_order_4: 0, repeat_order_5: 0,
        };
        for (const d of days) {
            t.orders += d.orders_count || 0;
            t.revenue += d.revenue || 0;
            t.first_orders += d.first_orders || 0;
            t.unique_clients += d.unique_clients || 0;
            t.canceled += d.canceled || 0;
            t.canceled_sum += d.canceled_sum || 0;
            t.cost += d.cost || 0;
            t.discount += d.discount || 0;
            t.first_orders_sum += d.first_orders_sum || 0;
            t.first_orders_cost += d.first_orders_cost || 0;
            t.count_payment_cash += d.count_payment_cash || 0;
            t.sum_cash += d.sum_cash || 0;
            t.count_payment_card += d.count_payment_card || 0;
            t.sum_card += d.sum_card || 0;
            t.count_payment_online += d.count_payment_online || 0;
            t.sum_online_success += d.sum_online_success || 0;
            t.sum_online_fail += d.sum_online_fail || 0;
            t.source_vkapp += d.source_vkapp || 0;
            t.sum_source_vkapp += d.sum_source_vkapp || 0;
            t.source_site += d.source_site || 0;
            t.sum_source_site += d.sum_source_site || 0;
            t.source_ios += d.source_ios || 0;
            t.sum_source_ios += d.sum_source_ios || 0;
            t.source_android += d.source_android || 0;
            t.sum_source_android += d.sum_source_android || 0;
            t.delivery_count += d.delivery_count || 0;
            t.delivery_sum += d.delivery_sum || 0;
            t.delivery_self_count += d.delivery_self_count || 0;
            t.delivery_self_sum += d.delivery_self_sum || 0;
            t.repeat_order_2 += d.repeat_order_2 || 0;
            t.repeat_order_3 += d.repeat_order_3 || 0;
            t.repeat_order_4 += d.repeat_order_4 || 0;
            t.repeat_order_5 += d.repeat_order_5 || 0;
        }
        t.avg_check = t.orders > 0 ? t.revenue / t.orders : 0;
        return t;
    }, [days]);

    const handleSync = useCallback(async () => {
        await syncFromApi(false);
    }, [syncFromApi]);

    const handleFullSync = useCallback(async () => {
        await syncFromApi(true);
        // Прогресс и данные обновляются потоково через fullSyncProgress
    }, [syncFromApi]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* ─── Кнопки + карточки ──────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Дозапись новых данных из DLVRY"
                        >
                            <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isSyncing ? 'Синхронизация...' : 'Обновить данные'}
                        </button>
                        <button
                            onClick={handleFullSync}
                            disabled={isSyncing}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                            title="Полная пересинхронизация за всё время"
                        >
                            Полная загрузка
                        </button>
                        {/* ── Прогресс стриминга ── */}
                        {fullSyncProgress && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium animate-pulse whitespace-nowrap">
                                {fullSyncProgress.done ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-green-600">
                                            Готово · {fullSyncProgress.synced_days} {plural(fullSyncProgress.synced_days, ['день', 'дня', 'дней'])} · {(fullSyncProgress.total_orders ?? 0).toLocaleString()} заказов · {formatMoney(fullSyncProgress.total_revenue ?? 0)} ₽
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Чанк {fullSyncProgress.chunk} · {fullSyncProgress.synced_days} дн · {(fullSyncProgress.total_orders ?? 0).toLocaleString()} заказов · {formatMoney(fullSyncProgress.total_revenue ?? 0)} ₽
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">Обновляется автоматически раз в сутки</span>
                </div>



                {/* Выбор периода — pill-контейнер */}
                <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Период:</span>
                    <div className="flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-x-auto custom-scrollbar">
                        {PERIOD_PRESETS.map(p => (
                            <button
                                key={String(p.key)}
                                onClick={() => applyPreset(p.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                    activePreset === p.key
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Режим «По месяцам» — выбор года + 12 месяцев */}
                    {activePreset === 'year_month' && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Кастомный дропдаун года */}
                            <div ref={yearDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setYearDropdownOpen(prev => !prev)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all duration-200"
                                >
                                    {ymYear}
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {yearDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-50 min-w-[90px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                        {getAvailableYears().map(y => (
                                            <button
                                                key={y}
                                                type="button"
                                                onClick={() => {
                                                    setYmYear(y);
                                                    setYearDropdownOpen(false);
                                                    const today = new Date();
                                                    let m = ymMonth;
                                                    if (y === today.getFullYear() && m > today.getMonth()) {
                                                        m = today.getMonth();
                                                        setYmMonth(m);
                                                    }
                                                    applyYearMonth(y, m);
                                                }}
                                                className={`w-full px-3 py-1.5 text-xs font-medium text-left transition-colors duration-150 ${
                                                    y === ymYear
                                                        ? 'bg-indigo-50 text-indigo-700'
                                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                            >
                                                {y}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* 12 месяцев — pill-кнопки */}
                            <div className="flex p-0.5 bg-gray-100 rounded-lg gap-0.5">
                                {MONTH_NAMES_SHORT.map((name, idx) => {
                                    const today = new Date();
                                    const isFuture = ymYear === today.getFullYear() && idx > today.getMonth();
                                    const hasData = availableMonths.has(`${ymYear}-${idx + 1}`);
                                    const isDisabled = isFuture || !hasData;
                                    return (
                                        <button
                                            key={idx}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                setYmMonth(idx);
                                                applyYearMonth(ymYear, idx);
                                            }}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                                isDisabled
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : ymMonth === idx
                                                        ? 'bg-white text-indigo-700 shadow-sm'
                                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                        >
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Кастомный период — date-инпуты */}
                    {activePreset === 'custom' && (
                        <div className="flex items-center gap-2">
                            <CustomDatePicker
                                value={dateFrom}
                                onChange={val => setDateFrom(val)}
                                placeholder="Начало"
                                className="text-xs"
                            />
                            <span className="text-gray-400 text-xs">—</span>
                            <CustomDatePicker
                                value={dateTo}
                                onChange={val => setDateTo(val)}
                                placeholder="Конец"
                                className="text-xs"
                            />
                        </div>
                    )}
                </div>

                {/* Карточки агрегатов */}
                <SalesAggregatedCards aggregated={aggregated} isLoading={isLoading} />

                {/* ── Инфографика источников заказов ─────────────────────── */}
                <div className="mt-4">
                    <SourcesInfographic totals={totals} isLoading={isLoading} />
                </div>
            </div>

            {/* ─── Фильтры: колонки ──────────────────────────────────────── */}
            <div className="flex-shrink-0 px-6 py-3 bg-gray-50/50 border-b border-gray-200">
                <div className="flex flex-col gap-3">
                    {/* Чипы групп колонок */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Колонки:</span>
                        {COLUMN_GROUPS.map(g => (
                            <button
                                key={g.key}
                                onClick={() => toggleGroup(g.key)}
                                disabled={g.key === 'main'}
                                className={`px-3 py-1 text-xs font-medium rounded-md border transition-all duration-200 whitespace-nowrap ${
                                    activeGroups.has(g.key)
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700'
                                } ${g.key === 'main' ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ошибка загрузки */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}

            {/* ─── Таблица дневной статистики ──────────────────────────────── */}
            <div ref={tableScrollRef} className="flex-1 overflow-auto px-6 py-4 custom-scrollbar">
                {isLoading && days.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="loader w-8 h-8 border-t-indigo-500" />
                    </div>
                ) : days.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm mb-2">Данных пока нет</p>
                        <p className="text-xs text-gray-400 mb-4">Нажмите «Обновить данные» чтобы загрузить статистику из DLVRY</p>
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {isSyncing ? 'Загрузка...' : 'Загрузить данные'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-max text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left whitespace-nowrap">
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Дата</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Заказов</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Выручка</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Ср. чек</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Новые</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Уник.</th>
                                    {activeGroups.has('finance') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200" title="Отмены">Отмен</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Сумма отмен">Σ отмен</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Себест.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Скидки</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Выручка 1-х заказов">Σ нов.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Себестоимость 1-х заказов">Себ. нов.</th>
                                    </>}
                                    {activeGroups.has('payment') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200" title="Наличные">Нал</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Картой">Карта</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Онлайн-оплата">Онлайн</th>
                                    </>}
                                    {activeGroups.has('sources') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200">VK</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Сайт</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">iOS</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Android</th>
                                    </>}
                                    {activeGroups.has('delivery') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200" title="Доставка">Дост.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Самовывоз">Самов.</th>
                                    </>}
                                    {activeGroups.has('repeat') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200" title="2-й заказ">×2</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="3-й заказ">×3</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="4-й заказ">×4</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="5+ заказов">×5+</th>
                                    </>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {days.map(day => (
                                    <tr key={day.date} className="hover:bg-gray-50 transition-colors whitespace-nowrap">
                                        <td className="px-3 py-2.5 text-gray-700 font-medium sticky left-0 bg-white z-10 border-r border-gray-100">{formatDateRu(day.date)}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-900 font-semibold">{day.orders_count}</td>
                                        <td className="px-3 py-2.5 text-right text-indigo-600 font-semibold">{formatMoney(day.revenue)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{formatMoney(day.avg_check)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-green-600">{day.first_orders > 0 ? `+${day.first_orders}` : '—'}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{day.unique_clients || '—'}</td>
                                        {activeGroups.has('finance') && <>
                                            <td className="px-3 py-2.5 text-right text-red-500 border-l border-gray-100">{day.canceled > 0 ? day.canceled : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-red-500">{day.canceled_sum > 0 ? `${formatMoney(day.canceled_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.cost > 0 ? `${formatMoney(day.cost)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.discount > 0 ? `${formatMoney(day.discount)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-600">{day.first_orders_sum > 0 ? `${formatMoney(day.first_orders_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-600">{day.first_orders_cost > 0 ? `${formatMoney(day.first_orders_cost)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('payment') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">
                                                {day.count_payment_cash > 0 ? <>{day.count_payment_cash} <span className="text-gray-400">/</span> {formatMoney(day.sum_cash)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.count_payment_card > 0 ? <>{day.count_payment_card} <span className="text-gray-400">/</span> {formatMoney(day.sum_card)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.count_payment_online > 0 ? (
                                                    <>{day.count_payment_online} <span className="text-gray-400">/</span> {formatMoney(day.sum_online_success)}₽
                                                    {day.sum_online_fail > 0 && <span className="text-red-400 text-xs ml-0.5">(−{formatMoney(day.sum_online_fail)})</span>}</>
                                                ) : '—'}
                                            </td>
                                        </>}
                                        {activeGroups.has('sources') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">
                                                {day.source_vkapp > 0 ? <>{day.source_vkapp} <span className="text-gray-400">/</span> {formatMoney(day.sum_source_vkapp)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.source_site > 0 ? <>{day.source_site} <span className="text-gray-400">/</span> {formatMoney(day.sum_source_site)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.source_ios > 0 ? <>{day.source_ios} <span className="text-gray-400">/</span> {formatMoney(day.sum_source_ios)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.source_android > 0 ? <>{day.source_android} <span className="text-gray-400">/</span> {formatMoney(day.sum_source_android)}₽</> : '—'}
                                            </td>
                                        </>}
                                        {activeGroups.has('delivery') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">
                                                {day.delivery_count > 0 ? <>{day.delivery_count} <span className="text-gray-400">/</span> {formatMoney(day.delivery_sum)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.delivery_self_count > 0 ? <>{day.delivery_self_count} <span className="text-gray-400">/</span> {formatMoney(day.delivery_self_sum)}₽</> : '—'}
                                            </td>
                                        </>}
                                        {activeGroups.has('repeat') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-500 border-l border-gray-100">{day.repeat_order_2 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_3 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_4 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_5 || '—'}</td>
                                        </>}
                                    </tr>
                                ))}
                            </tbody>
                            {totals && (
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold text-xs whitespace-nowrap border-t border-gray-200">
                                        <td className="px-3 py-2.5 text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                            {hasMore
                                ? `Итого (${days.length} из ${totalCount} ${plural(totalCount, ['дня', 'дней', 'дней'])})`
                                : `Итого — ${plural(totalCount, ['день', 'дня', 'дней'])}`}
                        </td>
                                        <td className="px-3 py-2.5 text-right text-gray-900">{totals.orders}</td>
                                        <td className="px-3 py-2.5 text-right text-indigo-600">{formatMoney(totals.revenue)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{formatMoney(totals.avg_check)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-green-600">+{totals.first_orders}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{totals.unique_clients || '—'}</td>
                                        {activeGroups.has('finance') && <>
                                            <td className="px-3 py-2.5 text-right text-red-500 border-l border-gray-100">{totals.canceled || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-red-500">{totals.canceled_sum > 0 ? `${formatMoney(totals.canceled_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.cost > 0 ? `${formatMoney(totals.cost)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.discount > 0 ? `${formatMoney(totals.discount)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-600">{totals.first_orders_sum > 0 ? `${formatMoney(totals.first_orders_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-600">{totals.first_orders_cost > 0 ? `${formatMoney(totals.first_orders_cost)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('payment') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">{totals.count_payment_cash > 0 ? `${totals.count_payment_cash} / ${formatMoney(totals.sum_cash)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.count_payment_card > 0 ? `${totals.count_payment_card} / ${formatMoney(totals.sum_card)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.count_payment_online > 0 ? `${totals.count_payment_online} / ${formatMoney(totals.sum_online_success)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('sources') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">{totals.source_vkapp > 0 ? `${totals.source_vkapp} / ${formatMoney(totals.sum_source_vkapp)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.source_site > 0 ? `${totals.source_site} / ${formatMoney(totals.sum_source_site)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.source_ios > 0 ? `${totals.source_ios} / ${formatMoney(totals.sum_source_ios)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.source_android > 0 ? `${totals.source_android} / ${formatMoney(totals.sum_source_android)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('delivery') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">{totals.delivery_count > 0 ? `${totals.delivery_count} / ${formatMoney(totals.delivery_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.delivery_self_count > 0 ? `${totals.delivery_self_count} / ${formatMoney(totals.delivery_self_sum)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('repeat') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-500 border-l border-gray-100">{totals.repeat_order_2 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.repeat_order_3 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.repeat_order_4 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.repeat_order_5 || '—'}</td>
                                        </>}
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                        </div>
                        {/* ── Infinite scroll: индикатор подгрузки ── */}
                        {isLoadingMore && (
                            <div className="flex items-center justify-center py-4 gap-2">
                                <div className="loader w-5 h-5 border-t-indigo-500" />
                                <span className="text-xs text-gray-500">Загрузка...</span>
                            </div>
                        )}
                        {days.length > 0 && (
                            <div className="text-center py-2 text-xs text-gray-400">
                                Показано {days.length} из {totalCount} {plural(totalCount, ['записи', 'записей', 'записей'])}
                                {hasMore && !isLoadingMore && (
                                    <button onClick={loadMore} className="ml-2 text-indigo-500 hover:text-indigo-700 font-medium">
                                        Загрузить ещё
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
