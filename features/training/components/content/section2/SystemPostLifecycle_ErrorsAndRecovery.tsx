import React from 'react';
import { Sandbox } from '../shared';
import { ErrorRecoveryDemo } from './SystemPostLifecycleMocks';

/**
 * Секция «Обработка ошибок и восстановление» + «Ручная публикация»
 * Таблица сравнения ошибок, пути восстановления, ручная публикация
 */
export const ErrorsAndRecoverySection: React.FC = () => (
  <>
    {/* Ошибки и восстановление */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Обработка ошибок и восстановление</h2>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Не всегда публикация проходит гладко. Проблемы с токеном доступа, временные сбои VK API, сетевые ошибки или неверные настройки могут привести к двум типам ошибочных статусов: «Ошибка» и «Возможная ошибка». Важно понимать разницу между ними и знать, как правильно реагировать.
    </p>

    <div className="not-prose my-8">
      <Sandbox
        title="Пути восстановления"
        description="Выберите тип ошибки, чтобы увидеть доступные действия"
        instructions={['Каждый тип ошибки имеет свои рекомендуемые действия']}
      >
        <ErrorRecoveryDemo />
      </Sandbox>
    </div>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Ошибка vs Возможная ошибка</h3>

    <div className="overflow-x-auto my-6">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Критерий</th>
            <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Ошибка</th>
            <th className="px-4 py-2 border-b border-gray-300 text-left text-sm font-semibold text-gray-900">Возможная ошибка</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr>
            <td className="px-4 py-2 border-b border-gray-300 font-medium">Причина</td>
            <td className="px-4 py-2 border-b border-gray-300">Исключение при вызове API VK (токен, права, сеть)</td>
            <td className="px-4 py-2 border-b border-gray-300">Таймаут верификации (пост не найден за 5 минут)</td>
          </tr>
          <tr>
            <td className="px-4 py-2 border-b border-gray-300 font-medium">Вероятность публикации</td>
            <td className="px-4 py-2 border-b border-gray-300">0% — пост точно НЕ опубликован</td>
            <td className="px-4 py-2 border-b border-gray-300">~50% — может быть опубликован с задержкой</td>
          </tr>
          <tr>
            <td className="px-4 py-2 border-b border-gray-300 font-medium">Риск дубликата</td>
            <td className="px-4 py-2 border-b border-gray-300">Нет — безопасно публиковать заново</td>
            <td className="px-4 py-2 border-b border-gray-300">Есть — сначала проверить стену вручную!</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium">Рекомендуемое действие</td>
            <td className="px-4 py-2">Исправить проблему → «Опубликовать сейчас»</td>
            <td className="px-4 py-2">Проверить стену → «Подтвердить» или повторить</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Восстановление через редактирование</h3>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Самый универсальный способ восстановления — открыть пост на редактирование и нажать «Сохранить» (даже без изменений). Это автоматически сбрасывает статус на «Ожидает публикации» и очищает все данные верификации (<code>vk_post_id</code>, <code>last_checked_at</code>). Пост снова попадёт в очередь пост-трекера при наступлении его времени публикации.
    </p>

    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 my-6">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">⚠️</span>
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-1">Осторожно с «Возможной ошибкой»</h4>
          <p className="text-sm text-gray-700">
            Перед повторной публикацией поста со статусом «Возможная ошибка» обязательно проверьте стену сообщества вручную. Пост мог быть опубликован, но с задержкой синхронизации. Повторная публикация создаст дубликат на стене.
          </p>
        </div>
      </div>
    </div>

    <hr className="!my-10" />

    {/* Ручная публикация */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Ручная публикация «Опубликовать сейчас»</h2>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Помимо автоматической публикации по расписанию, можно опубликовать системный пост немедленно через кнопку в карточке поста. Процесс похож на автоматический, но имеет важные отличия.
    </p>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Как работает ручная публикация</h3>

    <ol className="!text-base !leading-relaxed !text-gray-700">
      <li>
        <strong>Проверка статуса</strong> — кнопка доступна только для постов со статусами «Ожидает публикации», «Ошибка» или «Возможная ошибка». Для статуса «Публикуется» кнопка заблокирована.
      </li>
      <li>
        <strong>Немедленный вызов API</strong> — в отличие от автоматической публикации, которая ждёт следующего цикла трекера (до 50 секунд), ручная публикация вызывает <code>wall.post</code> сразу при нажатии кнопки.
      </li>
      <li>
        <strong>Статус «Публикуется»</strong> — после успешной отправки в VK пост получает статус «Публикуется» и <code>vk_post_id</code>, как при автоматической публикации.
      </li>
      <li>
        <strong>Верификация пост-трекером</strong> — дальше процесс идентичен автоматическому: пост-трекер в следующем цикле (до 50 секунд) найдёт пост со статусом «Публикуется» и начнёт верификацию.
      </li>
    </ol>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
      <p className="text-sm text-gray-700 mb-2">
        <strong>Сравнение автоматической и ручной публикации:</strong>
      </p>
      <ul className="text-sm text-gray-700 space-y-1 ml-4">
        <li>• <strong>Автоматическая:</strong> Пост ждёт наступления <code>publication_date</code> → в ближайшем цикле трекера (до 50 сек) отправляется в VK → верификация каждые 50 сек → удаление при обнаружении</li>
        <li>• <strong>Ручная:</strong> Немедленная отправка в VK (без ожидания) → верификация каждые 50 сек → удаление при обнаружении</li>
      </ul>
    </div>
  </>
);
