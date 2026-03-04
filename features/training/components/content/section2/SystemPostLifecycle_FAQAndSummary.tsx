import React from 'react';

/**
 * Секция «Частые вопросы» + «Совет эксперта» + «Итоги»
 * FAQ-аккордеоны, экспертный совет, финальный чеклист
 */
export const FAQAndSummarySection: React.FC = () => (
  <>
    {/* FAQ */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Частые вопросы</h2>

    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <summary className="cursor-pointer font-semibold text-gray-900">
        Почему верификация занимает так долго (до 5 минут)?
      </summary>
      <p className="mt-2 text-gray-700">
        Пост-трекер проверяет наличие постов на стене каждые 50 секунд, а не непрерывно. Это сделано для снижения нагрузки на VK API и предотвращения исчерпания лимитов запросов. В большинстве случаев пост находится за 1-2 минуты. 5 минут — это максимальный порог, после которого система считает, что произошла проблема.
      </p>
    </details>

    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <summary className="cursor-pointer font-semibold text-gray-900">
        Что произойдёт, если я отредактирую пост со статусом «Публикуется»?
      </summary>
      <p className="mt-2 text-gray-700">
        Редактирование поста со статусом «Публикуется» недоступно через интерфейс — кнопки действий заблокированы. Это предотвращает конфликт между изменением содержимого и одновременной верификацией. Если нужно внести правки — дождитесь завершения публикации (появится на стене) или отмените проверку через кнопку на иконке статуса.
      </p>
    </details>

    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <summary className="cursor-pointer font-semibold text-gray-900">
        Можно ли изменить интервал работы пост-трекера?
      </summary>
      <p className="mt-2 text-gray-700">
        Да, интервал задаётся в файле <code>scheduler_service.py</code> через параметр <code>IntervalTrigger(seconds=50)</code>. Однако уменьшение интервала увеличит нагрузку на VK API и может привести к блокировке приложения за превышение лимитов. 50 секунд — рекомендуемое значение, проверенное на практике.
      </p>
    </details>

    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <summary className="cursor-pointer font-semibold text-gray-900">
        Почему статус сбрасывается при любом редактировании?
      </summary>
      <p className="mt-2 text-gray-700">
        Сброс статуса на «Ожидает публикации» при сохранении — это мера безопасности. Если пост находился в статусе «Ошибка» или «Возможная ошибка», редактирование может исправить проблему (например, изменён текст или время). Автоматический сброс статуса позволяет пост-трекеру повторить публикацию без ручного вмешательства.
      </p>
    </details>

    <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <summary className="cursor-pointer font-semibold text-gray-900">
        Как отменить публикацию поста, который уже в статусе «Публикуется»?
      </summary>
      <p className="mt-2 text-gray-700">
        Нажмите на иконку статуса (синюю вращающуюся шестерёнку) в левом верхнем углу карточки поста. Появится всплывающее окно с подтверждением. Нажмите «Отменить проверку» — пост будет удалён из системы. Если пост уже опубликован на стене VK — он останется там, нужно будет удалить вручную через интерфейс ВКонтакте.
      </p>
    </details>

    <hr className="!my-10" />

    {/* Совет эксперта */}
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 p-6 rounded-r-lg my-8">
      <div className="flex items-start gap-4">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">💡</span>
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Совет эксперта</h4>
          <p className="text-gray-700 mb-3">
            Системные посты отлично подходят для регулярного контента без критичных временных требований. Если пост должен выйти точно в 10:00:00 — используйте отложенные записи VK. Если допустима погрешность в 1-2 минуты, но нужны AI-генерация или глобальные переменные — системные посты ваш выбор.
          </p>
          <p className="text-gray-700">
            При настройке циклических публикаций всегда устанавливайте лимит по количеству или дате окончания — это предотвратит бесконечное создание постов при забытой автоматизации. Проверяйте раздел «Системные посты» в календаре хотя бы раз в неделю, чтобы вовремя обнаружить посты со статусом «Ошибка» или «Возможная ошибка».
          </p>
        </div>
      </div>
    </div>

    <hr className="!my-10" />

    {/* Итоги */}
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 my-8">
      <h4 className="text-xl font-bold text-gray-900 mb-4">Итоги</h4>
      <ul className="space-y-2 text-gray-700">
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Пост-трекер — фоновый процесс на бэкенде, работающий каждые 50 секунд через APScheduler с Redis-блокировкой.
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Два прохода за цикл: поиск и публикация постов по времени + верификация опубликованных на стене VK.
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Статусы: pending → publishing → published (удалён) | publishing → possible_error (таймаут 5 мин) | publishing → error (исключение API).
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Верификация сверяет vk_post_id с реальными постами стены через wall.get каждые 50 секунд до 5 минут максимум.
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Редактирование автоматически сбрасывает статус на «Ожидает публикации» — универсальный способ восстановления.
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Циклическая регенерация: сначала создаётся следующий пост → потом удаляется текущий (гарантия непрерывности).
        </li>
        <li className="flex items-start">
          <span className="text-indigo-600 mr-2">•</span>
          Глобальные переменные подставляются при публикации, а не при создании — изменения значений применяются ко всем будущим публикациям.
        </li>
      </ul>
    </div>
  </>
);
