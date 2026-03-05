/**
 * Страница «АМ Анализ» — мониторинг действий сотрудников в модуле Сообщений.
 * Отображает: KPI-карточки, таблицу по сотрудникам, круговую диаграмму, график по дням.
 * Доступна администраторам через сайдбар → Сообщения → АМ Анализ.
 */

import React, { useMemo } from 'react';
import { useAmAnalysis } from '../../hooks/stats/useAmAnalysis';
import { AmUserStat, AmGroupDistribution, AmDailyPoint } from '../../../../services/api/am_analysis.api';

// ─── Константы ──────────────────────────────────────────────────

const PERIOD_OPTIONS = [
    { label: '7 дней', value: 7 },
    { label: '14 дней', value: 14 },
    { label: '30 дней', value: 30 },
    { label: '90 дней', value: 90 },
];

/** Цвета для групп действий */
const GROUP_COLORS: Record<string, string> = {
    dialogs: '#6366f1',    // indigo
    messages: '#10b981',   // emerald
    labels: '#f59e0b',     // amber
    templates: '#8b5cf6',  // violet
    promocodes: '#ef4444', // red
};

const GROUP_BG_COLORS: Record<string, string> = {
    dialogs: 'bg-indigo-50',
    messages: 'bg-emerald-50',
    labels: 'bg-amber-50',
    templates: 'bg-violet-50',
    promocodes: 'bg-red-50',
};

const GROUP_TEXT_COLORS: Record<string, string> = {
    dialogs: 'text-indigo-600',
    messages: 'text-emerald-600',
    labels: 'text-amber-600',
    templates: 'text-violet-600',
    promocodes: 'text-red-600',
};

// ─── Утилиты ────────────────────────────────────────────────────

const formatDate = (isoString: string | null): string => {
    if (!isoString) return '—';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return isoString; }
};

const formatShortDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch { return dateStr; }
};

const safeMax = (arr: number[]): number => Math.max(...arr, 1);

// ─── KPI-карточка ───────────────────────────────────────────────

