import React from 'react';

/**
 * Секция «Было / Стало» — сравнение ручного и автоматического управления ЧС.
 */
export const BeforeAfterSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-sm border border-red-200 p-6">
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
              <span>Записывали ID нарушителей в отдельный файл</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Вручную проверяли каждого участника перед розыгрышем</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Забывали исключить заблокированных — они попадали в победители</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Не было временных блокировок — только навсегда</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Приходилось искать профиль VK, копировать ID, вставлять в список</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-semibold text-red-700">
              ⏱ Время: ~10 минут на каждого нарушителя
            </p>
          </div>
        </div>

        {/* Стало */}
        <div className="bg-white rounded-lg p-5 border-2 border-green-300">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900">Стало (автоматически)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>Кнопка "Добавить в ЧС" — вставляешь ссылки на профили</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>Система автоматически исключает их из розыгрыша</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>Можно заблокировать до определённой даты (например, на месяц)</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>Массовое добавление — несколько ссылок сразу</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span>История блокировок: видно, когда добавлен, до какой даты</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm font-semibold text-green-700">
              ⏱ Время: ~30 секунд на добавление
            </p>
            <p className="text-xs text-green-600 mt-1">
              💰 Экономия: 9.5 минут
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
