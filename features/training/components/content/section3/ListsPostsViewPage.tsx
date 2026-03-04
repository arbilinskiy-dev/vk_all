/**
 * Хаб-файл страницы «3.2.4. Просмотр постов» центра обучения.
 * Собирает все секции из подфайлов ListsPostsViewPage_*.
 *
 * Внешний контракт: экспортирует ListsPostsViewPage (именованный экспорт).
 */
import React from 'react';
import { IntroSection } from './ListsPostsViewPage_IntroSection';
import { StructureSection } from './ListsPostsViewPage_StructureSection';
import { CountersSection } from './ListsPostsViewPage_CountersSection';
import { DemoSection } from './ListsPostsViewPage_DemoSection';
import { ControlsSection } from './ListsPostsViewPage_ControlsSection';
import { ScrollAndLinksSection } from './ListsPostsViewPage_ScrollAndLinksSection';
import { ComparisonSection } from './ListsPostsViewPage_ComparisonSection';

/** Страница обучения — просмотр постов в списках */
export const ListsPostsViewPage: React.FC = () => {
    return (
        <div className="prose max-w-none">
            <h1>3.2.4. Просмотр постов</h1>

            {/* Вводный блок — «Что это за таблица?» */}
            <IntroSection />

            {/* Разделы 1-3: Анатомия, Колонки, Структура данных */}
            <StructureSection />

            {/* Раздел 4: Счётчики активности */}
            <CountersSection />

            {/* Разделы 5-7: Полная таблица, Состояния, Поиск */}
            <DemoSection />

            {/* Разделы 8-10: Обновление, Даты, Превью */}
            <ControlsSection />

            {/* Разделы 11-12: Бесконечная прокрутка, Ссылка VK */}
            <ScrollAndLinksSection />

            {/* Раздел 13: Сравнение с календарём + Резюме */}
            <ComparisonSection />
        </div>
    );
};
