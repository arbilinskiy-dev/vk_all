
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../../../services/api';
import {
    ActivityDashboardResponse,
    UserActivityStat,
    DailyActivityPoint,
    HourlyPoint,
    EventDistribution,
    ActionsSummary,
    UserActionStat,
    DailyActionPoint,
} from '../../../services/api/user_activity.api';
import { AnimatedCounter } from '../../automations/stories-automation/components/dashboard/AnimatedCounter';

// ==========================================
// Вспомогательные функции
// ==========================================

/** Форматирование минут в читаемую длительность */
const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0м';
    if (minutes < 60) return `${Math.round(minutes)}м`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h >= 24) {
        const d = Math.floor(h / 24);
        const remainH = h % 24;
        return remainH > 0 ? `${d}д ${remainH}ч` : `${d}д`;
    }
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
};

/** Форматирование даты */
const formatDate = (isoString: string | null): string => {
    if (!isoString) return 'неизвестно';
    try {
        const date = new Date(isoString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return isoString; }
};

/** Форматирование короткой даты для графика */
const formatShortDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    } catch { return dateStr; }
};

/** Маппинг event_type на русское название */
const EVENT_LABELS: Record<string, string> = {
    login_success: 'Входы',
    login_failed: 'Неудачные входы',
    logout: 'Выходы',
    timeout: 'Таймауты',
    force_logout: 'Принудительные выходы',
};

/** Цвета для типов событий — SVG stroke (hex для SVG) и Tailwind bg-класс */
const EVENT_COLORS: Record<string, { stroke: string; bg: string }> = {
    login_success: { stroke: '#22c55e', bg: 'bg-green-500' },
    login_failed:  { stroke: '#ef4444', bg: 'bg-red-500' },
    logout:        { stroke: '#3b82f6', bg: 'bg-blue-500' },
    timeout:       { stroke: '#f59e0b', bg: 'bg-amber-500' },
    force_logout:  { stroke: '#a855f7', bg: 'bg-purple-500' },
};

const FALLBACK_COLOR = { stroke: '#94a3b8', bg: 'bg-gray-400' };

/** Склонение числительных */
const plural = (n: number, forms: [string, string, string]): string => {
    const abs = Math.abs(n) % 100;
    const n1 = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
};

/** Безопасный максимум массива (без spread) */
const safeMax = (arr: number[], fallback = 1): number => {
    let max = fallback;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
    }
    return max;
};

// ==========================================
// Бизнес-действия: маппинг и цвета
// ==========================================

/** Русские названия категорий действий */
const CATEGORY_LABELS: Record<string, string> = {
    posts: 'Посты',
    messages: 'Сообщения',
    ai: 'AI-генерация',
    market: 'Товары',
    automations: 'Автоматизации',
    settings: 'Настройки',
};

/** Цвета категорий */
const CATEGORY_COLORS: Record<string, string> = {
    posts: '#6366f1',
    messages: '#3b82f6',
    ai: '#8b5cf6',
    market: '#f97316',
    automations: '#22c55e',
    settings: '#6b7280',
};

/** Русские названия типов действий */
const ACTION_LABELS: Record<string, string> = {
    post_save: 'Сохранение поста',
    post_schedule: 'Планирование поста',
    post_publish: 'Публикация поста',
    post_delete: 'Удаление поста',
    post_delete_published: 'Удаление опубликованного',
    post_pin: 'Закрепление поста',
    post_unpin: 'Открепление поста',
    message_send: 'Отправка сообщения',
    ai_generate: 'AI-генерация текста',
    ai_generate_batch: 'AI-пакетная генерация',
    ai_correct: 'AI-коррекция текста',
    ai_bulk_correct: 'AI-массовая коррекция',
    ai_process_text: 'AI-обработка текста',
    ai_variable_setup: 'AI-настройка переменных',
    market_create_item: 'Создание товара',
    market_create_items: 'Массовое создание товаров',
    market_update_item: 'Обновление товара',
    market_update_items: 'Массовое обновление товаров',
    market_delete_items: 'Удаление товаров',
    market_create_album: 'Создание подборки',
    market_delete_album: 'Удаление подборки',
    bulk_edit_apply: 'Массовое редактирование',
};

