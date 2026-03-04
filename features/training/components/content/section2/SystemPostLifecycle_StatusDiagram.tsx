import React from 'react';
import { Sandbox } from '../shared';
import { FullStatusTransitionDemo } from './SystemPostLifecycleMocks';

/**
 * Секция «Полная диаграмма переходов статусов»
 * Интерактивная диаграмма + описание каждого перехода
 */
export const StatusDiagramSection: React.FC = () => (
  <>
    {/* Диаграмма статусов */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Полная диаграмма переходов статусов</h2>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Системный пост может находиться в одном из четырёх основных состояний, и между ними существуют чёткие правила переходов. Понимание этой диаграммы помогает быстро диагностировать проблемы и принимать правильные решения при работе с постами.
    </p>

    <div className="not-prose my-8">
      <Sandbox
        title="Интерактивная диаграмма статусов"
        description="Выберите статус, чтобы увидеть возможные переходы из него"
        instructions={['Кликайте на статусы для фильтрации переходов']}
      >
        <FullStatusTransitionDemo />
      </Sandbox>
    </div>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Описание переходов</h3>

    <div className="space-y-4 my-6">
      <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
        <h4 className="font-bold text-blue-900">Ожидает публикации → Публикуется</h4>
        <p className="text-sm text-gray-700">
          <strong>Триггер:</strong> Наступило запланированное время (пост-трекер нашёл пост) ИЛИ пользователь нажал кнопку «Опубликовать сейчас».<br />
          <strong>Действие:</strong> Атомарное изменение статуса в БД, затем вызов <code>wall.post</code> VK API.
        </p>
      </div>

      <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r-lg">
        <h4 className="font-bold text-green-900">Публикуется → Опубликован (удалён)</h4>
        <p className="text-sm text-gray-700">
          <strong>Триггер:</strong> Пост-трекер нашёл <code>vk_post_id</code> в списке постов стены VK.<br />
          <strong>Действие:</strong> Если циклический — создание следующего поста. Затем удаление текущего из базы данных.
        </p>
      </div>

      <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 rounded-r-lg">
        <h4 className="font-bold text-amber-900">Публикуется → Возможная ошибка</h4>
        <p className="text-sm text-gray-700">
          <strong>Триггер:</strong> Прошло более 5 минут с момента <code>publication_date</code>, пост не найден на стене.<br />
          <strong>Действие:</strong> Изменение статуса на <code>possible_error</code>. Пост-трекер больше не проверяет этот пост.
        </p>
      </div>

      <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r-lg">
        <h4 className="font-bold text-red-900">Публикуется → Ошибка</h4>
        <p className="text-sm text-gray-700">
          <strong>Триггер:</strong> Исключение при вызове VK API (неверный токен, недостаточно прав, сбой сети).<br />
          <strong>Действие:</strong> Изменение статуса на <code>error</code>. Публикация прекращается до ручного вмешательства.
        </p>
      </div>

      <div className="border-l-4 border-gray-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
        <h4 className="font-bold text-gray-900">Возможная ошибка / Ошибка → Ожидает публикации</h4>
        <p className="text-sm text-gray-700">
          <strong>Триггер:</strong> Пользователь открыл пост на редактирование и нажал «Сохранить» (даже без изменений).<br />
          <strong>Действие:</strong> Статус автоматически сбрасывается на <code>pending_publication</code>. Пост снова попадёт в очередь публикации при наступлении времени.
        </p>
      </div>
    </div>
  </>
);
