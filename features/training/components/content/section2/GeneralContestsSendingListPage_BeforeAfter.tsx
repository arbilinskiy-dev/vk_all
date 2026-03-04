import React from 'react';

/**
 * Секция «Было / Стало» —
 * сравнение ручного и автоматизированного процесса отправки призов.
 */
const GeneralContestsSendingListPage_BeforeAfter: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Было / Стало
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Было */}
        <div className="bg-white rounded-lg p-5 border-2 border-red-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600 text-xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Было (вручную)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Записывали в таблицу: кому отправили, когда</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Не знали, доставлено ли сообщение</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Если ошибка — искали пользователя вручную в VK</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Вручную писали повторное сообщение</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Теряли историю: не помнили, кому что отправляли</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-semibold text-red-700">
              ⏱ Время: ~15 минут на разбор ошибок
            </p>
          </div>
        </div>

        {/* Стало */}
        <div className="bg-white rounded-lg p-5 border-2 border-indigo-300">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-indigo-600 text-xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-indigo-900">Стало (автоматически)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Полная история в одной таблице</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Статус доставки в реальном времени</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Кнопка "Повторить" для каждой ошибки</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Массовый повтор всех ошибок одной кнопкой</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Счётчики успешных и неудачных отправок</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <p className="text-sm font-semibold text-indigo-700">
              ⏱ Время: ~1 минута на проверку и повтор
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              💰 Экономия: 14 минут
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GeneralContestsSendingListPage_BeforeAfter;
