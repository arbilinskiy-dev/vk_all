import React from 'react';
import { NavigationButtons } from './shared';
import { WelcomeSection, WhatIsSection, TargetAudienceSection, HowToUseSection } from './AboutTrainingCenter_IntroSections';
import { ExamplesSection, LearnSection, LegendSection, QuickStartSection, TipSection } from './AboutTrainingCenter_ContentSections';

// =====================================================================
// Хаб-компонент: страница «О Центре обучения»
// Логика и визуал вынесены в подмодули:
//   _Mocks.tsx          — мок-компоненты (Sandbox, навигация, посты, товары и т.д.)
//   _Cards.tsx          — карточки LearnCard и LegendItem
//   _IntroSections.tsx  — вводные секции (приветствие, описание, аудитория, навигация)
//   _ContentSections.tsx — контентные секции (примеры, обучение, легенда, быстрый старт)
// =====================================================================

interface ContentProps {
    title: string;
}

export const AboutTrainingCenter: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-indigo max-w-none">
            {/* Заголовок */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            <WelcomeSection />
            <WhatIsSection />

            <hr className="!my-10" />
            <TargetAudienceSection />

            <hr className="!my-10" />
            <HowToUseSection />

            <hr className="!my-10" />
            <ExamplesSection />

            <hr className="!my-10" />
            <LearnSection />

            <hr className="!my-10" />
            <LegendSection />

            <hr className="!my-10" />
            <QuickStartSection />

            <TipSection />

            <NavigationButtons currentPath="0-about-training-center" />
        </article>
    );
};
