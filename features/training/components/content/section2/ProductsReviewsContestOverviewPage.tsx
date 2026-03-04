import React, { useState } from 'react';
import { ContentProps } from '../shared';

// =====================================================================
// Хаб-компонент страницы «Обзор конкурса отзывов товаров»
// Вся логика вынесена в подмодули: ./products-reviews-contest-overview/
// =====================================================================

// --- Секции страницы ---
import { IntroSection } from './products-reviews-contest-overview/IntroSection';
import { WorkflowStepsSection } from './products-reviews-contest-overview/WorkflowStepsSection';
import { ContestToggleSandbox } from './products-reviews-contest-overview/ContestToggleSandbox';
import { TabsStructureSection } from './products-reviews-contest-overview/TabsStructureSection';
import type { TabKey } from './products-reviews-contest-overview/TabsStructureSection';
import { ParticipantStatusesSection } from './products-reviews-contest-overview/ParticipantStatusesSection';
import { KeyActionsSection } from './products-reviews-contest-overview/KeyActionsSection';
import { ParticipantsTableSandbox, WinnersTableSandbox } from './products-reviews-contest-overview/SandboxExamplesSection';
import { ConclusionSection } from './products-reviews-contest-overview/ConclusionSection';

export const ProductsReviewsContestOverviewPage: React.FC<ContentProps> = ({ title }) => {
    // Состояния для интерактивных примеров
    const [contestActive, setContestActive] = useState(false);
    const [selectedTab, setSelectedTab] = useState<TabKey>('settings');

    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение + Было/Стало */}
            <IntroSection />
            <hr className="!my-10" />

            {/* 5 шагов работы конкурса */}
            <WorkflowStepsSection />
            <hr className="!my-10" />

            {/* Интерактивный переключатель конкурса */}
            <ContestToggleSandbox
                contestActive={contestActive}
                onToggle={() => setContestActive((v) => !v)}
            />
            <hr className="!my-10" />

            {/* Структура раздела: 7 вкладок */}
            <TabsStructureSection selectedTab={selectedTab} onSelectTab={setSelectedTab} />
            <hr className="!my-10" />

            {/* Статусы участников */}
            <ParticipantStatusesSection />
            <hr className="!my-10" />

            {/* Ключевые действия */}
            <KeyActionsSection />
            <hr className="!my-10" />

            {/* Sandbox: таблица участников */}
            <ParticipantsTableSandbox />
            <hr className="!my-10" />

            {/* Sandbox: история победителей */}
            <WinnersTableSandbox />
            <hr className="!my-10" />

            {/* Заключение + навигация */}
            <ConclusionSection />
        </article>
    );
};
