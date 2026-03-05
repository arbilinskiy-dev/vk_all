
import React from 'react';
import { ListStats } from '../../../services/api/lists.api';
import { PostsStatsView } from './statistics/PostsStatsView';
import { UserStatsView } from './statistics/UserStatsView';
import { StatsPeriod, StatsGroupBy, FilterCanWrite } from '../types';

interface ListStatisticsPanelProps {
    stats: ListStats | null;
    isLoading: boolean;
    listType: 'subscribers' | 'history_join' | 'history_leave' | 'history_timeline' | 'posts' | 'likes' | 'comments' | 'reposts' | 'mailing';
    statsPeriod?: StatsPeriod;
    statsGroupBy?: StatsGroupBy;
    onParamsChange?: (period: StatsPeriod, groupBy: StatsGroupBy, dateFrom?: string, dateTo?: string, filterCanWrite?: FilterCanWrite) => void;
    filterCanWrite?: FilterCanWrite;
}

export const ListStatisticsPanel: React.FC<ListStatisticsPanelProps> = React.memo(({ 
    stats, 
    isLoading, 
    listType,
    statsPeriod,
    statsGroupBy,
    onParamsChange,
    filterCanWrite
}) => {
    // Скелетон, соответствующий реальному layout по типу списка
    if (isLoading && !stats) {
        const isMailing = listType === 'mailing';
        // Рассылка: 8 карточек (Quality, MailingStatus, Lifetime, LastContact, Geo, Demo, Platforms, Online)
        // Остальные: 4 карточки (Quality, Geo, Demo, Platforms/Online)
        const cardCount = isMailing ? 8 : 4;

        return (
            <div className="flex flex-col gap-4 mb-4 animate-pulse">
                {/* Скелетон графика динамики (только для рассылки) */}
                {isMailing && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="h-3 w-56 bg-gray-200 rounded mb-4" />
                        {/* Панель контролов */}
                        <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-50 p-3 rounded-md">
                            <div className="h-6 w-20 bg-gray-200 rounded" />
                            <div className="flex gap-1">
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <div key={j} className="h-6 w-16 bg-gray-100 rounded" />
                                ))}
                            </div>
                            <div className="h-6 w-20 bg-gray-200 rounded ml-auto" />
                            <div className="flex gap-1">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="h-6 w-14 bg-gray-100 rounded" />
                                ))}
                            </div>
                        </div>
                        {/* Область графика */}
                        <div className="h-48 flex items-end gap-1 border-b border-gray-100 px-2">
                            {Array.from({ length: 20 }).map((_, j) => (
                                <div
                                    key={j}
                                    className="flex-1 bg-gray-100 rounded-t-sm"
                                    style={{ height: `${10 + Math.abs(Math.sin(j * 0.5)) * 80}%`, animationDelay: `${j * 30}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Скелетон карточек статистики */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {Array.from({ length: cardCount }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="h-3 w-24 bg-gray-200 rounded mb-4" style={{ animationDelay: `${i * 80}ms` }} />
                            <div className="space-y-3">
                                <div className="h-3 w-full bg-gray-100 rounded" />
                                <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Скелетон графиков (Возраст 8 столбцов + Дни рождения 12 столбцов, рядом) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[8, 12].map((bars, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
                            <div className="h-28 flex items-end gap-1.5 border-b border-gray-100">
                                {Array.from({ length: bars }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="flex-1 bg-gray-100 rounded-t-sm"
                                        style={{ height: `${15 + Math.abs(Math.sin((j + i * 3) * 0.7)) * 70}%`, animationDelay: `${j * 40}ms` }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-1.5 mt-1.5">
                                {Array.from({ length: bars }).map((_, j) => (
                                    <div key={j} className="flex-1 h-2 bg-gray-100 rounded" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    // Отображение статистики постов
    if (listType === 'posts' && stats.post_stats) {
        return (
            <PostsStatsView 
                postStats={stats.post_stats} 
                statsPeriod={statsPeriod}
                statsGroupBy={statsGroupBy}
                onParamsChange={onParamsChange as any}
                isLoading={isLoading}
            />
        );
    }

    // Отображение статистики пользователей (Подписчики, История, Активности, Рассылка)
    return (
        <UserStatsView 
            stats={stats} 
            isLoading={isLoading} 
            listType={listType}
            statsPeriod={statsPeriod}
            statsGroupBy={statsGroupBy}
            onParamsChange={onParamsChange}
            filterCanWrite={filterCanWrite}
        />
    );
});
