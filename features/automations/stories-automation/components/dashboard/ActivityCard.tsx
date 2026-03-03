import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface ActivityCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #4: Активность (лайки, репосты, ответы) */
export const ActivityCard: React.FC<ActivityCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col hover:border-pink-300 transition-colors ${animationClass}`} style={animationStyle}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="text-gray-500 text-xs font-semibold">Активность</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                        <AnimatedCounter value={stats.likes + stats.shares + stats.replies} />
                    </h3>
                </div>
                <div className="p-1.5 bg-pink-50 rounded-lg">
                    <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
            </div>
            <div className="space-y-1.5 mt-auto text-xs">
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-pink-500"></span> Лайки
                    </span>
                    <span className="font-bold text-gray-900"><AnimatedCounter value={stats.likes} /></span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-purple-500"></span> Репосты
                    </span>
                    <span className="font-bold text-gray-900"><AnimatedCounter value={stats.shares} /></span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-blue-500"></span> Ответы
                    </span>
                    <span className="font-bold text-gray-900"><AnimatedCounter value={stats.replies + stats.msg} /></span>
                </div>
            </div>
        </div>
    );
};
