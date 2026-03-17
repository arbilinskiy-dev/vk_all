/**
 * Таблица дневной статистики продаж DLVRY с динамическими колонками,
 * infinite scroll, загрузочным / пустым состоянием и строкой итогов.
 */

import React from 'react';
import { ColGroup } from './salesTabConstants';
import { formatMoney, formatDateRu, plural } from './dlvryFormatUtils';

interface DayRow {
    date: string;
    orders_count: number;
    revenue: number;
    avg_check: number;
    first_orders: number;
    unique_clients: number;
    canceled: number;
    canceled_sum: number;
    cost: number;
    discount: number;
    first_orders_sum: number;
    first_orders_cost: number;
    count_payment_cash: number;
    sum_cash: number;
    count_payment_card: number;
    sum_card: number;
    count_payment_online: number;
    sum_online_success: number;
    sum_online_fail: number;
    source_vkapp: number;
    sum_source_vkapp: number;
    source_site: number;
    sum_source_site: number;
    source_ios: number;
    sum_source_ios: number;
    source_android: number;
    sum_source_android: number;
    delivery_count: number;
    delivery_sum: number;
    delivery_self_count: number;
    delivery_self_sum: number;
    repeat_order_2: number;
    repeat_order_3: number;
    repeat_order_4: number;
    repeat_order_5: number;
}

interface Totals {
    orders: number;
    revenue: number;
    avg_check: number;
    first_orders: number;
    unique_clients: number;
    canceled: number;
    canceled_sum: number;
    cost: number;
    discount: number;
    first_orders_sum: number;
    first_orders_cost: number;
    count_payment_cash: number;
    sum_cash: number;
    count_payment_card: number;
    sum_card: number;
    count_payment_online: number;
    sum_online_success: number;
    sum_online_fail: number;
    source_vkapp: number;
    sum_source_vkapp: number;
    source_site: number;
    sum_source_site: number;
    source_ios: number;
    sum_source_ios: number;
    source_android: number;
    sum_source_android: number;
    delivery_count: number;
    delivery_sum: number;
    delivery_self_count: number;
    delivery_self_sum: number;
    repeat_order_2: number;
    repeat_order_3: number;
    repeat_order_4: number;
    repeat_order_5: number;
}

interface SalesDailyTableProps {
    days: DayRow[];
    totals: Totals | null;
    activeGroups: Set<ColGroup>;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    totalCount: number;
    isSyncing: boolean;
    tableScrollRef: React.RefObject<HTMLDivElement>;
    onSync: () => void;
    onLoadMore: () => void;
}

export const SalesDailyTable: React.FC<SalesDailyTableProps> = ({
    days,
    totals,
    activeGroups,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    isSyncing,
    tableScrollRef,
    onSync,
    onLoadMore,
}) => (
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
                    onClick={onSync}
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
                            <button onClick={onLoadMore} className="ml-2 text-indigo-500 hover:text-indigo-700 font-medium">
                                Загрузить ещё
                            </button>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
);
