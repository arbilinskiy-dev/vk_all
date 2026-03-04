import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';

// Секции страницы (паттерн «хаб»)
import GeneralContestsSettingsPage_Intro from './GeneralContestsSettingsPage_Intro';
import GeneralContestsSettingsPage_BasicParams from './GeneralContestsSettingsPage_BasicParams';
import GeneralContestsSettingsPage_ContestPost from './GeneralContestsSettingsPage_ContestPost';
import GeneralContestsSettingsPage_Conditions from './GeneralContestsSettingsPage_Conditions';
import GeneralContestsSettingsPage_Results from './GeneralContestsSettingsPage_Results';
import GeneralContestsSettingsPage_Messages from './GeneralContestsSettingsPage_Messages';
import GeneralContestsSettingsPage_ResultsPost from './GeneralContestsSettingsPage_ResultsPost';
import GeneralContestsSettingsPage_ComparisonAndFAQ from './GeneralContestsSettingsPage_ComparisonAndFAQ';

/**
 * Страница обучения «Настройки универсального конкурса».
 * Хаб-компонент — собирает секции в правильном порядке.
 */
const GeneralContestsSettingsPage: React.FC<ContentProps> = ({ topicId, subtopicId, itemId }) => {
  return (
    <div className="prose prose-slate max-w-none">
      <GeneralContestsSettingsPage_Intro />
      <GeneralContestsSettingsPage_BasicParams />
      <GeneralContestsSettingsPage_ContestPost />
      <GeneralContestsSettingsPage_Conditions />
      <GeneralContestsSettingsPage_Results />
      <GeneralContestsSettingsPage_Messages />
      <GeneralContestsSettingsPage_ResultsPost />
      <GeneralContestsSettingsPage_ComparisonAndFAQ />

      <NavigationButtons
        topicId={topicId}
        subtopicId={subtopicId}
        itemId={itemId}
      />
    </div>
  );
};

export default GeneralContestsSettingsPage;
