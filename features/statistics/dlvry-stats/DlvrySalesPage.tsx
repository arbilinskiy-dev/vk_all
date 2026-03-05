/**
 * Страница «DLVRY Продажи» — агрегированная статистика из DLVRY API.
 * Показывает дневные данные, итоги за период и позволяет синхронизировать вручную.
 * Отображается при activeView === 'stats-dlvry-sales'.
 * v2 — добавлены группы колонок
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Project } from '../../../shared/types';
import { useDlvryDailyStats } from './useDlvryDailyStats';
import { WelcomeScreen } from '../../../shared/components/WelcomeScreen';
import { useToast } from '../../../shared/components/ToastProvider';

interface DlvrySalesPageProps {
    project: Project | null;
}

export const DlvrySalesPage: React.FC<DlvrySalesPageProps> = ({ project }) => {
    const {
        days,
        aggregated,
        isLoading,
        isSyncing,
        error,
        lastSyncResult,
        dateFrom,
        dateTo,
        setDateFrom,
        setDateTo,
        refresh,
        syncFromApi,
    } = useDlvryDailyStats({ projectId: project?.id ?? null });

    const toast = useToast();

    // Toast-уведомление при успешной синхронизации
    React.useEffect(() => {
        if (lastSyncResult) {
            const msg = `Синхронизировано ${lastSyncResult.synced_days} дней (${lastSyncResult.date_from} — ${lastSyncResult.date_to}).` +
                (lastSyncResult.total_orders !== undefined ? ` Заказов: ${lastSyncResult.total_orders}, выручка: ${formatMoney(lastSyncResult.total_revenue ?? 0)} ₽` : '');
            toast.success(msg, 'Синхронизация');
        }
    }, [lastSyncResult]);

    // Переключатель групп колонок
    type ColGroup = 'main' | 'finance' | 'payment' | 'sources' | 'delivery' | 'repeat';
    const [activeGroups, setActiveGroups] = useState<Set<ColGroup>>(new Set(['main']));

    const toggleGroup = useCallback((g: ColGroup) => {
        setActiveGroups(prev => {
            const next = new Set(prev);
            if (next.has(g)) next.delete(g);
            else next.add(g);
            // «Основное» всегда видно
            next.add('main');
            return next;
        });
    }, []);

    const showAll = useCallback(() => {
        setActiveGroups(new Set<ColGroup>(['main', 'finance', 'payment', 'sources', 'delivery', 'repeat']));
    }, []);

    // Кнопка «Обновить данные»
    const handleSync = useCallback(async () => {
        await syncFromApi(false);
    }, [syncFromApi]);

    // Полная пересинхронизация
    const handleFullSync = useCallback(async () => {
        await syncFromApi(true);
    }, [syncFromApi]);

    // Итоги по ВСЕМ полям (вычисляем из days)
    const totals = useMemo(() => {
        if (!days.length) return null;
        const t = days.reduce((acc, d) => {
            acc.orders += d.orders_count || 0;
            acc.revenue += d.revenue || 0;
            acc.first_orders += d.first_orders || 0;
            acc.first_orders_sum += d.first_orders_sum || 0;
            acc.first_orders_cost += d.first_orders_cost || 0;
            acc.unique_clients += d.unique_clients || 0;
            acc.canceled += d.canceled || 0;
            acc.canceled_sum += d.canceled_sum || 0;
            acc.cost += d.cost || 0;
            acc.discount += d.discount || 0;
            acc.sum_cash += d.sum_cash || 0;
            acc.count_payment_cash += d.count_payment_cash || 0;
            acc.sum_card += d.sum_card || 0;
            acc.count_payment_card += d.count_payment_card || 0;
            acc.count_payment_online += d.count_payment_online || 0;
            acc.sum_online_success += d.sum_online_success || 0;
            acc.sum_online_fail += d.sum_online_fail || 0;
            acc.source_site += d.source_site || 0;
            acc.sum_source_site += d.sum_source_site || 0;
            acc.source_vkapp += d.source_vkapp || 0;
            acc.sum_source_vkapp += d.sum_source_vkapp || 0;
            acc.source_ios += d.source_ios || 0;
            acc.sum_source_ios += d.sum_source_ios || 0;
            acc.source_android += d.source_android || 0;
            acc.sum_source_android += d.sum_source_android || 0;
            acc.delivery_self_count += d.delivery_self_count || 0;
            acc.delivery_self_sum += d.delivery_self_sum || 0;
            acc.delivery_count += d.delivery_count || 0;
            acc.delivery_sum += d.delivery_sum || 0;
            acc.repeat_order_2 += d.repeat_order_2 || 0;
            acc.repeat_order_3 += d.repeat_order_3 || 0;
            acc.repeat_order_4 += d.repeat_order_4 || 0;
            acc.repeat_order_5 += d.repeat_order_5 || 0;
            return acc;
        }, {
            orders: 0, revenue: 0, first_orders: 0, first_orders_sum: 0, first_orders_cost: 0,
            unique_clients: 0, canceled: 0, canceled_sum: 0, cost: 0, discount: 0,
            sum_cash: 0, count_payment_cash: 0, sum_card: 0, count_payment_card: 0,
            count_payment_online: 0, sum_online_success: 0, sum_online_fail: 0,
            source_site: 0, sum_source_site: 0, source_vkapp: 0, sum_source_vkapp: 0,
            source_ios: 0, sum_source_ios: 0, source_android: 0, sum_source_android: 0,
            delivery_self_count: 0, delivery_self_sum: 0, delivery_count: 0, delivery_sum: 0,
            repeat_order_2: 0, repeat_order_3: 0, repeat_order_4: 0, repeat_order_5: 0,
        });
        return { ...t, avg_check: t.orders > 0 ? t.revenue / t.orders : 0 };
    }, [days]);

    if (!project) {
        return <WelcomeScreen />;
    }

    // Проверяем, настроена ли DLVRY интеграция
    if (!project.dlvry_affiliate_id) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">DLVRY не настроен</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Для отображения статистики продаж необходимо указать <span className="font-medium">Affiliate ID</span> в настройках проекта.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 text-sm rounded-lg border border-orange-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Настройки проекта → Интеграции → DLVRY
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Заголовок */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            DLVRY Продажи
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {project.name} · Affiliate: {project.dlvry_affiliate_id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
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
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            title="Полная пересинхронизация за год"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Полная загрузка
                        </button>
                    </div>
                </div>



                {/* Карточки статистики */}
                <AggregatedCards aggregated={aggregated} isLoading={isLoading} />
            </div>

            {/* Фильтры по дате + группы колонок */}
            <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-gray-200">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-sm text-gray-500">Период:</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                        <span className="text-gray-400">—</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button
                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                            className="text-sm text-gray-400 hover:text-gray-600 underline"
                        >
                            Сбросить
                        </button>
                    )}
                    <span className="ml-auto text-xs text-gray-400">
                        Данные обновляются автоматически раз в сутки
                    </span>
                </div>
                {/* Переключатель групп колонок */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-gray-400 mr-1">Колонки:</span>
                    {([
                        { key: 'main' as ColGroup, label: 'Основное', icon: '📊' },
                        { key: 'finance' as ColGroup, label: 'Финансы', icon: '💰' },
                        { key: 'payment' as ColGroup, label: 'Оплата', icon: '💳' },
                        { key: 'sources' as ColGroup, label: 'Источники', icon: '📱' },
                        { key: 'delivery' as ColGroup, label: 'Доставка', icon: '🚗' },
                        { key: 'repeat' as ColGroup, label: 'Повторные', icon: '🔄' },
                    ]).map(g => (
                        <button
                            key={g.key}
                            onClick={() => toggleGroup(g.key)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                activeGroups.has(g.key)
                                    ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            } ${g.key === 'main' ? 'cursor-default' : ''}`}
                        >
                            {g.icon} {g.label}
                        </button>
                    ))}
                    <button
                        onClick={showAll}
                        className="px-2.5 py-1 text-xs rounded-full border border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-colors ml-1"
                    >
                        Все
                    </button>
                </div>
            </div>

            {/* Ошибка */}
            {error && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Таблица дневной статистики */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {isLoading && days.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="loader" style={{ width: '32px', height: '32px', borderTopColor: '#f97316' }} />
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
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            {isSyncing ? 'Загрузка...' : 'Загрузить данные'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                        <table className="min-w-max text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left whitespace-nowrap">
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Дата</th>
                                    {/* === Основное (всегда видно) === */}
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Заказов</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Выручка</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Ср. чек</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Новые</th>
                                    <th className="px-3 py-2.5 font-semibold text-gray-600 text-right">Уник.</th>
                                    {/* === Финансы === */}
                                    {activeGroups.has('finance') && <>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right border-l border-gray-200" title="Отмены">Отмен</th>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right" title="Сумма отмен">Σ отмен</th>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right">Себест.</th>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right">Скидки</th>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right" title="Выручка 1-х заказов">Σ нов.</th>
                                        <th className="px-3 py-2.5 font-semibold text-amber-600 text-right" title="Себестоимость 1-х заказов">Себ. нов.</th>
                                    </>}
                                    {/* === Оплата === */}
                                    {activeGroups.has('payment') && <>
                                        <th className="px-3 py-2.5 font-semibold text-violet-600 text-right border-l border-gray-200" title="Наличные">Нал</th>
                                        <th className="px-3 py-2.5 font-semibold text-violet-600 text-right" title="Картой">Карта</th>
                                        <th className="px-3 py-2.5 font-semibold text-violet-600 text-right" title="Онлайн-оплата">Онлайн</th>
                                    </>}
                                    {/* === Источники === */}
                                    {activeGroups.has('sources') && <>
                                        <th className="px-3 py-2.5 font-semibold text-blue-600 text-right border-l border-gray-200">VK</th>
                                        <th className="px-3 py-2.5 font-semibold text-blue-600 text-right">Сайт</th>
                                        <th className="px-3 py-2.5 font-semibold text-blue-600 text-right">iOS</th>
                                        <th className="px-3 py-2.5 font-semibold text-blue-600 text-right">Android</th>
                                    </>}
                                    {/* === Доставка === */}
                                    {activeGroups.has('delivery') && <>
                                        <th className="px-3 py-2.5 font-semibold text-teal-600 text-right border-l border-gray-200" title="Доставка">Дост.</th>
                                        <th className="px-3 py-2.5 font-semibold text-teal-600 text-right" title="Самовывоз">Самов.</th>
                                    </>}
                                    {/* === Повторные === */}
                                    {activeGroups.has('repeat') && <>
                                        <th className="px-3 py-2.5 font-semibold text-gray-500 text-right border-l border-gray-200" title="2-й заказ">×2</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-500 text-right" title="3-й заказ">×3</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-500 text-right" title="4-й заказ">×4</th>
                                        <th className="px-3 py-2.5 font-semibold text-gray-500 text-right" title="5+ заказов">×5+</th>
                                    </>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {days.map(day => (
                                    <tr key={day.date} className="hover:bg-orange-50/30 transition-colors whitespace-nowrap">
                                        <td className="px-3 py-2.5 text-gray-700 font-medium sticky left-0 bg-white z-10 border-r border-gray-100">
                                            {formatDateRu(day.date)}
                                        </td>
                                        {/* Основное */}
                                        <td className="px-3 py-2.5 text-right text-gray-900 font-semibold">{day.orders_count}</td>
                                        <td className="px-3 py-2.5 text-right text-orange-600 font-semibold">{formatMoney(day.revenue)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-indigo-600">{formatMoney(day.avg_check)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-green-600">{day.first_orders > 0 ? `+${day.first_orders}` : '—'}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{day.unique_clients || '—'}</td>
                                        {/* Финансы */}
                                        {activeGroups.has('finance') && <>
                                            <td className="px-3 py-2.5 text-right text-red-500 border-l border-gray-100">{day.canceled > 0 ? day.canceled : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-red-500">{day.canceled_sum > 0 ? `${formatMoney(day.canceled_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.cost > 0 ? `${formatMoney(day.cost)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-amber-600">{day.discount > 0 ? `${formatMoney(day.discount)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-500">{day.first_orders_sum > 0 ? `${formatMoney(day.first_orders_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-500">{day.first_orders_cost > 0 ? `${formatMoney(day.first_orders_cost)}₽` : '—'}</td>
                                        </>}
                                        {/* Оплата */}
                                        {activeGroups.has('payment') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">
                                                {day.count_payment_cash > 0 ? <>{day.count_payment_cash} <span className="text-gray-400">/</span> {formatMoney(day.sum_cash)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.count_payment_card > 0 ? <>{day.count_payment_card} <span className="text-gray-400">/</span> {formatMoney(day.sum_card)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-purple-600">
                                                {day.count_payment_online > 0 ? (
                                                    <>{day.count_payment_online} <span className="text-gray-400">/</span> {formatMoney(day.sum_online_success)}₽
                                                    {day.sum_online_fail > 0 && <span className="text-red-400 text-xs ml-0.5">(−{formatMoney(day.sum_online_fail)})</span>}</>
                                                ) : '—'}
                                            </td>
                                        </>}
                                        {/* Источники */}
                                        {activeGroups.has('sources') && <>
                                            <td className="px-3 py-2.5 text-right text-blue-600 border-l border-gray-100">
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
                                        {/* Доставка */}
                                        {activeGroups.has('delivery') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">
                                                {day.delivery_count > 0 ? <>{day.delivery_count} <span className="text-gray-400">/</span> {formatMoney(day.delivery_sum)}₽</> : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">
                                                {day.delivery_self_count > 0 ? <>{day.delivery_self_count} <span className="text-gray-400">/</span> {formatMoney(day.delivery_self_sum)}₽</> : '—'}
                                            </td>
                                        </>}
                                        {/* Повторные */}
                                        {activeGroups.has('repeat') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-500 border-l border-gray-100">{day.repeat_order_2 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_3 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_4 || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{day.repeat_order_5 || '—'}</td>
                                        </>}
                                    </tr>
                                ))}
                            </tbody>
                            {/* Итого */}
                            {totals && (
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold text-xs whitespace-nowrap">
                                        <td className="px-3 py-2.5 text-gray-900 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">Итого ({days.length} дн.)</td>
                                        <td className="px-3 py-2.5 text-right text-gray-900">{totals.orders}</td>
                                        <td className="px-3 py-2.5 text-right text-orange-600">{formatMoney(totals.revenue)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-indigo-600">{formatMoney(totals.avg_check)} ₽</td>
                                        <td className="px-3 py-2.5 text-right text-green-600">+{totals.first_orders}</td>
                                        <td className="px-3 py-2.5 text-right text-gray-700">{totals.unique_clients || '—'}</td>
                                        {activeGroups.has('finance') && <>
                                            <td className="px-3 py-2.5 text-right text-red-500 border-l border-gray-100">{totals.canceled || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-red-500">{totals.canceled_sum > 0 ? `${formatMoney(totals.canceled_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-500">{totals.cost > 0 ? `${formatMoney(totals.cost)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-amber-600">{totals.discount > 0 ? `${formatMoney(totals.discount)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-500">{totals.first_orders_sum > 0 ? `${formatMoney(totals.first_orders_sum)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-green-500">{totals.first_orders_cost > 0 ? `${formatMoney(totals.first_orders_cost)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('payment') && <>
                                            <td className="px-3 py-2.5 text-right text-gray-600 border-l border-gray-100">{totals.count_payment_cash > 0 ? `${totals.count_payment_cash} / ${formatMoney(totals.sum_cash)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-gray-600">{totals.count_payment_card > 0 ? `${totals.count_payment_card} / ${formatMoney(totals.sum_card)}₽` : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-purple-600">{totals.count_payment_online > 0 ? `${totals.count_payment_online} / ${formatMoney(totals.sum_online_success)}₽` : '—'}</td>
                                        </>}
                                        {activeGroups.has('sources') && <>
                                            <td className="px-3 py-2.5 text-right text-blue-600 border-l border-gray-100">{totals.source_vkapp > 0 ? `${totals.source_vkapp} / ${formatMoney(totals.sum_source_vkapp)}₽` : '—'}</td>
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
                    </div>
                )}
            </div>
        </div>
    );
};


// =============================================================================
// Карточки агрегатов
// =============================================================================

interface AggregatedCardsProps {
    aggregated: import('../../../services/api/dlvryStats.api').DlvryAggregated | null;
    isLoading: boolean;
}

const AggregatedCards: React.FC<AggregatedCardsProps> = ({ aggregated, isLoading }) => {
    if (isLoading && !aggregated) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-24" />
                    </div>
                ))}
            </div>
        );
    }

    if (!aggregated) return null;

    const cards = [
        { label: 'Всего заказов', value: String(aggregated.total_orders), color: 'text-gray-900' },
        { label: 'Выручка', value: `${formatMoney(aggregated.total_revenue)} ₽`, color: 'text-orange-600' },
        { label: 'Средний чек', value: `${formatMoney(aggregated.avg_check)} ₽`, color: 'text-indigo-600' },
        { label: 'Новые клиенты', value: `+${aggregated.total_first_orders}`, color: 'text-green-600' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map(card => (
                <div key={card.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">{card.label}</p>
                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                </div>
            ))}
        </div>
    );
};


// =============================================================================
// Утилиты
// =============================================================================

function formatMoney(value: number | null | undefined): string {
    if (value == null) return '0';
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
}

function formatDateRu(iso: string): string {
    try {
        const d = new Date(iso + 'T00:00:00');
        const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const day = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
        return `${day} (${weekdays[d.getDay()]})`;
    } catch {
        return iso;
    }
}
