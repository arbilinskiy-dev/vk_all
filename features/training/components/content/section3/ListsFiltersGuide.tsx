import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Секции контента (декомпозиция)
import { FiltersOverviewSection } from './ListsFilters_Overview';
import { FilterTypesSection } from './ListsFilters_Types';
import { ActionButtonsSection } from './ListsFilters_Actions';
import { FiltersComparisonSection } from './ListsFilters_Comparison';

// =====================================================================
// Хаб-компонент страницы 3.1.3: Фильтры
// Собирает секции из подмодулей, сохраняя внешний контракт
// =====================================================================
export const ListsFiltersGuide: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                {title}
            </h1>

            {/* Введение */}
            <p className="!text-base !leading-relaxed !text-gray-700">
                Система фильтрации позволяет быстро находить нужных пользователей в больших списках. Вместо того чтобы прокручивать тысячи строк вручную, вы задаёте условия отбора — и система показывает только подходящие записи.
            </p>

            <hr className="!my-10" />

            {/* Обзор панели фильтров + песочница */}
            <FiltersOverviewSection />

            <hr className="!my-10" />

            {/* Описание 8 типов фильтров */}
            <FilterTypesSection />

            <hr className="!my-10" />

            {/* Кнопки действий */}
            <ActionButtonsSection />

            <hr className="!my-10" />

            {/* Sticky-поведение + сравнение Было/Стало + реальный кейс */}
            <FiltersComparisonSection />

            {/* Навигация */}
            <NavigationButtons currentPath="3-1-3-filters" />
        </article>
    );
};
