import React from 'react';

/**
 * Секция «Частые вопросы» —
 * аккордеон с ответами на типичные вопросы о журнале отправки призов.
 */
const GeneralContestsSendingListPage_FAQ: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Частые вопросы
      </h2>
      
      <div className="space-y-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Почему статус "error" — что пошло не так?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Статус "error" означает, что сообщение не было доставлено победителю. Самые частые причины:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Закрытые личные сообщения</strong> — пользователь запретил сообщения от сообществ в настройках VK</li>
              <li><strong>Заблокированное сообщество</strong> — пользователь добавил ваше сообщество в чёрный список</li>
              <li><strong>Удалённая страница</strong> — профиль победителя был удалён или заблокирован</li>
            </ul>
            <p className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200 mt-3">
              💡 <strong>Совет:</strong> Используйте кнопку "Повторить" — иногда пользователь открывает сообщения после первой попытки.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что делает кнопка "Повторить"?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Кнопка "Повторить" делает новую попытку отправить сообщение с промокодом этому пользователю. Система использует тот же код и тот же текст сообщения. Если на этот раз доставка успешна — статус в таблице изменится на "sent" (успешно).
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Когда использовать "Повторить всем"?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Используйте "Повторить всем" в таких случаях:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>После проведения розыгрыша было много ошибок доставки</li>
              <li>Прошло время, и пользователи могли открыть сообщения</li>
              <li>Вы объявили в посте, что победителям нужно разрешить сообщения от сообщества</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Система попробует отправить сообщения всем пользователям со статусом "error" автоматически.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Можно ли восстановить журнал после очистки?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              <strong className="text-red-600">Нет, восстановить нельзя.</strong> Кнопка "Очистить" удаляет все записи безвозвратно. Именно поэтому перед удалением показывается всплывающее окно с предупреждением и красной кнопкой подтверждения. Используйте эту функцию только когда уверены.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Зачем очищать журнал?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Очистка журнала нужна для циклических конкурсов. Если конкурс повторяется каждую неделю, старые записи накапливаются и мешают анализировать текущий розыгрыш. Очистите журнал после завершения цикла, чтобы начать новый розыгрыш с чистого листа.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Как часто обновляется журнал?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Журнал загружается автоматически при открытии вкладки. Если вы используете кнопку "Повторить" или "Повторить всем", после выполнения действия таблица обновляется автоматически, показывая актуальные статусы. Обновлять страницу вручную не нужно.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
};

export default GeneralContestsSendingListPage_FAQ;
