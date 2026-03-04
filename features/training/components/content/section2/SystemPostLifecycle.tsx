import React from 'react';
import { NavigationButtons, NavigationLink, type ContentProps } from '../shared';
import { TrackerSection } from './SystemPostLifecycle_TrackerSection';
import { StatusDiagramSection } from './SystemPostLifecycle_StatusDiagram';
import { PublicationAndVerificationSection } from './SystemPostLifecycle_PublicationProcess';
import { ErrorsAndRecoverySection } from './SystemPostLifecycle_ErrorsAndRecovery';
import { CyclicAndVariablesSection } from './SystemPostLifecycle_CyclicAndVariables';
import { FAQAndSummarySection } from './SystemPostLifecycle_FAQAndSummary';

/**
 * Обучающая страница: Жизненный цикл системного поста
 * Path: 2-1-4-5-system-post-lifecycle
 * 
 * Хаб-компонент — собирает секции из подфайлов.
 * Детальный разбор механизмов публикации: пост-трекер, переходы статусов,
 * верификация, обработка ошибок и циклическая регенерация
 */
export const SystemPostLifecycle: React.FC<ContentProps> = ({ title }) => {
  return (
    <article className="prose prose-indigo max-w-none">
      <h1 className="!text-3xl !font-bold !tracking-tight !text-gray-900 !border-b !pb-4 !mb-6">
        {title}
      </h1>

      <p className="!text-base !leading-relaxed !text-gray-700">
        Эта страница раскрывает все технические детали того, как системный пост публикуется автоматически — от момента наступления запланированного времени до появления на стене сообщества. Вы узнаете, как работает пост-трекер на бэкенде, почему верификация может занять до 5 минут, как система обрабатывает ошибки и создаёт следующие повторы циклических постов.
      </p>

      {/* Связь с основной страницей */}
      <div className="not-prose my-6">
        <NavigationLink
          to="2-1-4-4-system-post"
          title="Системный пост: Обзор"
          description="Если вы ещё не знакомы с основами системных постов, начните с этой страницы"
          variant="related"
        />
      </div>

      <hr className="!my-10" />
      <TrackerSection />

      <hr className="!my-10" />
      <StatusDiagramSection />

      <hr className="!my-10" />
      <PublicationAndVerificationSection />

      <hr className="!my-10" />
      <ErrorsAndRecoverySection />

      <hr className="!my-10" />
      <CyclicAndVariablesSection />

      <hr className="!my-10" />
      <FAQAndSummarySection />

      <NavigationButtons currentPath="2-1-4-5-system-post-lifecycle" />
    </article>
  );
};
