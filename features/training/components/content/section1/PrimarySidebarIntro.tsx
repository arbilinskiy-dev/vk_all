import React, { useState } from 'react';
import { ContentProps } from '../shared';

// Подмодули — вынесены из монолита для читаемости
import { StructureSection } from './PrimarySidebarIntro_StructureSection';
import { InteractiveDemo } from './PrimarySidebarIntro_InteractiveDemo';
import { ModulesSection } from './PrimarySidebarIntro_ModulesSection';
import { PanelInfo } from './PrimarySidebarIntro_PanelInfo';

// =====================================================================
// Хаб-компонент: Введение в основной сайдбар
// =====================================================================

/** Словарь названий модулей */
const MODULE_NAMES: Record<string, string> = {
    'km': 'Контент-менеджмент',
    'am': 'Автоматизации',
    'lists': 'Списки',
    'database': 'База проектов',
    'training': 'Центр обучения',
    'logout': 'Выход'
};

export const PrimarySidebarIntro: React.FC<ContentProps> = ({ title }) => {
    const [activeIcon, setActiveIcon] = useState<string>('km');

    const getModuleName = (icon: string) => MODULE_NAMES[icon] || '';

    return (
        <article className="prose prose-indigo max-w-none">
            {/* Заголовок и вступление */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Это <strong>самая левая панель</strong> в приложении — узкая вертикальная полоска с иконками. 
                Она всегда видна и служит главным переключателем между модулями.
            </p>

            <div className="not-prose bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
                <p className="text-sm text-blue-900">
                    <strong>Функция:</strong> Переключение между основными разделами работы (контент, автоматизации, списки) 
                    и глобальными настройками (база проектов, обучение, выход).
                </p>
            </div>

            <hr className="!my-10" />

            {/* Структура панели (верхняя/нижняя группа иконок) */}
            <StructureSection />

            {/* Интерактивная песочница */}
            <InteractiveDemo
                activeIcon={activeIcon}
                onIconClick={setActiveIcon}
                getModuleName={getModuleName}
            />

            <hr className="!my-10" />

            {/* Подробнее о модулях (КМ, АМ, Списки) */}
            <ModulesSection />

            <hr className="!my-10" />

            {/* Особенности работы + Права доступа + Навигация «Что дальше» */}
            <PanelInfo />
        </article>
    );
};
