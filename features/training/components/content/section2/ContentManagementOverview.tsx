import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Подкомпоненты обзора модуля «Контент-менеджмент»
import { ModuleSectionsCards } from './content-management-overview/ModuleSectionsCards';
import { SandboxModuleLayout } from './content-management-overview/SandboxModuleLayout';
import { ModuleInfoSection } from './content-management-overview/ModuleInfoSection';
import { SectionNavigation } from './content-management-overview/SectionNavigation';
import { FAQAndSummary } from './content-management-overview/FAQAndSummary';

// =====================================================================
// Хаб-компонент: Обзор модуля "Контент-менеджмент"
// Логика и UI вынесены в content-management-overview/
// =====================================================================
export const ContentManagementOverview: React.FC<ContentProps> = ({ title }) => (
    <article className="prose prose-indigo max-w-none">
        {/* Заголовок */}
        <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">{title}</h1>

        <p className="!text-base !leading-relaxed !text-gray-700">
            <strong>Модуль "Контент-менеджмент"</strong> — это центральная часть планировщика,
            где ты работаешь с постами для сообществ ВКонтакте. Здесь находятся все инструменты
            для планирования, создания и управления контентом.
        </p>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 my-6">
            <p className="text-sm text-blue-900">
                <strong>Главная идея:</strong> Модуль объединяет три основных типа контента
                (отложенные посты, предложенные посты, товары) плюс инструменты автоматизации в одном удобном интерфейсе.
                Выбрал проект в сайдбаре → переключил вкладку → работаешь с нужным типом контента.
            </p>
        </div>

        <hr className="!my-10" />

        {/* Основные разделы модуля */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Основные разделы модуля</h2>

        <p className="!text-base !leading-relaxed !text-gray-700 !mt-4">
            Модуль состоит из <strong>трёх основных вкладок</strong> для работы с контентом и раздела <strong>«Автоматизации»</strong> с дополнительными инструментами:
        </p>

        <ModuleSectionsCards />

        <hr className="!my-10" />

        {/* Структура интерфейса */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как выглядит интерфейс?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Модуль "Контент-менеджмент" имеет <strong>трёхколоночную структуру</strong>:
        </p>

        <SandboxModuleLayout />

        <hr className="!my-10" />

        <ModuleInfoSection />

        <hr className="!my-10" />

        <SectionNavigation />

        <hr className="!my-10" />

        <FAQAndSummary />

        <NavigationButtons currentPath="2-content-management" />
    </article>
);
