import React from 'react';
import { ContentProps } from '../shared';

// Секции страницы — декомпозированы из монолита
import { WhatIsTableSection } from './ListsInteractionsViewPage_WhatIsTable';
import { AnatomySection } from './ListsInteractionsViewPage_Anatomy';
import { RowExpandSection } from './ListsInteractionsViewPage_RowExpand';
import { PlatformStatusSection } from './ListsInteractionsViewPage_PlatformStatus';
import { SearchFiltersSection } from './ListsInteractionsViewPage_SearchFilters';
import { StatesScrollSection } from './ListsInteractionsViewPage_StatesScroll';

// =====================================================================
// Страница "3.2.5. Просмотр взаимодействий" — ХАБ
// Логика секций вынесена в подфайлы ListsInteractionsViewPage_*.tsx
// =====================================================================

export const ListsInteractionsViewPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose prose-slate max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* 1. Что это за таблица? */}
            <WhatIsTableSection />

            {/* 2-3. Анатомия таблицы + Структура данных */}
            <AnatomySection />

            {/* 4-5. Раскрытие строк + Счётчик взаимодействий */}
            <RowExpandSection />

            {/* 6-7-8. Платформы, статусы, доп. поля */}
            <PlatformStatusSection />

            {/* 9. Поиск и фильтры */}
            <SearchFiltersSection />

            {/* 10-11-12. Состояния, скролл, сравнение + навигация */}
            <StatesScrollSection />
        </article>
    );
};
