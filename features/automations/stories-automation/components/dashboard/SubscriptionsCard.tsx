import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface SubscriptionsCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #6: Подписки + Скрытия */
export const SubscriptionsCard: React.FC<SubscriptionsCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center gap-3 hover:border-orange-200 transition-colors ${animationClass}`} style={animationStyle}>
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={stats.subscribers} /></p>
                    <p className="text-[10px] text-gray-500">Подписок</p>
                </div>
            </div>
            <div className="h-px w-full bg-gray-100"></div>
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                </div>
                <div>
                    <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={stats.hides} /></p>
                    <p className="text-[10px] text-gray-500">Скрытий</p>
                </div>
            </div>
        </div>
    );
};
