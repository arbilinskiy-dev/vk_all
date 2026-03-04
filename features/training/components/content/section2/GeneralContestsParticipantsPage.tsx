import React from 'react';
import { ContentProps } from '../shared';

// Секции страницы — декомпозиция по паттерну «хаб»
import { IntroSection } from './GeneralContestsParticipantsPage_IntroSection';
import { TableSection } from './GeneralContestsParticipantsPage_TableSection';
import { StatusesSection } from './GeneralContestsParticipantsPage_StatusesSection';
import { ControlsSection } from './GeneralContestsParticipantsPage_ControlsSection';
import { ComparisonAndFAQ } from './GeneralContestsParticipantsPage_ComparisonAndFAQ';

// =====================================================================
// Хаб-компонент: «Участники конкурса» — страница центра обучения
// Контракт (ContentProps) сохранён, рендер делегирован секциям.
// =====================================================================

const GeneralContestsParticipantsPage: React.FC<ContentProps> = () => {
  return (
    <div className="prose prose-slate max-w-none">
      {/* Вступление: заголовок, «для кого», «что это», «было/стало» */}
      <IntroSection />

      {/* Таблица участников: описание + интерактивный пример */}
      <TableSection />

      {/* Статусы: бейджи + расшифровка каждого статуса */}
      <StatusesSection />

      {/* Управление: кнопки, состояния, номера, ссылки */}
      <ControlsSection />

      {/* Сравнение подходов, FAQ, итог + навигация */}
      <ComparisonAndFAQ />
    </div>
  );
};

export default GeneralContestsParticipantsPage;
