/**
 * Таб «Заказы» — данные из вебхуков DLVRY + синхронизация через hl-orders API.
 * Кнопки синхронизации, выбор периода, поиск, фильтрация, таблица заказов, пагинация, модалка.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Project } from '../../../shared/types';
import { useDlvryOrders } from './useDlvryOrders';
import { DlvryOrderDetailModal } from './DlvryOrderDetailModal';
import { OrderStatsCards } from './OrderStatsCards';
import { OrdersSyncButtons } from './OrdersSyncButtons';
import { SalesPeriodSelector } from './SalesPeriodSelector';
import { formatMoney, formatShortDate } from './dlvryFormatUtils';
import { DlvryOrder } from '../../../services/api/dlvry.api';
import { PeriodPreset, localDateStr } from './salesTabConstants';
import {
    OrderColGroup,
    ORDER_COLUMN_GROUPS,
    loadOrderColGroups,
    saveOrderColGroups,
} from './ordersTabConstants';

interface OrdersTabContentProps {
    project: Project;
    affiliateId?: string | null;
}

export const OrdersTabContent: React.FC<OrdersTabContentProps> = ({ project, affiliateId }) => {
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [activeGroups, setActiveGroups] = useState<Set<OrderColGroup>>(loadOrderColGroups);

    // Даты текущего месяца для дефолтного пресета
    const [defaultDateFrom] = useState(() => {
        const now = new Date();
        return localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    });
    const [defaultDateTo] = useState(() => localDateStr(new Date()));

    const toggleGroup = useCallback((group: OrderColGroup) => {
        setActiveGroups(prev => {
            const next = new Set(prev);
            if (next.has(group)) next.delete(group);
            else next.add(group);
            saveOrderColGroups(next);
            return next;
        });
    }, []);

    const {
        orders,
        stats,
        total,
        isLoading,
        isLoadingMore,
        hasMore,
        isStatsLoading,
        error,
        dateFrom,
        dateTo,
        setSearch,
        setDateFrom,
        setDateTo,
        refresh,
        loadMore,
        isSyncing,
        fullSyncProgress,
        handleSync,
        handleFullSync,
    } = useDlvryOrders({ projectId: project.id, affiliateId, initialDateFrom: defaultDateFrom, initialDateTo: defaultDateTo });

    // ─── Infinite scroll ref ────────────────────────────────────────────
    const tableScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = tableScrollRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!hasMore || isLoadingMore) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                loadMore();
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [hasMore, isLoadingMore, loadMore]);

    // ─── Пресеты периодов (аналог useSalesTabLogic) ─────────────────────
    const [activePreset, setActivePreset] = useState<PeriodPreset>('this_month');
    const [ymYear, setYmYear] = useState(() => new Date().getFullYear());
    const [ymMonth, setYmMonth] = useState(() => new Date().getMonth());
    const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
    const yearDropdownRef = useRef<HTMLDivElement>(null);

    // Пустой Set для availableMonths — у заказов нет отдельного endpoint
    const [availableMonths] = useState<Set<string>>(() => {
        const set = new Set<string>();
        const now = new Date();
        // Генерируем последние 36 месяцев как доступные
        for (let i = 0; i < 36; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            set.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
        }
        return set;
    });

    // Закрытие дропдауна года при клике вне
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
        const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
        const to = isCurrentMonth ? today : new Date(year, month + 1, 0);
        setDateFrom(localDateStr(from));
        setDateTo(localDateStr(to));
    }, [setDateFrom, setDateTo]);

    /** Вычисляет даты для пресета и применяет */
    const applyPreset = useCallback((preset: PeriodPreset) => {
        if (preset === 'custom' || preset === 'year_month') {
            setActivePreset(preset);
            if (preset === 'year_month') {
                applyYearMonth(ymYear, ymMonth);
            }
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

    const [searchInput, setSearchInput] = useState('');
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);
    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    }, [searchInput, setSearch]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Кнопки синхронизации + карточки + периоды */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <OrdersSyncButtons
                        isSyncing={isSyncing}
                        onSync={handleSync}
                        onFullSync={handleFullSync}
                        fullSyncProgress={fullSyncProgress}
                    />
                    <span className="text-xs text-gray-400">Заказы из DLVRY API + вебхуки</span>
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
                <OrderStatsCards stats={stats} isLoading={isStatsLoading} />
            </div>

            {/* Фильтры + переключатели колонок */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <input type="text" placeholder="Поиск по имени, телефону, ID..." value={searchInput} onChange={handleSearchChange} className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
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
                        <button type="submit" className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">Найти</button>
                    </form>
                </div>
                {/* Переключатели групп колонок */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400 mr-1">Столбцы:</span>
                    {ORDER_COLUMN_GROUPS.map(g => (
                        <button
                            key={g.key}
                            onClick={() => toggleGroup(g.key)}
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                activeGroups.has(g.key)
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                        >
                            {g.icon} {g.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Таблица заказов — infinite scroll */}
            <div ref={tableScrollRef} className="flex-1 overflow-auto px-6 py-4 custom-scrollbar">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
                )}

                {isLoading && orders.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="loader w-8 h-8 border-t-indigo-500" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm">Заказов пока нет</p>
                        <p className="text-xs mt-1">Нажмите «Полная загрузка» для загрузки заказов из DLVRY</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-max text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left whitespace-nowrap">
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">ID</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Дата</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Клиент</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Телефон</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Сумма</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Оплата</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Доставка</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600">Источник</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-center">Позиции</th>
                                    {activeGroups.has('finance') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right border-l border-gray-200" title="Себестоимость">Себест.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Маржинальность">Маржа</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Скидка">Скидка</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Оплата бонусами">Бонусы</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-right" title="Наценка">Наценка</th>
                                    </>}
                                    {activeGroups.has('client') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 border-l border-gray-200" title="VK платформа">VK платф.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600" title="VK ID пользователя">VK ID</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600" title="Город">Город</th>
                                    </>}
                                    {activeGroups.has('extra') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-center border-l border-gray-200" title="Количество персон">Персоны</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600 text-center" title="Общее кол-во единиц товаров">Ед.</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600" title="Промокод">Промокод</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-600" title="Комментарий клиента">Коммент.</th>
                                    </>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order, idx) => (
                                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-gray-50 cursor-pointer transition-colors whitespace-nowrap opacity-0 animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 20) * 20}ms` }}>
                                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500 sticky left-0 bg-white z-10 border-r border-gray-100">#{order.dlvry_order_id}</td>
                                        <td className="px-3 py-2.5 text-gray-700">{formatShortDate(order.order_date)}</td>
                                        <td className="px-3 py-2.5 text-gray-900 font-medium max-w-[180px] truncate">{order.client_name || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-600 font-mono text-xs">{order.client_phone || '—'}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{formatMoney(order.total)} ₽</td>
                                        <td className="px-3 py-2.5"><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md">{order.payment_type || '—'}</span></td>
                                        <td className="px-3 py-2.5"><span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md">{order.delivery_type || '—'}</span></td>
                                        <td className="px-3 py-2.5 text-gray-600 text-xs max-w-[120px] truncate">{order.source_name || '—'}</td>
                                        <td className="px-3 py-2.5 text-center text-gray-600">{order.items_count ?? 0}</td>
                                        {activeGroups.has('finance') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-500 border-l border-gray-100">{order.cost ? `${formatMoney(order.cost)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right">{renderMargin(order)}</td>
                                            <td className="px-3 py-2.5 text-right text-orange-500">{order.discount ? `${formatMoney(order.discount)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-purple-500">{order.payment_bonus ? `${formatMoney(order.payment_bonus)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{order.markup ? `${formatMoney(order.markup)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('client') && <>
                                            <td className="px-3 py-2.5 text-gray-600 text-xs border-l border-gray-100">{formatPlatform(order.vk_platform)}</td>
                                            <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{order.vk_user_id || '—'}</td>
                                            <td className="px-3 py-2.5 text-gray-600 text-xs">{order.address_city || '—'}</td>
                                        </>}
                                        {activeGroups.has('extra') && <>
                                            <td className="px-3 py-2.5 text-center text-gray-600 border-l border-gray-100">{order.persons || '—'}</td>
                                            <td className="px-3 py-2.5 text-center text-gray-600">{order.items_total_qty || '—'}</td>
                                            <td className="px-3 py-2.5 text-gray-600 text-xs">{order.promocode || '—'}</td>
                                            <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[150px] truncate" title={order.comment || ''}>{order.comment || '—'}</td>
                                        </>}
                                    </tr>
                                ))}
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

                {/* Счётчик + кнопка "Загрузить ещё" */}
                {orders.length > 0 && (
                    <div className="text-center py-2 text-xs text-gray-400">
                        Показано {orders.length} из {total}
                        {hasMore && !isLoadingMore && (
                            <button onClick={loadMore} className="ml-2 text-indigo-600 hover:text-indigo-700 underline">
                                Загрузить ещё
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Модалка деталей */}
            {selectedOrderId !== null && (
                <DlvryOrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
};

// ── Вспомогательные функции ─────────────────────────────────────────────────

/** Маржа = (total - cost) / total × 100 */
function renderMargin(order: DlvryOrder): React.ReactNode {
    if (!order.total || !order.cost) return <span className="text-gray-400">—</span>;
    const margin = order.total - order.cost;
    const pct = Math.round((margin / order.total) * 100);
    const color = pct >= 50 ? 'text-green-600' : pct >= 20 ? 'text-amber-600' : 'text-red-500';
    return <span className={color}>{pct}%</span>;
}

/** Читаемое название платформы VK */
function formatPlatform(raw: string | null): string {
    if (!raw) return '—';
    const map: Record<string, string> = {
        desktop_web: 'Desktop',
        mobile_web: 'Mobile Web',
        mobile_iphone: 'iOS',
        mobile_android: 'Android',
        mobile_ipad: 'iPad',
    };
    return map[raw] || raw;
}
