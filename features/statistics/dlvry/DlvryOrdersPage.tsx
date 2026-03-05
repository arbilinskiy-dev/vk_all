/**
 * Страница DLVRY — ХАБ-контейнер.
 * Объединяет табы «Статистика продаж» (API) и «Заказы» (вебхуки).
 * Показывается в модуле «Статистика» при activeView === 'stats-dlvry'.
 */

import React, { useState } from 'react';
import { Project } from '../../../shared/types';
import { WelcomeScreen } from '../../../shared/components/WelcomeScreen';
import { SalesTabContent } from './SalesTabContent';
import { OrdersTabContent } from './OrdersTabContent';

type DlvryTab = 'sales' | 'orders';

interface DlvryOrdersPageProps {
    project: Project | null;
}

export const DlvryOrdersPage: React.FC<DlvryOrdersPageProps> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<DlvryTab>('sales');

    if (!project) {
        return <WelcomeScreen />;
    }

    if (!project.dlvry_affiliate_id) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">DLVRY не настроен</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Для отображения данных DLVRY необходимо указать <span className="font-medium">Affiliate ID</span> в настройках проекта
                        (раздел «Интеграции»).
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Настройки проекта → Интеграции → DLVRY
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
            {/* Заголовок + Табы */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200">
                <div className="px-6 pt-5 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                DLVRY
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {project.name} · Affiliate: {project.dlvry_affiliate_id}
                            </p>
                        </div>
                    </div>

                    {/* Табы */}
                    <div className="flex gap-0 -mb-px">
                        <button
                            onClick={() => setActiveTab('sales')}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'sales'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Статистика продаж
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'orders'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Заказы
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Контент табов */}
            {activeTab === 'sales' ? (
                <SalesTabContent project={project} />
            ) : (
                <OrdersTabContent project={project} />
            )}
        </div>
    );
};
