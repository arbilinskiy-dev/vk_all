/**
 * Страница «АМ Анализ» — ХАБ-контейнер.
 * Мониторинг действий сотрудников в модуле Сообщений.
 * Отображает: KPI-карточки, таблицу по сотрудникам, круговую диаграмму, график по дням.
 */

import React from 'react';
import { useAmAnalysis } from '../../hooks/stats/useAmAnalysis';
import { PERIOD_OPTIONS } from './amAnalysisConstants';
import { KpiCard } from './KpiCard';
import { GroupPieChart } from './GroupPieChart';
import { DailyChart } from './DailyChart';
import { UserStatsTable } from './UserStatsTable';

// ─── Главный компонент (ХАБ) ────────────────────────────────────

export const AmAnalysisPage: React.FC = () => {
    const { data, isLoading, error, periodDays, setPeriodDays, refresh } = useAmAnalysis();

    // Скелетон загрузки
    if (isLoading && !data) {
        return (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-2">Ошибка загрузки</p>
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <button onClick={refresh} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                        Повторить
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, user_stats, group_distribution, daily_chart } = data;

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Шапка ────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            АМ Анализ
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Мониторинг действий сотрудников в модуле Сообщений
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Период */}
                        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {PERIOD_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriodDays(opt.value)}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                        periodDays === opt.value
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {/* Обновить */}
                        <button
                            onClick={refresh}
                            disabled={isLoading}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
                            title="Обновить"
                        >
                            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── KPI карточки ─────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    <KpiCard
                        title="Всего действий"
                        value={summary.total_actions}
                        subtitle={`за ${summary.period_days} дн.`}
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                        bgColor="bg-indigo-50"
                        textColor="text-indigo-600"
                        delay={0}
                    />
                    <KpiCard
                        title="Активных"
                        value={summary.active_users}
                        subtitle="сотрудников"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        bgColor="bg-emerald-50"
                        textColor="text-emerald-600"
                        delay={50}
                    />
                    <KpiCard
                        title="Входы"
                        value={summary.total_dialogs_read}
                        subtitle="в диалоги"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>}
                        bgColor="bg-emerald-50"
                        textColor="text-emerald-600"
                        delay={100}
                    />
                    <KpiCard
                        title="Прочтения"
                        value={summary.total_unread_dialogs_read}
                        subtitle="непрочитанных"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                        bgColor="bg-blue-50"
                        textColor="text-blue-600"
                        delay={125}
                    />
                    <KpiCard
                        title="Отправлено"
                        value={summary.total_messages_sent}
                        subtitle="сообщений"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                        bgColor="bg-amber-50"
                        textColor="text-amber-600"
                        delay={150}
                    />
                    <KpiCard
                        title="Метки"
                        value={summary.total_labels_actions}
                        subtitle="действий"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                        bgColor="bg-violet-50"
                        textColor="text-violet-600"
                        delay={200}
                    />
                    <KpiCard
                        title="Шаблоны"
                        value={summary.total_templates_actions}
                        subtitle="действий"
                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        bgColor="bg-red-50"
                        textColor="text-red-600"
                        delay={250}
                    />
                </div>

                {/* ── Контент: диаграмма + график ─────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Круговая диаграмма */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Распределение по категориям</h2>
                        <GroupPieChart data={group_distribution} />
                    </div>

                    {/* График по дням */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Активность по дням</h2>
                        <DailyChart data={daily_chart} />
                    </div>
                </div>

                {/* ── Таблица сотрудников ─────────────────── */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Действия по сотрудникам
                        <span className="text-gray-400 font-normal ml-2">({user_stats.length})</span>
                    </h2>
                    <UserStatsTable users={user_stats} />
                </div>

            </div>
        </div>
    );
};
