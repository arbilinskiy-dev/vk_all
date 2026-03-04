/**
 * Хаб-компонент страницы обучения «Фильтры альбомов товаров».
 *
 * Вся логика и JSX вынесены в подкомпоненты-секции:
 *   - MockComponents       — типы MockAlbum/MockProduct, mock-данные, AlbumFiltersMock, ProductCardMini
 *   - IntroSection         — описание + сравнение «Было / Стало»
 *   - ButtonTypesSection   — типы кнопок фильтров (Все, Без подборки, Подборки, Создать)
 *   - SandboxSection       — интерактивная песочница с фильтрацией (собственный state)
 *   - LoadingSection       — демо скелетона загрузки + детали реализации
 *   - FilterLogicSection   — три режима фильтрации + комбинация с поиском
 *   - ScenariosSection     — 5 практических сценариев
 *   - TechDetailsSection   — структура данных, формат ссылок, поведение кнопок
 *   - SummarySection       — итоги
 */
import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { IntroSection } from './ProductsAlbumFiltersPage_IntroSection';
import { ButtonTypesSection } from './ProductsAlbumFiltersPage_ButtonTypesSection';
import { SandboxSection } from './ProductsAlbumFiltersPage_SandboxSection';
import { LoadingSection } from './ProductsAlbumFiltersPage_LoadingSection';
import { FilterLogicSection } from './ProductsAlbumFiltersPage_FilterLogicSection';
import { ScenariosSection } from './ProductsAlbumFiltersPage_ScenariosSection';
import { TechDetailsSection } from './ProductsAlbumFiltersPage_TechDetailsSection';
import { SummarySection } from './ProductsAlbumFiltersPage_SummarySection';

export const ProductsAlbumFiltersPage: React.FC<ContentProps> = ({ title }) => (
    <article className="prose max-w-none">
        <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
            {title}
        </h1>

        <IntroSection />
        <hr className="!my-10" />
        <ButtonTypesSection />
        <hr className="!my-10" />
        <SandboxSection />
        <hr className="!my-10" />
        <LoadingSection />
        <hr className="!my-10" />
        <FilterLogicSection />
        <hr className="!my-10" />
        <ScenariosSection />
        <hr className="!my-10" />
        <TechDetailsSection />
        <hr className="!my-10" />
        <SummarySection />

        {/* Навигация */}
        <NavigationButtons currentPath="2-3-3-album-filters" />
    </article>
);
