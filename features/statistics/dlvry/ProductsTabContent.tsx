/**
 * Таб «Товары» — аналитика продаж по товарам.
 * Агрегированная таблица: товар, количество продаж, выручка, средняя цена.
 * Фильтрация по периоду, поиск по названию.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Project } from '../../../shared/types';
import { useDlvryProducts } from './useDlvryProducts';
import { SalesPeriodSelector } from './SalesPeriodSelector';
import { formatMoney } from './dlvryFormatUtils';
import { PeriodPreset, localDateStr } from './salesTabConstants';
import {
    DlvryProductAnalytics,
    DlvryRelatedProduct,
    fetchDlvryProductRelated,
} from '../../../services/api/dlvry.api';

interface ProductsTabContentProps {
    project: Project;
    affiliateId?: string | null;
}

export const ProductsTabContent: React.FC<ProductsTabContentProps> = ({ project, affiliateId }) => {
    // Даты текущего месяца
    const [defaultDateFrom] = useState(() => {
        const now = new Date();
        return localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    });
    const [defaultDateTo] = useState(() => localDateStr(new Date()));

    const {
        products,
        summary,
        total,
        isLoading,
        isLoadingMore,
        isSummaryLoading,
        hasMore,
        error,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortDir,
        setDateFrom,
        setDateTo,
        setSearch,
        setSortBy,
        toggleSortDir,
        refresh,
        loadMore,
    } = useDlvryProducts({ projectId: project.id, affiliateId, initialDateFrom: defaultDateFrom, initialDateTo: defaultDateTo });

    // ─── Infinite scroll ────────────────────────────────────────────
    const tableScrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = tableScrollRef.current;
        if (!container) return;
        const handleScroll = () => {
            if (!hasMore || isLoadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 200) loadMore();
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, loadMore]);

    // ─── Пресеты периодов ───────────────────────────────────────────
    const [activePreset, setActivePreset] = useState<PeriodPreset>('this_month');
    const [ymYear, setYmYear] = useState(() => new Date().getFullYear());
    const [ymMonth, setYmMonth] = useState(() => new Date().getMonth());
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    const [availableMonths] = useState<Set<string>>(() => {
        const set = new Set<string>();
        const now = new Date();
        for (let i = 0; i < 36; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            set.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
        }
        return set;
    });

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

    const applyYearMonth = useCallback((year: number, month: number) => {
        const today = new Date();
        const from = new Date(year, month, 1);
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const to = isCurrentMonth ? today : new Date(year, month + 1, 0);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo]);

    const applyPreset = useCallback((preset: PeriodPreset) => {
        if (preset === 'custom' || preset === 'year_month') {
            setActivePreset(preset);
            if (preset === 'year_month') applyYearMonth(ymYear, ymMonth);
            return;
        }
        if (preset === null) {
            setActivePreset(null);
            setDateFrom('');
            setDateTo('');
            return;
        }
        const today = new Date();
        let from: Date;
        let to: Date = today;
        switch (preset) {
            case 'today': from = today; break;
            case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); from = y; to = y; break; }
            case 'this_week': { const dow = today.getDay() || 7; from = new Date(today); from.setDate(today.getDate() - dow + 1); break; }
            case 'last_week': { const dow = today.getDay() || 7; to = new Date(today); to.setDate(today.getDate() - dow); from = new Date(to); from.setDate(to.getDate() - 6); break; }
            case 'this_month': from = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'last_month': from = new Date(today.getFullYear(), today.getMonth() - 1, 1); to = new Date(today.getFullYear(), today.getMonth(), 0); break;
            case 'this_quarter': { const qm = Math.floor(today.getMonth() / 3) * 3; from = new Date(today.getFullYear(), qm, 1); break; }
            case 'last_quarter': { const qm = Math.floor(today.getMonth() / 3) * 3; from = new Date(today.getFullYear(), qm - 3, 1); to = new Date(today.getFullYear(), qm, 0); break; }
            case 'this_year': from = new Date(today.getFullYear(), 0, 1); break;
            case 'last_year': from = new Date(today.getFullYear() - 1, 0, 1); to = new Date(today.getFullYear() - 1, 11, 31); break;
            default: from = today;
        }
        setActivePreset(preset);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo, applyYearMonth, ymYear, ymMonth]);

    // ─── Поиск ──────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('');
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);
    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    }, [searchInput, setSearch]);

    // ─── Сортировка колонок ─────────────────────────────────────────
    const handleSort = useCallback((col: string) => {
        if (sortBy === col) {
            toggleSortDir();
        } else {
            setSortBy(col);
        }
    }, [sortBy, setSortBy, toggleSortDir]);

    const thClass = (col: string) =>
        `px-3 py-2.5 font-semibold text-right cursor-pointer select-none transition-colors ${
            sortBy === col ? 'text-indigo-600 bg-indigo-50/60' : 'text-gray-600 hover:text-indigo-600'
        }`;

    const thClassLeft = (col: string) =>
        `px-3 py-2.5 font-semibold cursor-pointer select-none transition-colors ${
            sortBy === col ? 'text-indigo-600 bg-indigo-50/60' : 'text-gray-600 hover:text-indigo-600'
        }`;

    const SortIcon: React.FC<{ col: string }> = ({ col }) => (
        sortBy === col ? (
            <svg className="w-3 h-3 ml-0.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {sortDir === 'desc'
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                }
            </svg>
        ) : (
            <svg className="w-3 h-3 ml-0.5 inline opacity-0 group-hover:opacity-40 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
        )
    );

    // ─── Сопутствующие товары (inline mini-dashboard) ──────────────
    const [selectedProduct, setSelectedProduct] = useState<DlvryProductAnalytics | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<DlvryRelatedProduct[]>([]);
    const [relatedTargetOrders, setRelatedTargetOrders] = useState(0);
    const [isRelatedLoading, setIsRelatedLoading] = useState(false);

    const handleRowClick = useCallback((product: DlvryProductAnalytics) => {
        if (selectedProduct?.dlvry_item_id === product.dlvry_item_id) {
            setSelectedProduct(null);
            return;
        }
        setSelectedProduct(product);
        setIsRelatedLoading(true);
        setRelatedProducts([]);
        fetchDlvryProductRelated(product.dlvry_item_id, {
            project_id: project.id,
            affiliate_id: affiliateId || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        })
            .then(data => {
                setRelatedProducts(data.related);
                setRelatedTargetOrders(data.target_orders_count);
            })
            .catch(() => setRelatedProducts([]))
            .finally(() => setIsRelatedLoading(false));
    }, [selectedProduct, project.id, affiliateId, dateFrom, dateTo]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Панель управления: период + сводка */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Аналитика товаров</span>
                    <button
                        onClick={refresh}
                        className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обновить
                    </button>
                </div>
                <SalesPeriodSelector
                    activePreset={activePreset}
                    onPresetChange={applyPreset}
                    ymYear={ymYear}
                    ymMonth={ymMonth}
                    yearDropdownOpen={yearDropdownOpen}
                    yearDropdownRef={yearDropdownRef as React.RefObject<HTMLDivElement>}
                    availableMonths={availableMonths}
                    onYmYearChange={setYmYear}
                    onYmMonthChange={setYmMonth}
                    onYearDropdownToggle={setYearDropdownOpen}
                    onApplyYearMonth={applyYearMonth}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                />
                {/* Карточки сводки */}
                <SummaryCards summary={summary} isLoading={isSummaryLoading} />
            </div>

            {/* Поиск */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Поиск по названию товара..."
                            value={searchInput}
                            onChange={handleSearchChange}
                            className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => { setSearchInput(''); setSearch(''); }}
                                title="Сбросить поиск"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    <button type="submit" className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                        Найти
                    </button>
                </form>
            </div>

            {/* Таблица товаров */}
            <div ref={tableScrollRef} className="flex-1 overflow-auto px-6 py-4 custom-scrollbar">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
                )}

                {isLoading && products.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="loader w-8 h-8 border-t-indigo-500" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm">Товаров не найдено</p>
                        <p className="text-xs mt-1">Попробуйте изменить период или условия поиска</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left whitespace-nowrap">
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 w-8 text-center">#</th>
                                        <th className={`${thClassLeft('name')} group`} onClick={() => handleSort('name')}>
                                            Товар <SortIcon col="name" />
                                        </th>
                                        <th className={`${thClass('total_qty')} group`} onClick={() => handleSort('total_qty')}>
                                            Продано шт. <SortIcon col="total_qty" />
                                        </th>
                                        <th className={`${thClass('orders_count')} group`} onClick={() => handleSort('orders_count')}>
                                            Заказов <SortIcon col="orders_count" />
                                        </th>
                                        <th className={`${thClass('orders_count')} group`} onClick={() => handleSort('orders_count')}>
                                            В % заказов <SortIcon col="orders_count" />
                                        </th>
                                        <th className={`${thClass('total_revenue')} group`} onClick={() => handleSort('total_revenue')}>
                                            Выручка <SortIcon col="total_revenue" />
                                        </th>
                                        <th className={`${thClass('avg_price')} group`} onClick={() => handleSort('avg_price')}>
                                            Ср. цена <SortIcon col="avg_price" />
                                        </th>
                                        <th className={`${thClass('min_price')} group`} onClick={() => handleSort('min_price')}>
                                            Мин. цена <SortIcon col="min_price" />
                                        </th>
                                        <th className={`${thClass('max_price')} group`} onClick={() => handleSort('max_price')}>
                                            Макс. цена <SortIcon col="max_price" />
                                        </th>
                                        <th className={`${thClass('total_revenue')} group`} onClick={() => handleSort('total_revenue')}>
                                            Доля выручки <SortIcon col="total_revenue" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((p, idx) => {
                                        const revenueShare = summary?.total_revenue
                                            ? (p.total_revenue / summary.total_revenue * 100)
                                            : 0;
                                        const ordersShare = summary?.total_orders
                                            ? (p.orders_count / summary.total_orders * 100)
                                            : 0;
                                        const rank = idx + 1;
                                        const isSelected = selectedProduct?.dlvry_item_id === p.dlvry_item_id;
                                        return (
                                            <React.Fragment key={`${p.dlvry_item_id}-${p.name}`}>
                                            <tr
                                                onClick={() => handleRowClick(p)}
                                                className={`cursor-pointer transition-colors whitespace-nowrap opacity-0 animate-fade-in-up ${
                                                    isSelected
                                                        ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                style={{ animationDelay: `${Math.min(idx, 20) * 20}ms` }}
                                            >
                                                <td className="px-3 py-2.5 text-center text-xs text-gray-400">{rank}</td>
                                                <td className="px-3 py-2.5 text-gray-900 font-medium max-w-[300px]">
                                                    <div className="flex items-center gap-2">
                                                        {rank <= 3 && (
                                                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                                rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                                                            }`}>
                                                                {rank}
                                                            </span>
                                                        )}
                                                        {p.name ? (
                                                            <span className="truncate">{p.name}</span>
                                                        ) : (
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-amber-600 text-xs" title="Товар не найден в каталоге">⚠</span>
                                                                    <span className="text-gray-500 text-xs truncate">
                                                                        {p.code ? `Арт. ${p.code}` : `ID ${p.dlvry_item_id}`}
                                                                        {p.sku_title ? ` · ${p.sku_title}` : ''}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 truncate">Нет в каталоге · {formatMoney(p.avg_price)} ₽</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                                    {p.total_qty.toLocaleString('ru-RU')}
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-600">
                                                    {p.orders_count.toLocaleString('ru-RU')}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${
                                                                    ordersShare >= 40 ? 'bg-green-500' : ordersShare >= 15 ? 'bg-amber-500' : 'bg-gray-400'
                                                                }`}
                                                                style={{ width: `${Math.min(ordersShare, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-10 text-right">
                                                            {ordersShare.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                                    {formatMoney(p.total_revenue)} ₽
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-600">
                                                    {formatMoney(p.avg_price)} ₽
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-500">
                                                    {formatMoney(p.min_price)} ₽
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-500">
                                                    {formatMoney(p.max_price)} ₽
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full transition-all"
                                                                style={{ width: `${Math.min(revenueShare, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500 w-10 text-right">
                                                            {revenueShare.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Inline мини-дашборд сопутствующих товаров */}
                                            {isSelected && (
                                                <tr>
                                                    <td colSpan={10} className="p-0">
                                                        <div className="px-6 py-4 bg-gradient-to-b from-indigo-50/80 to-white border-t border-b border-indigo-100 animate-fade-in-up">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                                                                    <span className="text-sm font-bold text-gray-900">Сопутствующие товары</span>
                                                                    {relatedTargetOrders > 0 && (
                                                                        <span className="text-xs text-gray-500">
                                                                            — в {relatedTargetOrders.toLocaleString('ru-RU')} заказах
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); }}
                                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-white/80 transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                            {isRelatedLoading ? (
                                                                <div className="flex items-center gap-2 py-4">
                                                                    <div className="loader w-5 h-5 border-t-indigo-500" />
                                                                    <span className="text-xs text-gray-500">Загружаю сопутствующие товары...</span>
                                                                </div>
                                                            ) : relatedProducts.length === 0 ? (
                                                                <p className="text-sm text-gray-400 py-3">Сопутствующих товаров не найдено — товар покупается в одиночку</p>
                                                            ) : (
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                                                    {relatedProducts.map((r, rIdx) => (
                                                                        <div
                                                                            key={`${r.dlvry_item_id}-${rIdx}`}
                                                                            className="p-3 rounded-lg bg-white border border-gray-100 hover:border-indigo-200 transition-all"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-1 mb-1.5">
                                                                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                                    {rIdx + 1}
                                                                                </span>
                                                                                <span className={`text-sm font-bold ${
                                                                                    r.pct >= 50 ? 'text-green-600' : r.pct >= 25 ? 'text-amber-600' : 'text-gray-600'
                                                                                }`}>
                                                                                    {r.pct}%
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs font-medium text-gray-900 truncate mb-1.5" title={r.name}>
                                                                                {r.name || <span className="text-gray-400 italic">Без названия</span>}
                                                                            </p>
                                                                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all ${
                                                                                        r.pct >= 50 ? 'bg-green-500' : r.pct >= 25 ? 'bg-amber-500' : 'bg-indigo-400'
                                                                                    }`}
                                                                                    style={{ width: `${Math.min(r.pct, 100)}%` }}
                                                                                />
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-[10px] text-gray-500">
                                                                                <span>{r.co_orders.toLocaleString('ru-RU')} заказов</span>
                                                                                <span>ср. {r.avg_qty.toFixed(1)} шт.</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Индикатор подгрузки */}
                {isLoadingMore && (
                    <div className="flex items-center justify-center py-4 gap-2">
                        <div className="loader w-5 h-5 border-t-indigo-500" />
                        <span className="text-xs text-gray-500">Загрузка...</span>
                    </div>
                )}

                {/* Счётчик */}
                {products.length > 0 && (
                    <div className="text-center py-2 text-xs text-gray-400">
                        Показано {products.length} из {total}
                        {hasMore && !isLoadingMore && (
                            <button onClick={loadMore} className="ml-2 text-indigo-600 hover:text-indigo-700 underline">
                                Загрузить ещё
                            </button>
                        )}
                    </div>
                )}
            </div>
            {/* end scroll area */}
        </div>
    );
};


// ─── Карточки сводки ────────────────────────────────────────────────────────

interface SummaryCardsProps {
    summary: import('../../../services/api/dlvry.api').DlvryProductsSummary | null;
    isLoading: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, isLoading }) => {
    if (isLoading && !summary) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) return null;

    const cards = [
        { label: 'Уникальных товаров', value: summary.unique_products.toLocaleString('ru-RU'), icon: '📦' },
        { label: 'Продано единиц', value: summary.total_qty.toLocaleString('ru-RU'), icon: '🛒' },
        { label: 'Выручка', value: `${formatMoney(summary.total_revenue)} ₽`, icon: '💰' },
        { label: 'Заказов с товарами', value: summary.total_orders.toLocaleString('ru-RU'), icon: '📋' },
        { label: 'Ср. товаров/заказ', value: summary.avg_qty_per_order.toFixed(1), icon: '📊' },
        { label: 'Ср. выручка/товар', value: `${formatMoney(summary.avg_revenue_per_product)} ₽`, icon: '📈' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
            {cards.map(card => (
                <div key={card.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                        <span>{card.icon}</span>
                        {card.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900">{card.value}</p>
                </div>
            ))}
        </div>
    );
};



