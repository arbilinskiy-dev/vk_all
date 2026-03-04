import React, { useState } from 'react';
import { MockStatCard } from './ListsStatsMocks_Shared';

// =====================================================================
// Mock-компоненты графиков и диаграмм
// =====================================================================

// 8. Возраст (столбчатая диаграмма)
export const MockAgeCard: React.FC = () => {
    const data = [
        { label: '<16', value: 234 },
        { label: '16-20', value: 1892 },
        { label: '20-25', value: 3456 },
        { label: '25-30', value: 2876 },
        { label: '30-35', value: 1567 },
        { label: '35-40', value: 892 },
        { label: '40-45', value: 534 },
        { label: '45+', value: 423 }
    ];
    const unknown = 584;
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="md:col-span-2 xl:col-span-2">
            <MockStatCard title="Возраст">
                <div className="space-y-4">
                    <div className="flex items-end justify-between gap-2 h-40">
                        {data.map((item, idx) => {
                            const heightPercent = (item.value / maxValue) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group">
                                    <div className="text-xs font-semibold text-purple-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.value.toLocaleString()}
                                    </div>
                                    <div 
                                        className="w-full bg-purple-300 group-hover:bg-purple-400 rounded-t transition-colors"
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    <div className="text-xs text-gray-600 mt-2">{item.label}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-600">Не указано</span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {unknown.toLocaleString()}
                        </span>
                    </div>
                </div>
            </MockStatCard>
        </div>
    );
};

// 9. Дни рождения (столбчатая диаграмма)
export const MockBirthdayCard: React.FC = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const data = [423, 534, 678, 892, 1234, 1567, 1892, 2145, 1876, 1456, 987, 756];
    const unknown = 892;
    const currentMonth = 1; // Февраль (индекс 1)
    const maxValue = Math.max(...data);

    return (
        <div className="md:col-span-2 xl:col-span-2">
            <MockStatCard title="Дни рождения">
                <div className="space-y-4">
                    <div className="flex items-end justify-between gap-1 h-40">
                        {data.map((value, idx) => {
                            const heightPercent = (value / maxValue) * 100;
                            const isCurrent = idx === currentMonth;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group">
                                    <div className={`text-xs font-semibold mb-1 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'text-indigo-700' : 'text-indigo-600'}`}>
                                        {value.toLocaleString()}
                                    </div>
                                    <div 
                                        className={`w-full rounded-t transition-colors ${
                                            isCurrent 
                                                ? 'bg-indigo-600' 
                                                : 'bg-indigo-300 group-hover:bg-indigo-400'
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    <div className="text-xs text-gray-600 mt-2">{months[idx]}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-600">Не указано</span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {unknown.toLocaleString()}
                        </span>
                    </div>
                </div>
            </MockStatCard>
        </div>
    );
};

// 10. География (круговая диаграмма)
export const MockGeoCard: React.FC = () => {
    const data = [
        { label: 'Москва', value: 3456, color: '#6366f1' },
        { label: 'Санкт-Петербург', value: 2145, color: '#ec4899' },
        { label: 'Казань', value: 1234, color: '#3b82f6' },
        { label: 'Екатеринбург', value: 892, color: '#10b981' },
        { label: 'Нижний Новгород', value: 678, color: '#f59e0b' }
    ];
    const other = 3053;
    const total = data.reduce((sum, item) => sum + item.value, 0) + other;

    // Простая круговая диаграмма через CSS conic-gradient
    let currentAngle = 0;
    const segments = [...data, { label: 'Прочие', value: other, color: '#6b7280' }];
    const gradientStops = segments.map(item => {
        const angle = (item.value / total) * 360;
        const stop = `${item.color} ${currentAngle}deg ${currentAngle + angle}deg`;
        currentAngle += angle;
        return stop;
    }).join(', ');

    return (
        <MockStatCard title="География">
            <div className="flex items-start gap-4">
                <div 
                    className="w-32 h-32 rounded-full flex-shrink-0"
                    style={{ background: `conic-gradient(${gradientStops})` }}
                ></div>
                <div className="flex-1 space-y-2">
                    {segments.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                            <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-gray-700 flex-1">{item.label}</span>
                            <span className="font-semibold text-gray-900">
                                {Math.round((item.value / total) * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </MockStatCard>
    );
};

// =====================================================================
// Mock линейного графика (с поддержкой period и metric)
// =====================================================================

export const MockLineChart: React.FC<{
    period: 'day' | 'week' | 'month';
    metric: 'views' | 'likes' | 'comments' | 'reposts';
}> = ({ period, metric }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Генерация mock-данных на основе периода и метрики
    const generateData = (period: string, metric: string) => {
        const multipliers = { 
            views: 1000, 
            likes: 50, 
            comments: 10, 
            reposts: 5 
        };
        const mult = multipliers[metric as keyof typeof multipliers];
        
        if (period === 'day') {
            return Array.from({ length: 7 }, (_, i) => ({
                date: `${20 + i}.02`,
                value: Math.floor(Math.random() * mult) + mult
            }));
        } else if (period === 'week') {
            return Array.from({ length: 4 }, (_, i) => ({
                date: `Нед. ${i + 1}`,
                value: Math.floor(Math.random() * mult * 7) + mult * 7
            }));
        } else {
            return Array.from({ length: 6 }, (_, i) => ({
                date: ['Сен', 'Окт', 'Ноя', 'Дек', 'Янв', 'Фев'][i],
                value: Math.floor(Math.random() * mult * 30) + mult * 30
            }));
        }
    };

    const data = generateData(period, metric);
    
    const colors = { 
        views: '#6b7280', 
        likes: '#ec4899', 
        comments: '#3b82f6', 
        reposts: '#9333ea' 
    };
    
    const labels = { 
        views: 'Просмотры', 
        likes: 'Лайки', 
        comments: 'Комментарии', 
        reposts: 'Репосты' 
    };
    
    const color = colors[metric];
    const label = labels[metric];

    if (data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-400">
                Нет данных для графика
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const width = 800;
    const height = 320;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Генерация точек для polyline
    const points = data.map((item, index) => {
        const x = padding.left + (index / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (item.value / maxValue) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative">
            <div className="mb-2 text-sm font-medium text-gray-700">{label}</div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-80">
                {/* Сетка */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = padding.top + chartHeight * (1 - ratio);
                    return (
                        <g key={idx}>
                            <line 
                                x1={padding.left} 
                                y1={y} 
                                x2={width - padding.right} 
                                y2={y} 
                                stroke="#e5e7eb" 
                                strokeWidth="1"
                            />
                            <text 
                                x={padding.left - 10} 
                                y={y + 4} 
                                textAnchor="end" 
                                fontSize="12" 
                                fill="#6b7280"
                            >
                                {Math.round(maxValue * ratio)}
                            </text>
                        </g>
                    );
                })}

                {/* Линия графика */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                />

                {/* Точки данных */}
                {data.map((item, index) => {
                    const x = padding.left + (index / (data.length - 1)) * chartWidth;
                    const y = padding.top + chartHeight - (item.value / maxValue) * chartHeight;
                    const isHovered = hoveredIndex === index;

                    return (
                        <g key={index}>
                            <circle
                                cx={x}
                                cy={y}
                                r={isHovered ? 6 : 4}
                                fill={color}
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                            {isHovered && (
                                <g>
                                    <rect
                                        x={x - 40}
                                        y={y - 35}
                                        width="80"
                                        height="30"
                                        fill="#1f2937"
                                        rx="4"
                                    />
                                    <text
                                        x={x}
                                        y={y - 23}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fill="white"
                                        fontWeight="bold"
                                    >
                                        {item.value}
                                    </text>
                                    <text
                                        x={x}
                                        y={y - 12}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="#9ca3af"
                                    >
                                        {item.date}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Метки оси X */}
                {data.map((item, index) => {
                    if (index % Math.ceil(data.length / 6) !== 0 && index !== data.length - 1) return null;
                    const x = padding.left + (index / (data.length - 1)) * chartWidth;
                    return (
                        <text
                            key={index}
                            x={x}
                            y={height - padding.bottom + 20}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#6b7280"
                        >
                            {item.date}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
