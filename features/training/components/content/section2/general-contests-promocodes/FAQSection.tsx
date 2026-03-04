import React from 'react';

/**
 * Секция «Частые вопросы» по промокодам конкурса.
 * 6 раскрывающихся блоков (details/summary) с ответами.
 */
export const FAQSection: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Частые вопросы
      </h2>
      
      <div className="space-y-4">
        {/* Как загрузить промокоды из Excel? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Как загрузить промокоды из Excel?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Откройте вашу таблицу Excel, выделите два столбца (первый — коды, второй — описания призов) и скопируйте (Ctrl+C). Затем вставьте в текстовое поле на форме загрузки. Система автоматически распознает табуляцию и преобразует её в формат "КОД | ОПИСАНИЕ".
            </p>
            <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200 mt-2">
              💡 <strong>Совет:</strong> Если в Excel только коды без описаний — просто копируйте один столбец. Описание необязательно.
            </p>
          </div>
        </details>

        {/* Что означает "Свободно" и "Выдано"? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что означает "Свободно" и "Выдано"?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              <strong className="text-green-700">Свободно</strong> — промокод ещё не использован, доступен для автоматической выдачи новым победителям. Такие коды можно редактировать и удалять.
            </p>
            <p className="text-gray-700 mt-2">
              <strong className="text-gray-700">Выдано</strong> — промокод уже отправлен победителю. Система показывает кому, когда и есть ссылка на диалог с этим пользователем. Редактирование и удаление заблокированы.
            </p>
          </div>
        </details>

        {/* Зачем нужно описание приза? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Зачем нужно описание приза?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Описание используется в шаблоне сообщения победителю. В настройках конкурса вы можете вставить переменную <code className="bg-gray-200 px-1 rounded">{'{description}'}</code>, и система автоматически подставит текст описания при отправке.
            </p>
            <p className="text-gray-700">
              Например, если описание — "Скидка 500 рублей на первый заказ", победитель получит сообщение: "Поздравляем! Ваш промокод WIN123 даёт вам <strong>Скидка 500 рублей на первый заказ</strong>."
            </p>
          </div>
        </details>

        {/* Что делать, если свободных кодов меньше, чем победителей? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что делать, если свободных кодов меньше, чем победителей?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Система покажет жёлтое предупреждение: "Не хватает промокодов. Свободно N шт., нужно минимум M (по количеству победителей)." Загрузите дополнительные промокоды через форму или нажмите кнопку "Обновить" для проверки актуальных данных.
            </p>
          </div>
        </details>

        {/* Можно ли удалить выданный промокод? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Можно ли удалить выданный промокод?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 mb-2">
              Нет, выданные промокоды нельзя удалить обычным способом — это история розыгрышей, которая должна сохраняться для отчётности. Удалять можно только свободные коды.
            </p>
            <p className="text-gray-700">
              Если вам нужно полностью очистить базу (включая выданные), используйте кнопку <strong className="text-red-600">"Очистить базу"</strong>. Она доступна только администраторам и требует дополнительного подтверждения.
            </p>
          </div>
        </details>

        {/* Что такое кнопка "Диалог" в таблице? */}
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
            <span className="font-medium text-gray-900">
              Что такое кнопка "Диалог" в таблице?
            </span>
            <span className="text-indigo-600 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Это быстрая ссылка на диалог с пользователем, которому выдан промокод. Клик открывает окно сообщений ВКонтакте в новой вкладке, где вы можете продолжить общение с победителем или проверить статус доставки сообщения.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
};
