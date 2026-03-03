import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface AveragesCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #6: Среднее просмотров/зрителей + мин/макс зрителей */
export const AveragesCard: React.FC<AveragesCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-center gap-3 hover:border-teal-200 transition-colors ${animationClass}`} style={animationStyle}>
            <p className="text-gray-500 text-xs font-semibold">Среднее на историю</p>
            {/* Средние показатели — в одну строку */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={Math.round(stats.avgViews)} /></p>
                        <p className="text-[10px] text-gray-500">Ø Просмотров</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={Math.round(stats.avgViewers)} /></p>
                        <p className="text-[10px] text-gray-500">Ø Зрителей</p>
                    </div>
                </div>
            </div>

            <div className="h-px w-full bg-gray-100"></div>

            {/* Мин / Макс зрителей */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-50 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={stats.minViewers} /></p>
                        <p className="text-[10px] text-gray-500">Мин</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900"><AnimatedCounter value={stats.maxViewers} /></p>
                        <p className="text-[10px] text-gray-500">Макс</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
