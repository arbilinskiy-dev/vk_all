import React, { useState } from 'react';
import { NavigationButtons, ContentProps } from '../shared';
import { FiltersSection } from './ProductsStoriesDashboardPage_FiltersSection';
import { MetricsSection } from './ProductsStoriesDashboardPage_MetricsSection';
import { CalculatedSection } from './ProductsStoriesDashboardPage_CalculatedSection';
import { ScenariosSection } from './ProductsStoriesDashboardPage_ScenariosSection';

// =====================================================================
// Страница центра обучения: Дашборд сторис для товаров
// Хаб-контейнер — секции вынесены в отдельные файлы
// =====================================================================
export const ProductsStoriesDashboardPage: React.FC<ContentProps> = ({ title }) => {
    // Состояния для интерактивных демо
    const [periodFilter, setPeriodFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [demoViews] = useState<number[]>([1200, 1500, 1800, 2200, 2800, 3100, 2900]);

    return (
        <article className="prose max-w-none">
            {/* Заголовок страницы */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение */}
            <p className="!text-base !leading-relaxed !text-gray-700">
                Дашборд эффективности — это главный экран для анализа результатов публикации историй. 
                Здесь собраны все ключевые показатели: охваты, клики, вовлечённость и экономия бюджета. 
                Система автоматически рассчитывает метрики и показывает тренды на графиках.
            </p>

            <div className="not-prose bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 mb-8">
                <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Для чего нужен дашборд?</p>
                        <p>Раньше приходилось заходить в каждую историю VK и смотреть статистику вручную. 
                        Теперь все данные собраны в одном месте, с автоматическими расчётами CTR, ER и экономии бюджета.</p>
                    </div>
                </div>
            </div>

            {/* Раздел 1: Система фильтров */}
            <FiltersSection
                periodFilter={periodFilter}
                setPeriodFilter={setPeriodFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
            />

            {/* Раздел 2: Метрики дашборда */}
            <MetricsSection demoViews={demoViews} />

            {/* Раздел 3: Расчётные показатели */}
            <CalculatedSection />

            {/* Раздел 4: Сценарии использования + советы */}
            <ScenariosSection />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-1-4-dashboard" />
        </article>
    );
};
