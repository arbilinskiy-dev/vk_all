import React from 'react';

/**
 * Секция «Было / Стало» — сравнение ручного и автоматического процесса
 * выдачи промокодов победителям конкурса.
 */
export const BeforeAfterSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Было / Стало
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Было */}
        <div className="bg-white rounded-lg p-5 border-2 border-red-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600 text-xl">😰</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Было (вручную)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Хранили промокоды в Excel-файле</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Вручную копировали код для каждого победителя</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Отмечали в таблице "выдано/не выдано"</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Писали победителям через интерфейс VK</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Теряли историю: не помнили, кому что выдали</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-semibold text-red-700">
              ⏱ Время: ~20 минут на 10 победителей
            </p>
          </div>
        </div>

        {/* Стало */}
        <div className="bg-white rounded-lg p-5 border-2 border-indigo-300">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-indigo-600 text-xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-indigo-900">Стало (автоматически)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Загрузили коды один раз из Excel (копировать-вставить)</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Система автоматически выдаёт коды победителям</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Статусы обновляются в реальном времени</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Сообщения отправляются автоматически</span>
            </li>
            <li className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Полная история: видно кто, когда и что получил</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <p className="text-sm font-semibold text-indigo-700">
              ⏱ Время: ~30 секунд на загрузку базы
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              💰 Экономия: 19 минут 30 секунд
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
