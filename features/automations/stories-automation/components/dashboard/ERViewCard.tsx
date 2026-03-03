import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface ERViewCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #7: ER View */
export const ERViewCard: React.FC<ERViewCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-5 border border-indigo-100 shadow-sm flex items-center justify-between ${animationClass}`} style={animationStyle}>
            <div>
                <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-xs text-indigo-400 font-bold uppercase">ER View</p>
                    <div className="group relative">
                        <svg className="w-3 h-3 text-indigo-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="absolute bottom-full left-0 mb-2 w-52 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl hidden group-hover:block z-50 text-center pointer-events-none">
                            Engagement Rate View — (Лайки + Репосты + Ответы) / Просмотры.
                            <div className="absolute top-full left-1 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
                <p className="text-2xl font-black text-indigo-600"><AnimatedCounter value={stats.er} decimals={1} suffix="%" /></p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-xl">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
        </div>
    );
};
