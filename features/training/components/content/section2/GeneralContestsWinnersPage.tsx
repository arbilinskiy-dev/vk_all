/**
 * Хаб-файл: страница «Победители конкурса» (Центр обучения).
 *
 * Собирает секции из подфайлов:
 *  - WhatIsSection       — описание вкладки «Победители»
 *  - BeforeAfterSection  — сравнение «Было / Стало»
 *  - DemosSection        — 7 интерактивных Sandbox-демо
 *  - FAQSection          — частые вопросы
 *  - AdvantagesSection   — ключевые преимущества
 */
import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

/* Секции страницы */
import { WhatIsSection } from './GeneralContestsWinnersPage_WhatIsSection';
import { BeforeAfterSection } from './GeneralContestsWinnersPage_BeforeAfterSection';
import { DemosSection } from './GeneralContestsWinnersPage_DemosSection';
import { FAQSection } from './GeneralContestsWinnersPage_FAQSection';
import { AdvantagesSection } from './GeneralContestsWinnersPage_AdvantagesSection';

export const GeneralContestsWinnersPage: React.FC<ContentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Победители конкурса
        </h1>
        <p className="text-lg text-gray-600">
          Узнайте, как отслеживать победителей, просматривать информацию о призах и контролировать статус доставки подарков участникам конкурса.
        </p>
      </div>

      {/* Секции контента */}
      <WhatIsSection />
      <BeforeAfterSection />
      <DemosSection />
      <FAQSection />
      <AdvantagesSection />

      {/* Навигация */}
      <NavigationButtons
        onPrevious={() => onNavigate('2-4-4-7-participants')}
        onNext={() => onNavigate('2-4-5')}
        previousLabel="Участники"
        nextLabel="Заключение"
      />
    </div>
  );
};
