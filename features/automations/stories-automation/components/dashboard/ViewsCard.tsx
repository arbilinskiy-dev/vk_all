import React from 'react';
import { DashboardStats, ChartDataPoint, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';
import { Sparkline } from './Sparkline';

interface ViewsCardProps extends CardAnimationProps {
    stats: DashboardStats;
    history: ChartDataPoint[];
}

/** Карточка #1: Сумма показов (большая, 2 колонки) */
export const ViewsCard: React.FC<ViewsCardProps> = ({ stats, history, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 md:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden group flex flex-col justify-between hover:border-indigo-300 transition-colors ${animationClass}`} style={animationStyle}>
             <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-gray-500 text-sm font-semibold">Сумма показов</p>
                    <h3 className="text-4xl font-extrabold text-indigo-900 mt-2 tracking-tight">
                        <AnimatedCounter value={stats.views} duration={1500} />
                    </h3>
                </div>
                <div className="p-2 bg-indigo-50 rounded-xl">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </div>
            </div>
            
            <div className="mt-6 h-16 w-full -mb-2">
                 {/* График просмотров (Indigo) */}
                 <Sparkline data={history.map(h => h.views)} colorClass="text-indigo-500" fillClass="text-indigo-500" animationDelay={300} />
            </div>
        </div>
    );
};
