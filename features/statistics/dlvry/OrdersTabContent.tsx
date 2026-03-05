/**
 * Таб «Заказы» — данные из вебхуков DLVRY.
 * Поиск, фильтрация, таблица заказов, пагинация, модалка деталей.
 */

import React, { useState, useCallback } from 'react';
import { Project } from '../../../shared/types';
import { useDlvryOrders } from './useDlvryOrders';
import { DlvryOrderDetailModal } from './DlvryOrderDetailModal';
import { OrderStatsCards } from './OrderStatsCards';
import { formatMoney, formatShortDate } from './dlvryFormatUtils';
import { CustomDatePicker } from '../../../shared/components/pickers/CustomDatePicker';

interface OrdersTabContentProps {
    project: Project;
}

export const OrdersTabContent: React.FC<OrdersTabContentProps> = ({ project }) => {
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    const {
        orders,
        stats,
        total,
        isLoading,
        isStatsLoading,
        error,
        page,
        pageSize,
        dateFrom,
        dateTo,
        setPage,
        setSearch,
        setDateFrom,
        setDateTo,
        refresh,
    } = useDlvryOrders({ projectId: project.id });

    const [searchInput, setSearchInput] = useState('');
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value);
    }, []);
    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(0);
    }, [searchInput, setSearch, setPage]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Кнопка обновить + карточки */}
            <div className="flex-shrink-0 px-6 pt-4 pb-3 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={refresh}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Обновить
                    </button>
                    <span className="text-xs text-gray-400">Заказы поступают через вебхуки DLVRY</span>
                </div>
                <OrderStatsCards stats={stats} isLoading={isStatsLoading} />
            </div>

            {/* Фильтры */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap">
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <input type="text" placeholder="Поиск по имени, телефону, ID..." value={searchInput} onChange={handleSearchChange} className="w-full px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchInput(''); setSearch(''); setPage(0); }}
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
                    <div className="flex items-center gap-2">
                        <CustomDatePicker
                            value={dateFrom}
                            onChange={val => { setDateFrom(val); setPage(0); }}
                            placeholder="Начало"
                        />
                        <span className="text-gray-400">—</span>
                        <CustomDatePicker
                            value={dateTo}
                            onChange={val => { setDateTo(val); setPage(0); }}
                            placeholder="Конец"
                        />
                    </div>
                </div>
            </div>

            {/* Таблица заказов */}
            <div className="flex-1 overflow-auto px-6 py-4 custom-scrollbar">
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
                        <p className="text-xs mt-1">Заказы появятся после настройки вебхуков в DLVRY</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Дата</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Клиент</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Телефон</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Сумма</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Оплата</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Доставка</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600">Источник</th>
                                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">Позиции</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map(order => (
                                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="hover:bg-gray-50 cursor-pointer transition-colors opacity-0 animate-fade-in-up" style={{ animationDelay: `${(orders.indexOf(order)) * 20}ms` }}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.dlvry_order_id}</td>
                                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatShortDate(order.order_date)}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">{order.client_name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{order.client_phone || '—'}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatMoney(order.total)} ₽</td>
                                        <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md">{order.payment_type || '—'}</span></td>
                                        <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-md">{order.delivery_type || '—'}</span></td>
                                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[120px] truncate">{order.source_name || '—'}</td>
                                        <td className="px-4 py-3 text-center text-gray-600">{order.items_count ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Показано {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} из {total}
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">←</button>
                        <span className="px-3 py-1.5 text-sm text-gray-600">{page + 1} / {totalPages}</span>
                        <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">→</button>
                    </div>
                </div>
            )}

            {/* Модалка деталей */}
            {selectedOrderId !== null && (
                <DlvryOrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
            )}
        </div>
    );
};
