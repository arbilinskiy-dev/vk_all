import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface StoriesCountCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #5: Количество историй + Подписки/Скрытия */
export const StoriesCountCard: React.FC<StoriesCountCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col gap-3 hover:border-indigo-200 transition-colors ${animationClass}`} style={animationStyle}>
            <p className="text-gray-500 text-xs font-semibold">Истории и охват</p>
            <div className="flex items-center justify-between">
            {/* Слева: иконка + количество историй */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-xl shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900"><AnimatedCounter value={stats.count} /></p>
                    <p className="text-xs text-gray-500 font-medium">Историй</p>
                </div>
            </div>

            {/* Справа: подписки и скрытия */}
            <div className="flex flex-col gap-2 items-start">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900"><AnimatedCounter value={stats.subscribers} /></p>
                        <p className="text-[9px] text-gray-400">Подписок</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900"><AnimatedCounter value={stats.hides} /></p>
                        <p className="text-[9px] text-gray-400">Скрытий</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};
