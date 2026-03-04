import React from 'react';
import { ContentProps } from '../shared';

// Секции страницы
import { IntroSection } from './ProductsReviewsContestPromocodesPage_IntroSection';
import { InterfaceSection } from './ProductsReviewsContestPromocodesPage_InterfaceSection';
import { TableSection } from './ProductsReviewsContestPromocodesPage_TableSection';
import { CountersSection } from './ProductsReviewsContestPromocodesPage_CountersSection';
import { RelatedAndFAQ } from './ProductsReviewsContestPromocodesPage_RelatedAndFAQ';

// =====================================================================
// Hub: Страница обучения — промокоды конкурса отзывов товаров
//
// Декомпозиция:
//   _UploadFormDemo     — демо формы загрузки промокодов
//   _ActionIconsDemo    — демо иконок действий (карандаш, галочка и т.д.)
//   _StatusesDemo       — демо статусов (Свободен / Выдан)
//   _IntroSection       — введение + сравнение «Было / Стало»
//   _InterfaceSection   — структура интерфейса + формат загрузки + песочница
//   _TableSection       — таблица 7 колонок + песочницы иконок и статусов
//   _CountersSection    — счётчики + советы по использованию
//   _RelatedAndFAQ      — связь с разделами + FAQ + навигация
// =====================================================================
export const ProductsReviewsContestPromocodesPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение + сравнение «Было / Стало» */}
            <IntroSection />

            {/* Структура интерфейса + формат загрузки + песочница формы */}
            <InterfaceSection />

            {/* Таблица промокодов + песочницы иконок и статусов */}
            <TableSection />

            {/* Счётчики + советы по использованию */}
            <CountersSection />

            {/* Связь с разделами + FAQ + навигация */}
            <RelatedAndFAQ />
        </article>
    );
};
