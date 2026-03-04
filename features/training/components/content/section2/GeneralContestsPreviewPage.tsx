import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import { WhatIsPreviewSection, BeforeAfterSection, FAQSection, KeyAdvantagesSection } from './GeneralContestsPreviewPage_Sections';
import { InteractiveDemosSection } from './GeneralContestsPreviewPage_InteractiveDemos';

// ============================================
// Хаб-компонент: Предпросмотр конкурса
// Логика вынесена в подмодули:
//   _Sections.tsx       — статические секции (описание, FAQ, преимущества)
//   _InteractiveDemos   — 8 Sandbox-блоков
//   _PostDemos          — демо: стартовый, итоговый, полный превью постов
//   _MessageDemos       — демо: ЛС победителю, комментарий-фолбэк
//   _ToolDemos          — демо: переменные, фотографии, размытие
// ============================================

export const GeneralContestsPreviewPage: React.FC<ContentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Предпросмотр конкурса
        </h1>
        <p className="text-lg text-gray-600">
          Узнайте, как проверить, как будут выглядеть посты конкурса в ВКонтакте: стартовый пост, итоги и сообщения победителям.
        </p>
      </div>

      <WhatIsPreviewSection />
      <BeforeAfterSection />
      <InteractiveDemosSection />
      <FAQSection />
      <KeyAdvantagesSection />

      {/* Навигация */}
      <NavigationButtons
        onPrevious={() => onNavigate('2-4-4-11-blacklist')}
        onNext={() => onNavigate('2-5-1-overview')}
        previousLabel="Чёрный список"
        nextLabel="Обзор раздела"
      />
    </div>
  );
};
