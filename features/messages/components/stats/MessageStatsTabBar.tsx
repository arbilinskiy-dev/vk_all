/**
 * Переключатель вкладок мониторинга сообщений.
 * Входящие / Исходящие / Подписки / Сотрудники.
 */

import React from 'react';
import { STATS_TAB_OPTIONS } from './messageStatsConstants';
import type { StatsTab } from './messageStatsConstants';

/** Маппинг цветов для активных вкладок */
const TAB_COLOR_MAP: Record<string, string> = {
    incoming: 'bg-green-100 text-green-700 shadow-sm',
    outgoing: 'bg-orange-100 text-orange-700 shadow-sm',
    subscriptions: 'bg-blue-100 text-blue-700 shadow-sm',
    employees: 'bg-purple-100 text-purple-700 shadow-sm',
};

/** Маппинг цветов для индикатора-точки */
const DOT_COLOR_MAP: Record<string, string> = {
    incoming: 'bg-green-500',
    outgoing: 'bg-orange-500',
    subscriptions: 'bg-blue-500',
    employees: 'bg-purple-500',
};

interface MessageStatsTabBarProps {
    /** Активная вкладка */
    activeTab: StatsTab;
    /** Переключение вкладки */
    onTabChange: (tab: StatsTab) => void;
}

export const MessageStatsTabBar: React.FC<MessageStatsTabBarProps> = ({
    activeTab,
    onTabChange,
}) => (
    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
        {STATS_TAB_OPTIONS.map(tab => {
            const isActive = activeTab === tab.value;
            const activeClasses = TAB_COLOR_MAP[tab.value] || 'bg-gray-100 text-gray-700 shadow-sm';
            return (
                <button
                    key={tab.value}
                    onClick={() => onTabChange(tab.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        isActive
                            ? activeClasses
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${
                        DOT_COLOR_MAP[tab.value] || 'bg-gray-500'
                    }`} />
                    {tab.label}
                </button>
            );
        })}
    </div>
);
