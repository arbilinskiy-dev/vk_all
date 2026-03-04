import React from 'react';

/**
 * Секция «Частые вопросы» — FAQ по чёрному списку конкурсов.
 */
export const FAQSection: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Частые вопросы
      </h2>
      
      <div className="space-y-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Как работает временная блокировка?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              При добавлении пользователя в чёрный список вы выбираете срок блокировки:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>Бессрочно</strong> — пользователь остаётся в чёрном списке навсегда, пока вы его не удалите вручную</li>
              <li><strong>До даты</strong> — выбираете конкретную дату окончания блокировки. После этой даты система автоматически разблокирует пользователя</li>
            </ul>
            <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200 mt-3">
              💡 <strong>Совет:</strong> Используйте временные блокировки для тех, кто нарушил правила впервые — дайте им второй шанс через месяц.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Можно ли добавить несколько пользователей сразу?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Да! В модальном окне "Добавить в ЧС" есть поле для ввода ссылок. Вставьте ссылки на профили VK <strong>по одной в строке</strong>:
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs mt-2 mb-2 overflow-x-auto">
{`https://vk.com/id12345
https://vk.com/durov
https://vk.com/id999888`}
            </pre>
            <p className="text-gray-700">
              Система автоматически извлечёт VK ID из каждой ссылки и добавит всех пользователей в чёрный список одновременно.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что произойдёт, если заблокированный пользователь уже участвует?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Если пользователь уже в списке участников конкурса, а вы добавили его в чёрный список, система автоматически исключит его при следующем обновлении списка участников. Он <strong>не попадёт в розыгрыш</strong>, даже если выполнил все условия.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Как удалить пользователя из чёрного списка (разблокировать)?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Найдите пользователя в таблице чёрного списка и нажмите кнопку <strong>"Удалить"</strong> (красный текст) в колонке "Действия". Появится всплывающее окно подтверждения с вопросом:
            </p>
            <div className="bg-gray-100 p-3 rounded border border-gray-300 my-2">
              <p className="text-sm text-gray-700"><strong>Удалить из чёрного списка?</strong></p>
              <p className="text-sm text-gray-600">Разблокировать {'{имя пользователя}'}?</p>
            </div>
            <p className="text-gray-700">
              Нажмите "Разблокировать" — пользователь сможет снова участвовать в конкурсах.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Виден ли чёрный список одного конкурса в другом?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              <strong>Нет, чёрный список уникален для каждого конкурса.</strong> Если вы заблокировали пользователя в "Конкурсе А", он <strong>не</strong> будет заблокирован автоматически в "Конкурсе Б".
            </p>
            <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mt-2">
              💡 <strong>Совет:</strong> Если нужно заблокировать одного и того же пользователя в нескольких конкурсах, добавьте его в чёрный список каждого конкурса отдельно.
            </p>
          </div>
        </details>

        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что делать, если не могу добавить пользователя в ЧС?
            </span>
            <span className="text-red-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Если при клике на кнопку "Добавить в ЧС" появляется предупреждение <strong>"Сохраните конкурс перед добавлением в чёрный список"</strong>, это означает, что конкурс ещё не создан в системе.
            </p>
            <p className="text-gray-700 font-semibold mt-2">Решение:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4 mt-1">
              <li>Вернитесь на вкладку "Настройки"</li>
              <li>Заполните обязательные поля (название, описание, условия)</li>
              <li>Нажмите "Сохранить" или "Создать конкурс"</li>
              <li>Вернитесь на вкладку "Чёрный список" — теперь кнопка будет работать</li>
            </ol>
          </div>
        </details>
      </div>
    </section>
  );
};
