/**
 * Хаб-компонент страницы обучения «Настройки конкурса отзывов товаров».
 *
 * Вся логика и JSX вынесены в подкомпоненты-секции:
 *   - IntroSection              — введение + сравнение «Было / Стало»
 *   - BasicSettingsSection      — основные настройки + sandbox переключателя
 *   - FinishConditionsSection   — условия подведения итогов + sandbox режимов
 *   - TemplatesSection          — шаблоны сообщений (4 шт.)
 *   - PreviewAndTipsSection     — превью, советы, заключение
 *
 * Mock-компоненты (SegmentedControl, DaySelector, RichTemplateEditor)
 * вынесены в _Mocks.tsx.
 */
import React, { useState } from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { IntroSection } from './ProductsReviewsContestSettingsPage_IntroSection';
import { BasicSettingsSection } from './ProductsReviewsContestSettingsPage_BasicSettingsSection';
import { FinishConditionsSection } from './ProductsReviewsContestSettingsPage_FinishConditionsSection';
import { TemplatesSection } from './ProductsReviewsContestSettingsPage_TemplatesSection';
import { PreviewAndTipsSection } from './ProductsReviewsContestSettingsPage_PreviewAndTipsSection';

export const ProductsReviewsContestSettingsPage: React.FC<ContentProps> = ({ title }) => {
    // Состояния для интерактивных примеров
    const [isActive, setIsActive] = useState(true);
    const [keywords, setKeywords] = useState('#отзыв@club12345');
    const [finishCondition, setFinishCondition] = useState<'count' | 'date' | 'mixed'>('count');
    const [targetCount, setTargetCount] = useState(50);
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [autoBlacklist, setAutoBlacklist] = useState(false);
    const [blacklistDuration, setBlacklistDuration] = useState(7);

    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            <IntroSection />
            <hr className="!my-10" />
            <BasicSettingsSection
                isActive={isActive} setIsActive={setIsActive}
                keywords={keywords} setKeywords={setKeywords}
                autoBlacklist={autoBlacklist} setAutoBlacklist={setAutoBlacklist}
                blacklistDuration={blacklistDuration} setBlacklistDuration={setBlacklistDuration}
            />
            <hr className="!my-10" />
            <FinishConditionsSection
                finishCondition={finishCondition} setFinishCondition={setFinishCondition}
                targetCount={targetCount} setTargetCount={setTargetCount}
                dayOfWeek={dayOfWeek} setDayOfWeek={setDayOfWeek}
            />
            <hr className="!my-10" />
            <TemplatesSection />
            <hr className="!my-10" />
            <PreviewAndTipsSection />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-2-2-settings" />
        </article>
    );
};
