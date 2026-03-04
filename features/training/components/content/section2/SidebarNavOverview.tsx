import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
// Подмодули — декомпозиция из монолитного файла
import { SidebarNavOverview_Intro } from './SidebarNavOverview_Intro';
import { SidebarNavOverview_Structure } from './SidebarNavOverview_Structure';
import { SidebarNavOverview_Sandbox } from './SidebarNavOverview_Sandbox';
import { SidebarNavOverview_Tasks } from './SidebarNavOverview_Tasks';
import { SidebarNavOverview_Sections } from './SidebarNavOverview_Sections';
import { SidebarNavOverview_FAQ } from './SidebarNavOverview_FAQ';
import { SidebarNavOverview_Summary } from './SidebarNavOverview_Summary';

// =====================================================================
// Хаб-компонент: Обзор сайдбара проектов
// Логика и разметка вынесены в подмодули SidebarNavOverview_*
// =====================================================================
export const SidebarNavOverview: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-indigo max-w-none">
            {/* Заголовок */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            {/* Вступление и подсказка */}
            <SidebarNavOverview_Intro />

            <hr className="!my-10" />

            {/* Из чего состоит сайдбар — 7 блоков */}
            <SidebarNavOverview_Structure />

            <hr className="!my-10" />

            {/* Интерактивный макет (Sandbox) */}
            <SidebarNavOverview_Sandbox />

            <hr className="!my-10" />

            {/* Типичные задачи */}
            <SidebarNavOverview_Tasks />

            <hr className="!my-10" />

            {/* Навигация по подразделам */}
            <SidebarNavOverview_Sections />

            <hr className="!my-10" />

            {/* Часто задаваемые вопросы */}
            <SidebarNavOverview_FAQ />

            <hr className="!my-10" />

            {/* Итоги и совет эксперта */}
            <SidebarNavOverview_Summary />

            <NavigationButtons />
        </article>
    );
};
