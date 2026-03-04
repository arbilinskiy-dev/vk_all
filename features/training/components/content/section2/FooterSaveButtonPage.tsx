import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// =====================================================================
// Подсекции страницы (декомпозиция из монолита 635 → хаб ~65 строк)
// =====================================================================
import { IntroSection } from './FooterSaveButton_IntroSection';
import { StructureSection } from './FooterSaveButton_StructureSection';
import { CancelButtonSection } from './FooterSaveButton_CancelButtonSection';
import { SaveButtonSection } from './FooterSaveButton_SaveButtonSection';
import { SpinnerSection } from './FooterSaveButton_SpinnerSection';
import { BlockingSection } from './FooterSaveButton_BlockingSection';
import { VariantsSection } from './FooterSaveButton_VariantsSection';
import { TechnicalSection } from './FooterSaveButton_TechnicalSection';

// =====================================================================
// Футер и кнопка сохранения — хаб-компонент
// Собирает все секции страницы обучения в единую статью.
// =====================================================================

export const FooterSaveButtonPage: React.FC<ContentProps> = ({ title }) => {
    return (
        <>
            {/* CSS-анимация для спиннера (используется в моках) */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
            <article className="prose prose-slate max-w-none">
                {/* Заголовок страницы */}
                <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
                    {title}
                </h1>

                {/* 1. Введение */}
                <IntroSection />
                <hr className="!my-10" />

                {/* 2. Структура футера */}
                <StructureSection />
                <hr className="!my-10" />

                {/* 3. Кнопка «Отмена» */}
                <CancelButtonSection />
                <hr className="!my-10" />

                {/* 4. Кнопка «Сохранить» */}
                <SaveButtonSection />
                <hr className="!my-10" />

                {/* 5. Индикатор загрузки */}
                <SpinnerSection />
                <hr className="!my-10" />

                {/* 6. Состояния блокировки */}
                <BlockingSection />
                <hr className="!my-10" />

                {/* 7. Варианты футера */}
                <VariantsSection />
                <hr className="!my-10" />

                {/* 8. Технические детали */}
                <TechnicalSection />
                <hr className="!my-10" />

                {/* Навигация между разделами */}
                <NavigationButtons currentPath="2-1-7-12-footer-save-button" />
            </article>
        </>
    );
};
