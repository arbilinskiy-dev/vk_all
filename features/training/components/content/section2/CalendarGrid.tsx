import React from 'react';
import { ContentProps } from '../shared';

// Секции-подкомпоненты (декомпозиция монолита)
import { CalendarGridStructure } from './CalendarGrid_Structure';
import { CalendarGridContentTypes } from './CalendarGrid_ContentTypes';
import { CalendarGridDemo } from './CalendarGrid_Demo';
import { CalendarGridFeatures } from './CalendarGrid_Features';
import { CalendarGridScenarios } from './CalendarGrid_Scenarios';
import { CalendarGridFAQ } from './CalendarGrid_FAQ';
import { CalendarGridSummary } from './CalendarGrid_Summary';

// =====================================================================
// Хаб-компонент: Сетка календаря (обучающая страница)
// Декомпозирован из монолита 642→~65 строк
// =====================================================================
export const CalendarGrid: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-indigo max-w-none">
            {/* Заголовок и введение */}
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

            <p className="!text-base !leading-relaxed !text-gray-700">
                Сетка календаря — это <strong>основная рабочая область</strong> во вкладке "Расписание". 
                Здесь отображаются все твои посты, заметки и истории, распределённые по дням недели.
            </p>

            <div className="not-prose bg-indigo-50 border border-indigo-200 rounded-lg p-4 my-6">
                <p className="text-sm text-indigo-800">
                    <strong>Главная идея:</strong> Сетка календаря показывает 7 дней (целую неделю) одновременно. 
                    Каждый день — это отдельная колонка, где всё содержимое отсортировано по времени сверху вниз.
                </p>
            </div>

            <hr className="!my-10" />
            <CalendarGridStructure />

            <hr className="!my-10" />
            <CalendarGridContentTypes />

            <hr className="!my-10" />
            <CalendarGridDemo />

            <hr className="!my-10" />
            <CalendarGridFeatures />

            <hr className="!my-10" />
            <CalendarGridScenarios />

            <hr className="!my-10" />
            <CalendarGridFAQ />

            <hr className="!my-10" />
            <CalendarGridSummary />
        </article>
    );
};
