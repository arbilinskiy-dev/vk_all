import React from 'react';
import { DailyActivityPoint } from '../../../../services/api/user_activity.api';
import { formatShortDate, safeMax } from './utils';
import { EVENT_COLORS } from './constants';

// ==========================================
// SVG-график активности по дням
// ==========================================
export const DailyChart: React.FC<{ data: DailyActivityPoint[] }> = ({ data }) => {
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
