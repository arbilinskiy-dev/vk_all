import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { IntroSection } from './ProductsReviewsContestLogsPage_IntroSection';
import { SystemLogsSection } from './ProductsReviewsContestLogsPage_SystemLogsSection';
import { DeliverySection } from './ProductsReviewsContestLogsPage_DeliverySection';
import { TipsAndFAQSection } from './ProductsReviewsContestLogsPage_TipsAndFAQ';

// =====================================================================
// Хаб-компонент: страница логов конкурса отзывов товаров
// Секции вынесены в отдельные файлы для модульности
// =====================================================================
export const ProductsReviewsContestLogsPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-lg max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение + Было/Стало */}
            <IntroSection />

            <hr className="!my-10" />

            {/* Системные логи (терминал) + песочница */}
            <SystemLogsSection />

            <hr className="!my-10" />

            {/* Журнал отправки призов + песочница */}
            <DeliverySection />

            <hr className="!my-10" />

            {/* Советы + FAQ */}
            <TipsAndFAQSection />

            <hr className="!my-10" />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-2-9-logs" />
        </article>
    );
};
