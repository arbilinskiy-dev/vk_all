import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { DashboardSection } from './ProductsStoriesStatsPage_DashboardSection';
import { TableSection } from './ProductsStoriesStatsPage_TableSection';
import { ScenariosSection } from './ProductsStoriesStatsPage_ScenariosSection';

/**
 * Обучающая страница: "2.4.1.3. Статистика"
 *
 * Хаб-компонент: собирает секции дашборда, таблицы и сценариев.
 * Mock-компоненты вынесены в ProductsStoriesStatsPage_MockComponents.tsx.
 */
export const ProductsStoriesStatsPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Страница статистики показывает результаты работы автоматизации историй. Здесь вы видите два главных блока: 
                дашборд с общими метриками эффективности и детальная таблица всех опубликованных историй.
            </p>

            {/* Секция дашборда: фильтры, метрики, бенто-сетка */}
            <DashboardSection />

            {/* Секция таблицы: тулбар, структура, песочница, особенности */}
            <TableSection />

            {/* Секция сценариев использования */}
            <ScenariosSection />

            <NavigationButtons currentPath="2-4-1-3-stats" />
        </article>
    );
};
