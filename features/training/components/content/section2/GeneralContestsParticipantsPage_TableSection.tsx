import React from 'react';
import { Sandbox } from '../shared';
import { ParticipantsTableDemo } from './GeneralContestsParticipantsPage_Mocks';

// =====================================================================
// Секция «Таблица участников»: описание столбцов и интерактивный пример
// =====================================================================

export const TableSection: React.FC = () => (
  <>
    <h2>Как выглядит список участников</h2>
    <p>
      После публикации стартового поста конкурса система начинает автоматически собирать участников. Каждый, кто выполнил условия, попадает в таблицу с полной информацией.
    </p>

    <div className="not-prose my-6">
      <Sandbox title="Пример списка участников">
        <ParticipantsTableDemo />
      </Sandbox>
    </div>

    <h3>Что показывается в таблице</h3>
    <p>Каждая строка содержит информацию об одном участнике:</p>

    <ul>
      <li><strong>Участник</strong> — имя и ссылка на профиль ВКонтакте (открывается в новой вкладке)</li>
      <li><strong>Пост</strong> — ссылка на пост участника и превью текста (если это комментарий или репост с текстом)</li>
      <li><strong>Номер</strong> — порядковый номер регистрации в конкурсе (1, 2, 3...)</li>
      <li><strong>Статус</strong> — текущее состояние обработки (цветной бейдж)</li>
      <li><strong>Дата</strong> — когда человек зарегистрировался в конкурсе</li>
    </ul>

    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-blue-800 m-0">
          <strong>Удобно:</strong> Наведите курсор на строку участника — она подсветится, так легче читать длинные списки.
        </p>
      </div>
    </div>
  </>
);
