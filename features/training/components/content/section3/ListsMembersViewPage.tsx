/**
 * ListsMembersViewPage — ХАБ
 * Страница центра обучения: просмотр участников списков.
 * Вся логика секций вынесена в ./members-view-sections/
 * 
 * Контракт: export const ListsMembersViewPage: React.FC
 */
import React from 'react';
import { NavigationButtons } from '../shared';
import {
    InterfaceAnatomySection,
    TableColumnsSection,
    FiltersSection,
    ControlsAndStatesSection,
    InfiniteScrollSection,
    MailingAndDatesSection,
    PerformanceAndSummarySection,
} from './members-view-sections';

export const ListsMembersViewPage: React.FC = () => {
    return (
        <div className="prose max-w-none">
            <h1>3.2.3. Просмотр участников</h1>

            <p className="text-lg">
                После клика на карточку списка открывается таблица участников — полная информация о каждом человеке 
                с фильтрами, поиском и автоматической подгрузкой. Раньше приходилось заходить в админку ВКонтакте, 
                копировать ID по одному, искать вручную. Теперь — всё в одном месте, с фильтрами по полу, возрасту, 
                активности, платформе.
            </p>

            {/* Анатомия интерфейса + структура данных участника */}
            <InterfaceAnatomySection />

            {/* Колонки таблицы (9 шт.) */}
            <TableColumnsSection />

            {/* Панель фильтров и поиска (7 фильтров) */}
            <FiltersSection />

            {/* Кнопки управления + состояния таблицы */}
            <ControlsAndStatesSection />

            {/* Infinite Scroll + модальное окно аватара */}
            <InfiniteScrollSection />

            {/* Список «В рассылке» + форматирование дат */}
            <MailingAndDatesSection />

            {/* Производительность + итоги */}
            <PerformanceAndSummarySection />

            {/* Навигация */}
            <NavigationButtons prevPath="3-2-2-list-card" nextPath="3-3-statistics" />
        </div>
    );
};
