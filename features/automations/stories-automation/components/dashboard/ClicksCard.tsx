import React from 'react';
import { DashboardStats, ChartDataPoint, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';
import { Sparkline } from './Sparkline';

interface ClicksCardProps extends CardAnimationProps {
    stats: DashboardStats;
    history: ChartDataPoint[];
}

/** Карточка #3: Клики и CTR */
export const ClicksCard: React.FC<ClicksCardProps> = ({ stats, history, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors ${animationClass}`} style={animationStyle}>
             <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-semibold">Клики</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1"><AnimatedCounter value={stats.clicks} /></h3>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                </div>
             </div>

             <div className="mt-6 flex items-end gap-3">
                 <div className="flex-1 h-12">
                     <Sparkline data={history.map(h => h.clicks)} colorClass="text-blue-500" fillClass="text-blue-500" animationDelay={500} />
                 </div>
                 <div className="text-right">
                     <div className="flex items-center justify-end gap-1">
                         <p className="text-[10px] text-gray-400 font-bold uppercase">CTR</p>
                         <div className="group relative">
                            <svg className="w-3 h-3 text-gray-400 cursor-help hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl hidden group-hover:block z-50 leading-relaxed text-center pointer-events-none">
                                Click-Through Rate — процент пользователей, перешедших по ссылке (Клики / Просмотры).
                                <div className="absolute bottom-full right-1 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                        </div>
                     </div>
                     <p className="text-lg font-bold text-blue-600"><AnimatedCounter value={stats.ctr} decimals={1} suffix="%" /></p>
                 </div>
             </div>
        </div>
    );
};
