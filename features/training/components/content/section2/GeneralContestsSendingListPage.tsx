import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Секции страницы (паттерн «хаб»)
import GeneralContestsSendingListPage_WhatIs from './GeneralContestsSendingListPage_WhatIs';
import GeneralContestsSendingListPage_BeforeAfter from './GeneralContestsSendingListPage_BeforeAfter';
import GeneralContestsSendingListPage_InteractiveDemos from './GeneralContestsSendingListPage_InteractiveDemos';
import GeneralContestsSendingListPage_FAQ from './GeneralContestsSendingListPage_FAQ';
import GeneralContestsSendingListPage_Benefits from './GeneralContestsSendingListPage_Benefits';

/**
 * Страница обучения «Журнал отправки призов».
 * Хаб-компонент — собирает секции в правильном порядке.
 */
export const GeneralContestsSendingListPage: React.FC<ContentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Журнал отправки призов
        </h1>
        <p className="text-lg text-gray-600">
          Узнайте, как отслеживать доставку сообщений с промокодами победителям, повторять неудачные отправки и управлять историей рассылки.
        </p>
      </div>

      {/* Что это такое */}
      <GeneralContestsSendingListPage_WhatIs />

      {/* Было/Стало */}
      <GeneralContestsSendingListPage_BeforeAfter />

      {/* Интерактивные демонстрации */}
      <GeneralContestsSendingListPage_InteractiveDemos />

      {/* Частые вопросы */}
      <GeneralContestsSendingListPage_FAQ />

      {/* Ключевые преимущества */}
      <GeneralContestsSendingListPage_Benefits />

      {/* Навигация */}
      <NavigationButtons
        onPrevious={() => onNavigate('2-4-4-9-promocodes')}
        onNext={() => onNavigate('2-4-4-11-blacklist')}
        previousLabel="Промокоды"
        nextLabel="Чёрный список"
      />
    </div>
  );
};
