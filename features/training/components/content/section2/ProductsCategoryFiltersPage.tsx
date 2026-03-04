/**
 * Хаб-компонент страницы обучения «Фильтры категорий товаров».
 *
 * Вся логика и JSX вынесены в подкомпоненты-секции:
 *   - MockComponents       — типы, mock-данные, CategorySelectorMock, RefreshButtonMock
 *   - IntroSection         — важное уточнение, сравнение «Было / Стало»
 *   - SelectorSection      — описание выпадающего селектора категорий
 *   - SandboxSection       — интерактивные песочницы (селектор + кнопка обновления)
 *   - DataStructureSection — структура данных MarketCategory, группировка
 *   - ScenariosSection     — 4 практических сценария
 *   - TechnicalSection     — технические особенности + итоги
 */
import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { IntroSection } from './ProductsCategoryFiltersPage_IntroSection';
import { SelectorSection } from './ProductsCategoryFiltersPage_SelectorSection';
import { SandboxSection } from './ProductsCategoryFiltersPage_SandboxSection';
import { DataStructureSection } from './ProductsCategoryFiltersPage_DataStructureSection';
import { ScenariosSection } from './ProductsCategoryFiltersPage_ScenariosSection';
import { TechnicalSection } from './ProductsCategoryFiltersPage_TechnicalSection';

export const ProductsCategoryFiltersPage: React.FC<ContentProps> = ({ title }) => (
    <article className="prose max-w-none">
        <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
            {title}
        </h1>

        <IntroSection />
        <hr className="!my-10" />
        <SelectorSection />
        <hr className="!my-10" />
        <SandboxSection />
        <hr className="!my-10" />
        <DataStructureSection />
        <hr className="!my-10" />
        <ScenariosSection />
        <hr className="!my-10" />
        <TechnicalSection />

        {/* Навигация */}
        <NavigationButtons currentPath="2-3-4-category-filters" />
    </article>
);
