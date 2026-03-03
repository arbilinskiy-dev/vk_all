import React from 'react';
import { DashboardStats, CardAnimationProps } from './types';
import { AnimatedCounter } from './AnimatedCounter';

interface BudgetCardProps extends CardAnimationProps {
    stats: DashboardStats;
}

/** Карточка #2: Эквивалент в рекламе */
export const BudgetCard: React.FC<BudgetCardProps> = ({ stats, animationClass, animationStyle }) => {
    return (
        <div className={`col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors ${animationClass}`} style={animationStyle}>
             <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-1.5">
                        <p className="text-gray-500 text-sm font-semibold">Эквивалент в рекламе</p>
                        <div className="group relative">
                            <svg className="w-4 h-4 text-gray-400 cursor-help hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl hidden group-hover:block z-50 leading-relaxed text-center pointer-events-none">
                                Примерная стоимость получения такого же охвата через официальную таргетированную рекламу (CPM ≈ 150₽ за 1000 показов).
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-emerald-600 mt-2">
                        <AnimatedCounter value={stats.moneySaved} duration={1500} suffix=" ₽" />
                    </h3>
                </div>
                <div className="p-2 bg-emerald-50 rounded-xl">
                     <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
             </div>

             <div className="mt-4">
                <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs font-medium text-emerald-800 inline-block">
                    Вы сэкономили бюджет
                </div>
             </div>
        </div>
    );
};
