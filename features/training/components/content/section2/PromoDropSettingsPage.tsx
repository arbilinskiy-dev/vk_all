import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// =====================================================================
// Подкомпоненты — вынесены в отдельные файлы для читаемости
// =====================================================================
import { PromoDropSettingsPage_HeaderSection } from './PromoDropSettingsPage_HeaderSection';
import { PromoDropSettingsPage_BeforeAfterSection } from './PromoDropSettingsPage_BeforeAfterSection';
import { PromoDropSettingsPage_SettingsBlocks } from './PromoDropSettingsPage_SettingsBlocks';
import { PromoDropSettingsPage_ComparisonTable } from './PromoDropSettingsPage_ComparisonTable';
import { PromoDropSettingsPage_AlternativesSection } from './PromoDropSettingsPage_AlternativesSection';
import { PromoDropSettingsPage_FAQSection } from './PromoDropSettingsPage_FAQSection';

/**
 * Обучающая страница: "2.4.3.2. Настройка дропа"
 *
 * Хаб-компонент — собирает секции из подфайлов.
 * Описание параметров для автоматизации "Дроп промокодов".
 * ВАЖНО: Функционал находится в разработке, страница показывает планируемые возможности.
 */

// =====================================================================
// Основной компонент страницы (хаб)
// =====================================================================
export const PromoDropSettingsPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <article className="prose max-w-none">
            {/* Заголовок + баннер + введение */}
            <PromoDropSettingsPage_HeaderSection title={title} />

            <hr className="!my-10" />

            {/* Было / Стало */}
            <PromoDropSettingsPage_BeforeAfterSection />

            <hr className="!my-10" />

            {/* Блоки настроек */}
            <PromoDropSettingsPage_SettingsBlocks />

            <hr className="!my-10" />

            {/* Сравнительная таблица с конкурсом отзывов */}
            <PromoDropSettingsPage_ComparisonTable />

            <hr className="!my-10" />

            {/* Альтернативные инструменты */}
            <PromoDropSettingsPage_AlternativesSection />

            <hr className="!my-10" />

            {/* Частые вопросы */}
            <PromoDropSettingsPage_FAQSection />

            <hr className="!my-10" />

            {/* Навигация */}
            <NavigationButtons currentPath="2-4-3-2-settings" />
        </article>
    );
};
