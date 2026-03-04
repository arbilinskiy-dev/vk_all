/**
 * Хаб-компонент страницы обучения «Конкурс отзывов» (Товары).
 *
 * Вся логика и JSX вынесены в подкомпоненты-секции:
 *   - IntroSection       — введение, описание функции, flow-диаграмма
 *   - SettingsSection    — настройки конкурса, условия завершения, шаблоны, VK-предпросмотр
 *   - PostsSection       — вкладка «Посты», таблица участников
 *   - WinnersSection     — вкладка «Победители», таблица розыгрышей
 *   - PromoCodesSection  — вкладка «Промокоды», формат CSV
 *   - BlacklistSection   — вкладка «Блэклист», ручное и автоматическое добавление
 *   - DispatchLogSection — вкладка «Лист отправок», журнал доставки
 *   - SummarySection     — итоги и рекомендации
 */
import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { IntroSection } from './ProductsReviewsContestPage_IntroSection';
import { SettingsSection } from './ProductsReviewsContestPage_SettingsSection';
import { PostsSection } from './ProductsReviewsContestPage_PostsSection';
import { WinnersSection } from './ProductsReviewsContestPage_WinnersSection';
import { PromoCodesSection } from './ProductsReviewsContestPage_PromoCodesSection';
import { BlacklistSection } from './ProductsReviewsContestPage_BlacklistSection';
import { DispatchLogSection } from './ProductsReviewsContestPage_DispatchLogSection';
import { SummarySection } from './ProductsReviewsContestPage_SummarySection';

export const ProductsReviewsContestPage: React.FC<ContentProps> = ({ title }) => (
    <article className="prose max-w-none">
        <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

        <IntroSection />
        <hr className="!my-10" />
        <SettingsSection />
        <hr className="!my-10" />
        <PostsSection />
        <hr className="!my-10" />
        <WinnersSection />
        <hr className="!my-10" />
        <PromoCodesSection />
        <hr className="!my-10" />
        <BlacklistSection />
        <hr className="!my-10" />
        <DispatchLogSection />
        <hr className="!my-10" />
        <SummarySection />

        {/* Навигация */}
        <NavigationButtons currentPath="2-4-2-reviews-contest" />
    </article>
);
