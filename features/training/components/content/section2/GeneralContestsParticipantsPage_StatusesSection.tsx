import React from 'react';
import { Sandbox } from '../shared';
import { StatusBadgesDemo } from './GeneralContestsParticipantsPage_Mocks';

// =====================================================================
// Секция «Статусы участников»: расшифровка каждого статуса + демо
// =====================================================================

export const StatusesSection: React.FC = () => (
  <>
    <h2>Статусы участников</h2>
    <p>
      Система отслеживает в каком состоянии находится обработка каждого участника. Статус показывается цветным бейджем в столбце "Статус".
    </p>

    <div className="not-prose my-6">
      <Sandbox title="Все возможные статусы">
        <StatusBadgesDemo />
      </Sandbox>
    </div>

    <p><strong>Расшифровка статусов:</strong></p>

    <div className="space-y-3 my-4">
      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex-shrink-0">Обработан</span>
        <div>
          <p className="!m-0 text-sm text-green-800">
            Участник прошёл проверку условий, получил порядковый номер и может претендовать на победу. Это финальный статус для обычных участников.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse flex-shrink-0">В очереди</span>
        <div>
          <p className="!m-0 text-sm text-blue-800">
            Система обнаружила участника, но ещё проверяет выполнение условий. Обычно обработка занимает несколько секунд. Бейдж мигает, показывая активный процесс.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">Победитель</span>
        <div>
          <p className="!m-0 text-sm text-amber-900">
            Участник был случайно выбран победителем при подведении итогов конкурса. Система автоматически присваивает этот статус при завершении.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex-shrink-0">Ошибка</span>
        <div>
          <p className="!m-0 text-sm text-red-800">
            Произошла ошибка при проверке условий (например, участник удалил комментарий или закрыл профиль). Такие участники не попадают в розыгрыш.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 flex-shrink-0">Новый</span>
        <div>
          <p className="!m-0 text-sm text-gray-800">
            Только что обнаруженный участник, обработка еще не началась. Обычно быстро меняется на "В очереди".
          </p>
        </div>
      </div>
    </div>
  </>
);