// ==========================================
// Компонент: Распределение по категориям
// ==========================================
const CategoriesChart: React.FC<{ data: Array<{ category: string; count: number }> }> = ({ data }) => {
    if (!data.length) return <div className="text-center text-gray-400 py-6 text-sm">Нет данных о действиях</div>;
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    const maxCount = safeMax(data.map(d => d.count));

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.category}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-700 font-medium">{CATEGORY_LABELS[item.category] || item.category}</span>
                        <span className="text-gray-500">{item.count} ({Math.round(item.count / total * 100)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(item.count / maxCount) * 100}%`,
                                backgroundColor: CATEGORY_COLORS[item.category] || '#94a3b8',
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ==========================================
// Компонент: Таблица действий по пользователям
// ==========================================
const UserActionsTable: React.FC<{ users: UserActionStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-6 text-sm">Нет данных</div>;

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full table-fixed">
                <thead className="bg-gray-50/80 sticky top-0">
                    <tr className="text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2 text-left w-[22%]">Пользователь</th>
                        <th className="px-3 py-2 text-left w-[14%]">Роль</th>
                        <th className="px-3 py-2 text-center w-[10%]">Всего</th>
                        <th className="px-3 py-2 text-center w-[10%]">Посты</th>
                        <th className="px-3 py-2 text-center w-[10%]">Сообщения</th>
                        <th className="px-3 py-2 text-center w-[10%]">AI</th>
                        <th className="px-3 py-2 text-center w-[10%]">Товары</th>
                        <th className="px-3 py-2 text-left w-[14%]">Последнее</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map((u) => {
                        const catMap: Record<string, number> = {};
                        for (const c of (u.categories ?? [])) catMap[c.category] = c.count;

                        return (
                            <tr key={u.user_id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-2.5 text-sm">
                                    <div className="font-medium text-gray-900">{u.full_name || u.username}</div>
                                    {u.full_name && <div className="text-xs text-gray-400">{u.username}</div>}
                                </td>
                                <td className="px-3 py-2.5">
                                    {u.role_name ? (
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: u.role_color || '#6b7280' }}
                                        >
                                            {u.role_name}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">—</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-sm font-bold text-indigo-600">{u.total_actions}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['posts'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['messages'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['ai'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-center text-sm">{catMap['market'] || <span className="text-gray-300">0</span>}</td>
                                <td className="px-3 py-2.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(u.last_action_at)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ==========================================
// KPI-карточка
// ==========================================
const KpiCard: React.FC<{
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    delay?: number;
}> = ({ title, value, subtitle, icon, color, bgColor, delay = 0 }) => (
    <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-start gap-3 hover:shadow-md transition-shadow opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
            <span className={color}>{icon}</span>
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

// ==========================================
// SVG-график активности по дням
// ==========================================
const DailyChart: React.FC<{ data: DailyActivityPoint[] }> = ({ data }) => {
    if (!data.length) return <div className="text-center text-gray-400 py-8">Нет данных за период</div>;

    const width = 700;
    const height = 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = safeMax(data.map(d => Math.max(d.logins, d.timeouts, d.failed, d.unique_users)));
    const stepX = chartW / Math.max(data.length - 1, 1);

    const makeLine = (key: keyof DailyActivityPoint, color: string) => {
        const points = data.map((d, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH - (Number(d[key]) / maxVal) * chartH;
            return `${x},${y}`;
        });
        return <polyline key={key} points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />;
    };

    // Горизонтальные линии-сетка
    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = padding.top + chartH - frac * chartH;
        const val = Math.round(maxVal * frac);
        return (
            <g key={frac}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="stroke-gray-200" strokeWidth="1" />
                <text x={padding.left - 6} y={y + 4} textAnchor="end" className="text-[10px] fill-gray-400">{val}</text>
            </g>
        );
    });

    // X-подписи: показываем каждую N-ю дату
    const labelStep = data.length > 14 ? Math.ceil(data.length / 10) : 1;
    const xLabels = data.map((d, i) => {
        if (i % labelStep !== 0 && i !== data.length - 1) return null;
        const x = padding.left + i * stepX;
        return (
            <text key={i} x={x} y={height - 6} textAnchor="middle" className="text-[9px] fill-gray-400">
                {formatShortDate(d.date)}
            </text>
        );
    });

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                {gridLines}
                {makeLine('logins', EVENT_COLORS.login_success.stroke)}
                {makeLine('timeouts', EVENT_COLORS.timeout.stroke)}
                {makeLine('failed', EVENT_COLORS.login_failed.stroke)}
                {makeLine('unique_users', '#6366f1')}
                {xLabels}
            </svg>
            <div className="flex flex-wrap gap-4 justify-center mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> Входы</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500 inline-block rounded" /> Таймауты</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block rounded" /> Неудачные</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-500 inline-block rounded" /> Уник. пользователи</span>
            </div>
        </div>
    );
};

// ==========================================
// Тепловая карта по часам
// ==========================================
const HourlyHeatmap: React.FC<{ data: HourlyPoint[] }> = ({ data }) => {
    const maxCount = safeMax(data.map(d => d.count));

    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        const ratio = count / maxCount;
        if (ratio > 0.75) return 'bg-indigo-600 text-white';
        if (ratio > 0.5) return 'bg-indigo-400 text-white';
        if (ratio > 0.25) return 'bg-indigo-300 text-indigo-900';
        return 'bg-indigo-100 text-indigo-700';
    };

    return (
        <div>
            <div className="grid grid-cols-12 gap-1">
                {data.map(h => (
                    <div
                        key={h.hour}
                        className={`rounded text-center py-1.5 text-xs font-medium ${getColor(h.count)} transition-colors`}
                        title={`${h.hour}:00 — ${h.count} входов`}
                    >
                        <div className="text-[10px] opacity-70">{String(h.hour).padStart(2, '0')}</div>
                        <div className="font-bold">{h.count}</div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                <span>Ночь (0–5)</span>
                <span>Утро (6–11)</span>
                <span>День (12–17)</span>
                <span>Вечер (18–23)</span>
            </div>
        </div>
    );
};

// ==========================================
// Распределение событий (горизонтальные бары)
// ==========================================
const EventsDistribution: React.FC<{ data: EventDistribution[] }> = ({ data }) => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (!total) return <div className="text-center text-gray-400 py-4">Нет данных</div>;

    const sorted = [...data].sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-2">
            {sorted.map(d => {
                const pct = ((d.count / total) * 100).toFixed(1);
                const colorObj = EVENT_COLORS[d.event_type] || FALLBACK_COLOR;
                return (
                    <div key={d.event_type}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-gray-600">{EVENT_LABELS[d.event_type] || d.event_type}</span>
                            <span className="text-gray-500 font-medium">{d.count} — {pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-[width] duration-500 ${colorObj.bg}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ==========================================
// Таблица пользователей
// ==========================================
const UserStatsTable: React.FC<{ users: UserActivityStat[] }> = ({ users }) => {
    if (!users.length) return <div className="text-center text-gray-400 py-8">Нет данных</div>;

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Входов</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Неудачн.</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Таймаутов</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Сред. сессия</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Всего времени</th>
                        <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Сессий</th>
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последнее событие</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((u, i) => (
                        <tr key={u.user_id} className="hover:bg-gray-50 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 30}ms` }}>
                            <td className="px-3 py-2.5">
                                <div className="text-sm font-medium text-gray-800">{u.username}</div>
                                {u.full_name && <div className="text-xs text-gray-400">{u.full_name}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                                {u.is_online ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Онлайн
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                        Офлайн
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm font-semibold text-green-600">{u.login_count}</td>
                            <td className="px-3 py-2.5 text-center text-sm">
                                {u.failed_count > 0
                                    ? <span className="text-red-600 font-semibold">{u.failed_count}</span>
                                    : <span className="text-gray-300">0</span>
                                }
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm">
                                {u.timeout_count > 0
                                    ? <span className="text-amber-600 font-semibold">{u.timeout_count}</span>
                                    : <span className="text-gray-300">0</span>
                                }
                            </td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-600">{formatMinutes(u.avg_session_minutes)}</td>
                            <td className="px-3 py-2.5 text-center text-sm font-medium text-indigo-600">{formatMinutes(u.total_time_minutes)}</td>
                            <td className="px-3 py-2.5 text-center text-sm text-gray-500">{u.session_count}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-500 whitespace-nowrap">{formatDate(u.last_event_at)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
export const UserActivityDashboard: React.FC = () => {
    const [data, setData] = useState<ActivityDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [periodDays, setPeriodDays] = useState(30);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await api.getUserActivityDashboard({ period_days: periodDays });
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
        }
    }, [periodDays]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const periods = [
        { label: '7 дней', value: 7 },
        { label: '14 дней', value: 14 },
        { label: '30 дней', value: 30 },
        { label: '90 дней', value: 90 },
    ];

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
                        {periods.map(p => (
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
                /* Скелетон загрузки */
                <div className="space-y-6">
                    {/* KPI-скелетоны */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
                                    <div className="h-6 bg-gray-200 rounded animate-pulse w-12" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Графики-скелетоны */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-40 mb-3" />
                            <div className="h-48 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '520ms' }}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-36 mb-3" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, j) => (
                                    <div key={j}>
                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24 mb-1" />
                                        <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Heatmap-скелетон */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-52 mb-3" />
                        <div className="grid grid-cols-12 gap-1">
                            {Array.from({ length: 24 }).map((_, k) => (
                                <div key={k} className="h-12 bg-gray-100 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>
                    {/* Таблица-скелетон */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '680ms' }}>
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                        </div>
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, r) => (
                                <div key={r} className="flex gap-4">
                                    <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
                                    <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
                                    <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                                    <div className="h-4 bg-gray-100 rounded animate-pulse w-12" />
                                    <div className="h-4 bg-gray-100 rounded animate-pulse flex-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
                        {/* График активности по дням */}
                        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Активность по дням</h3>
                            <DailyChart data={data.daily_chart ?? []} />
                        </div>

                        {/* Распределение событий */}
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
                            {/* Распределение по категориям */}
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Распределение по категориям</h3>
                                <CategoriesChart data={data.actions_summary.top_categories ?? []} />
                            </div>

                            {/* Топ действий */}
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
