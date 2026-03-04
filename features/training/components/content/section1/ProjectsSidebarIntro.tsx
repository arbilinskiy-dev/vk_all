import React, { useState } from 'react';
import { ContentProps } from '../shared';

// Подмодули (декомпозиция из монолита)
import { MOCK_PROJECTS } from './ProjectsSidebarIntro_MockComponents';
import { VisibilityInfoSection } from './ProjectsSidebarIntro_VisibilityInfo';
import { StructureSection } from './ProjectsSidebarIntro_StructureSection';
import { CardElementsSection } from './ProjectsSidebarIntro_CardElements';
import { SandboxSection } from './ProjectsSidebarIntro_SandboxSection';
import { ColorIndicatorsSection } from './ProjectsSidebarIntro_ColorIndicators';
import { KeyFeaturesSection } from './ProjectsSidebarIntro_KeyFeatures';

// =====================================================================
// Хаб: Введение в сайдбар проектов (обучающая страница)
// Логика секций вынесена в подфайлы ProjectsSidebarIntro_*.tsx
// =====================================================================
export const ProjectsSidebarIntro: React.FC<ContentProps> = ({ title }) => {
    const [selectedProject, setSelectedProject] = useState<string | null>('1');

    return (
        <article className="prose prose-indigo max-w-none">
            {/* Заголовок */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Это <strong>вторая колонка слева</strong> — появляется при выборе модуля из верхней группы главной панели. 
                Содержит список всех ваших проектов с возможностью поиска и фильтрации.
            </p>

            {/* Когда появляется / не появляется / функция */}
            <VisibilityInfoSection />

            <hr className="!my-10" />

            {/* Структура сайдбара — 5 частей */}
            <StructureSection />

            <hr className="!my-10" />

            {/* Элементы карточки проекта — 3 карточки */}
            <CardElementsSection />

            {/* Интерактивная песочница */}
            <SandboxSection
                mockProjects={MOCK_PROJECTS}
                selectedProject={selectedProject}
                onSelect={setSelectedProject}
            />

            <hr className="!my-10" />

            {/* Цветовые индикаторы — 4 уровня */}
            <ColorIndicatorsSection />

            <hr className="!my-10" />

            {/* Ключевые возможности + навигация «Что дальше» */}
            <KeyFeaturesSection />
        </article>
    );
};
