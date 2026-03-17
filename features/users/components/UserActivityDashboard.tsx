import React from 'react';
import { AnimatedCounter } from '../../automations/stories-automation/components/dashboard/AnimatedCounter';
import { useUserActivityDashboard } from '../hooks/useUserActivityDashboard';
import { PERIOD_OPTIONS, CATEGORY_LABELS, ACTION_LABELS } from './activity-dashboard/constants';
import { formatMinutes, plural } from './activity-dashboard/utils';
import { KpiCard } from './activity-dashboard/KpiCard';
import { DailyChart } from './activity-dashboard/DailyChart';
import { HourlyHeatmap } from './activity-dashboard/HourlyHeatmap';
import { EventsDistribution } from './activity-dashboard/EventsDistribution';
import { CategoriesChart } from './activity-dashboard/CategoriesChart';
import { UserStatsTable } from './activity-dashboard/UserStatsTable';
import { UserActionsTable } from './activity-dashboard/UserActionsTable';
import { LoadingSkeleton } from './activity-dashboard/LoadingSkeleton';

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ — ХАБ
// ==========================================
export const UserActivityDashboard: React.FC = () => {
    const { state, actions } = useUserActivityDashboard();
    const { data, isLoading, error, periodDays } = state;
    const { fetchData, setPeriodDays } = actions;

    if (error) {
        return <div className="text-center text-red-600 p-8 bg-red-50 rounded-lg">{error}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Заголовок + переключатель периода */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Аналитика активности</h2>
                    <p className="text-sm text-gray-500">Мониторинг рабочих процессов и использования системы</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        {PERIOD_OPTIONS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriodDays(p.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    periodDays === p.value
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors disabled:opacity-40"
                        title="Обновить"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading && !data ? (
                <LoadingSkeleton />
            ) : data && data.summary && (
                <>
                    {/* KPI-карточки */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        <KpiCard
                            title="Сейчас онлайн"
                            value={<AnimatedCounter value={data.summary.online_now} />}
                            delay={0}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="3" /><path d="M12 2v2m0 16v2m-7.07-2.93l1.41-1.41m9.33-9.33l1.41-1.41M2 12h2m16 0h2M4.93 4.93l1.41 1.41m9.33 9.33l1.41 1.41" /></svg>}
                            color="text-green-600"
                            bgColor="bg-green-50"
                        />
                        <KpiCard
                            title="Уник. пользователей"
                            value={<AnimatedCounter value={data.summary.total_active_users} />}
                            subtitle={`за ${data.summary.period_days}д`}
                            delay={80}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" /></svg>}
                            color="text-indigo-600"
                            bgColor="bg-indigo-50"
                        />
                        <KpiCard
                            title="Всего входов"
                            value={<AnimatedCounter value={data.summary.total_logins} />}
                            delay={160}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                            color="text-green-600"
                            bgColor="bg-green-50"
                        />
                        <KpiCard
                            title="Неудачных входов"
                            value={<AnimatedCounter value={data.summary.total_failed_logins} />}
                            delay={240}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            color="text-red-600"
                            bgColor="bg-red-50"
                        />
                        <KpiCard
                            title="Таймаутов"
                            value={<AnimatedCounter value={data.summary.total_timeouts} />}
                            subtitle={plural(data.summary.total_timeouts, ['сессия истекла', 'сессии истекли', 'сессий истекло'])}
                            delay={320}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                            color="text-amber-600"
                            bgColor="bg-amber-50"
                        />
                        <KpiCard
                            title="Принуд. кики"
                            value={<AnimatedCounter value={data.summary.total_force_logouts} />}
                            delay={400}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
                            color="text-purple-600"
                            bgColor="bg-purple-50"
                        />
                        <KpiCard
                            title="Сред. сессия"
                            value={formatMinutes(data.summary.avg_session_minutes)}
                            delay={480}
                            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                            color="text-blue-600"
                            bgColor="bg-blue-50"
                        />
                    </div>

                    {/* Графики — 2 колонки */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '560ms' }}>
                        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Активность по дням</h3>
                            <DailyChart data={data.daily_chart ?? []} />
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Распределение событий</h3>
                            <EventsDistribution data={data.events_chart ?? []} />
                        </div>
                    </div>

                    {/* Тепловая карта по часам */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '640ms' }}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Пик активности по часам (входы)</h3>
                        <HourlyHeatmap data={data.hourly_chart ?? []} />
                    </div>

                    {/* Таблица пользователей */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '720ms' }}>
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-700">Статистика авторизации по пользователям</h3>
                        </div>
                        <UserStatsTable users={data.user_stats ?? []} />
                    </div>

                    {/* ===== БИЗНЕС-ДЕЙСТВИЯ ===== */}
                    <div className="pt-2 opacity-0 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Бизнес-действия</h2>
                        <p className="text-sm text-gray-500 mb-4">Мониторинг реальной работы: кто что делает в системе</p>
                    </div>

                    {/* KPI действий */}
                    {data.actions_summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '880ms' }}>
                            <KpiCard
                                title="Всего действий"
                                value={<AnimatedCounter value={data.actions_summary.total_actions} />}
                                subtitle={`за ${data.summary.period_days}д`}
                                delay={0}
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                color="text-indigo-600"
                                bgColor="bg-indigo-50"
                            />
                            <KpiCard
                                title="Активных юзеров"
                                value={<AnimatedCounter value={data.actions_summary.active_doers} />}
                                subtitle="выполнили действия"
                                delay={80}
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
                                color="text-green-600"
                                bgColor="bg-green-50"
                            />
                            <KpiCard
                                title="Топ категория"
                                value={
                                    (data.actions_summary.top_categories?.length ?? 0) > 0
                                        ? CATEGORY_LABELS[data.actions_summary.top_categories![0].category] || data.actions_summary.top_categories![0].category
                                        : '—'
                                }
                                subtitle={(data.actions_summary.top_categories?.length ?? 0) > 0 ? `${data.actions_summary.top_categories![0].count} действий` : undefined}
                                delay={160}
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                                color="text-purple-600"
                                bgColor="bg-purple-50"
                            />
                            <KpiCard
                                title="Топ действие"
                                value={
                                    (data.actions_summary.top_actions?.length ?? 0) > 0
                                        ? ACTION_LABELS[data.actions_summary.top_actions![0].action_type] || data.actions_summary.top_actions![0].action_type
                                        : '—'
                                }
                                subtitle={(data.actions_summary.top_actions?.length ?? 0) > 0 ? `${data.actions_summary.top_actions![0].count} раз` : undefined}
                                delay={240}
                                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                                color="text-amber-600"
                                bgColor="bg-amber-50"
                            />
                        </div>
                    )}

                    {/* Категории + Топ действий */}
                    {data.actions_summary && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '960ms' }}>
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Распределение по категориям</h3>
                                <CategoriesChart data={data.actions_summary.top_categories ?? []} />
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Самые популярные действия</h3>
                                {(data.actions_summary.top_actions?.length ?? 0) === 0 ? (
                                    <div className="text-center text-gray-400 py-6 text-sm">Нет данных</div>
                                ) : (
                                    <div className="space-y-2">
                                        {(data.actions_summary.top_actions ?? []).slice(0, 8).map((a, i) => (
                                            <div key={a.action_type} className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-gray-700 truncate">
                                                        {ACTION_LABELS[a.action_type] || a.action_type}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-indigo-600">{a.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Таблица действий по пользователям */}
                    {data.user_actions_stats && data.user_actions_stats.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '1040ms' }}>
                            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-700">Действия по пользователям</h3>
                            </div>
                            <UserActionsTable users={data.user_actions_stats} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