const KpiCard: React.FC<{
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    delay?: number;
}> = ({ title, value, subtitle, icon, bgColor, textColor, delay = 0 }) => (
    <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={textColor}>{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

// ─── Круговая диаграмма по группам ──────────────────────────────

const GroupPieChart: React.FC<{ data: AmGroupDistribution[] }> = ({ data }) => {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const r = 80;

    let cumulativeAngle = -Math.PI / 2;
    const slices = data.map(d => {
        const angle = (d.count / total) * 2 * Math.PI;
        const startAngle = cumulativeAngle;
        cumulativeAngle += angle;
        const endAngle = cumulativeAngle;

        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;

        return {
            ...d,
            path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`,
            color: GROUP_COLORS[d.group] || '#9ca3af',
            pct: Math.round((d.count / total) * 100),
        };
    });

    return (
        <div className="flex items-center gap-6">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((s, i) => (
                    <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
                ))}
                {/* Центральный круг */}
                <circle cx={cx} cy={cy} r={35} fill="white" />
                <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-bold fill-gray-800">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" className="text-[10px] fill-gray-400">действий</text>
            </svg>
            <div className="space-y-2">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-gray-600">{s.label}</span>
                        <span className="font-semibold text-gray-800 ml-auto">{s.count}</span>
                        <span className="text-gray-400 text-xs w-8 text-right">{s.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── График по дням ─────────────────────────────────────────────

const DailyChart: React.FC<{ data: AmDailyPoint[] }> = ({ data }) => {
    if (!data.length) return <div className="text-center text-gray-400 py-8">Нет данных за период</div>;

    const width = 700;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = safeMax(data.map(d => Math.max(d.total, d.dialogs_read, d.unread_dialogs_read || 0, d.messages_sent)));
    const stepX = chartW / Math.max(data.length - 1, 1);

    const makeLine = (key: keyof AmDailyPoint, color: string) => {
        const points = data.map((d, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH - (Number(d[key]) / maxVal) * chartH;
            return `${x},${y}`;
        });
        return <polyline key={key} points={points.join(' ')} fill="none" stroke={color} strokeWidth={2} />;
    };

    // Ось X: даты
    const showEveryN = Math.max(1, Math.floor(data.length / 8));

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Сетка */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = padding.top + chartH * (1 - pct);
                return (
                    <g key={pct}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y}
                            stroke="#e5e7eb" strokeDasharray="4" />
                        <text x={padding.left - 4} y={y + 3} textAnchor="end"
                            className="text-[10px] fill-gray-400">{Math.round(maxVal * pct)}</text>
                    </g>
                );
            })}

            {/* Линии */}
            {makeLine('total', '#6366f1')}
            {makeLine('dialogs_read', '#10b981')}
            {makeLine('unread_dialogs_read', '#3b82f6')}
            {makeLine('messages_sent', '#f59e0b')}

            {/* Ось X: даты */}
            {data.map((d, i) => {
                if (i % showEveryN !== 0 && i !== data.length - 1) return null;
                const x = padding.left + i * stepX;
                return (
                    <text key={i} x={x} y={height - 4} textAnchor="middle"
                        className="text-[10px] fill-gray-400">{formatShortDate(d.date)}</text>
                );
            })}

            {/* Легенда */}
            {[
                { label: 'Всего', color: '#6366f1', x: padding.left },
                { label: 'Входы', color: '#10b981', x: padding.left + 80 },
                { label: 'Прочтения', color: '#3b82f6', x: padding.left + 155 },
                { label: 'Отправлено', color: '#f59e0b', x: padding.left + 260 },
            ].map(l => (
                <g key={l.label}>
                    <rect x={l.x} y={2} width={10} height={10} rx={2} fill={l.color} />
                    <text x={l.x + 14} y={11} className="text-[11px] fill-gray-500">{l.label}</text>
                </g>
            ))}
        </svg>
    );
};

// ─── Таблица сотрудников ────────────────────────────────────────

const UserStatsTable: React.FC<{ users: AmUserStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 text-left">
                        <th className="py-2 px-3 font-semibold text-gray-600">Сотрудник</th>
                        <th className="py-2 px-3 font-semibold text-gray-600">Роль</th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">Всего</th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Входы в диалоги">💬 Входы</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Прочтение непрочитанных диалогов">📖 Прочтения</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Отправка сообщений">💬 Отправлено</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Пометка как непрочитанное">🔕 Непрочит.</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Пометка как важное">⭐ Важное</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с метками">🏷️ Метки</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с шаблонами">📝 Шаблоны</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">
                            <span title="Действия с промокодами">🎟️ Промо</span>
                        </th>
                        <th className="py-2 px-3 font-semibold text-gray-600 text-right">Последнее</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-3">
                                <div className="font-medium text-gray-800">
                                    {u.full_name || u.username}
                                </div>
                                {u.full_name && (
                                    <div className="text-xs text-gray-400">@{u.username}</div>
                                )}
                            </td>
                            <td className="py-2 px-3">
                                {u.role_name ? (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: u.role_color ? `${u.role_color}20` : '#f3f4f6',
                                            color: u.role_color || '#6b7280',
                                            border: `1px solid ${u.role_color || '#d1d5db'}30`,
                                        }}
                                    >
                                        {u.role_name}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-gray-800">{u.total_actions}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-medium">{u.dialogs_read || '—'}</td>
                            <td className="py-2 px-3 text-right text-blue-600 font-medium">{u.unread_dialogs_read || '—'}</td>
                            <td className="py-2 px-3 text-right text-cyan-600 font-medium">{u.messages_sent || '—'}</td>
                            <td className="py-2 px-3 text-right text-gray-500">{u.mark_unread || '—'}</td>
                            <td className="py-2 px-3 text-right text-amber-500">{u.toggle_important || '—'}</td>
                            <td className="py-2 px-3 text-right text-violet-600">{u.labels || '—'}</td>
                            <td className="py-2 px-3 text-right text-indigo-600">{u.templates || '—'}</td>
                            <td className="py-2 px-3 text-right text-red-500">{u.promocodes || '—'}</td>
                            <td className="py-2 px-3 text-right text-xs text-gray-400">
                                {formatDate(u.last_action_at)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Главный компонент ──────────────────────────────────────────

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
