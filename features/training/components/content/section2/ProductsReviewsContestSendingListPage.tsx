import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Секции страницы «Журнал отправки призов»
import { IntroSection } from './ProductsReviewsContestSendingListPage_IntroSection';
import { TableStructureSection } from './ProductsReviewsContestSendingListPage_TableStructureSection';
import { DeliverySection } from './ProductsReviewsContestSendingListPage_DeliverySection';
import { ActionsSection } from './ProductsReviewsContestSendingListPage_ActionsSection';
import { TipsAndFAQ } from './ProductsReviewsContestSendingListPage_TipsAndFAQ';

// =====================================================================
// Хаб-компонент: Журнал отправки конкурса отзывов товаров
// Вся логика и разметка вынесены в подфайлы *_Section.tsx / *_Demos.tsx
// =====================================================================
export const ProductsReviewsContestSendingListPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение и сравнение «Было / Стало» */}
            <IntroSection />

            <hr className="!my-10" />

            {/* Структура журнала: 6 колонок */}
            <TableStructureSection />

            <hr className="!my-10" />

            {/* Двухэтапная доставка + 3 интерактивных Sandbox-демо */}
            <DeliverySection />

            <hr className="!my-10" />

            {/* Иконка чата + повторная отправка промокодов */}
            <ActionsSection />

            <hr className="!my-10" />

            {/* Советы по использованию + очистка журнала (админ) + FAQ */}
            <TipsAndFAQ />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-2-6-sending-list" />
        </article>
    );
};
