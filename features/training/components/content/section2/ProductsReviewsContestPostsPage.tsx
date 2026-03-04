import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Секции страницы (декомпозиция из монолита)
import { IntroSection } from './ProductsReviewsContestPostsPage_IntroSection';
import { TableStructureSection } from './ProductsReviewsContestPostsPage_TableSection';
import { ControlButtonsSection } from './ProductsReviewsContestPostsPage_ControlsSection';
import { StatusesSection } from './ProductsReviewsContestPostsPage_StatusesSection';
import { ResultModalSection } from './ProductsReviewsContestPostsPage_ResultSection';
import { TipsSection, FaqSection } from './ProductsReviewsContestPostsPage_TipsAndFaq';

// =====================================================================
// ХАБ: Страница «Посты конкурса отзывов товаров»
// Собирает секции воедино. Внешний контракт не изменён.
// =====================================================================

export const ProductsReviewsContestPostsPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение + Было/Стало */}
            <IntroSection />

            <hr className="!my-10" />

            {/* Структура таблицы + Sandbox 1 */}
            <TableStructureSection />

            <hr className="!my-10" />

            {/* Кнопки управления + Sandbox 2 */}
            <ControlButtonsSection />

            <hr className="!my-10" />

            {/* Статусы участников */}
            <StatusesSection />

            <hr className="!my-10" />

            {/* Окно результата + Sandbox 3 */}
            <ResultModalSection />

            <hr className="!my-10" />

            {/* Советы по использованию */}
            <TipsSection />

            <hr className="!my-10" />

            {/* FAQ */}
            <FaqSection />

            <hr className="!my-10" />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-2-8-posts" />
        </article>
    );
};
