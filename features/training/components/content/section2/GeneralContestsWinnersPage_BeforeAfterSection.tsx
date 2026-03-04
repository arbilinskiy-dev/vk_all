/**
 * Секция «Было / Стало»
 * Сравнение ручного и автоматизированного процессов работы с победителями.
 */
import React from 'react';

export const BeforeAfterSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Было / Стало
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Было */}
        <div className="bg-white rounded-lg p-5 border-2 border-red-200">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600 text-xl">😔</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900">Было (вручную)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Записывали победителей в Excel-таблицу</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Вручную искали их профили ВКонтакте</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Копировали ссылки на посты в отдельный документ</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Отправляли сообщения с промокодами вручную</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2">•</span>
              <span>Отмечали в таблице, кому уже отправили</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-red-200">
            <p className="text-sm font-semibold text-red-700">
              ⏱ Время: ~45 минут на каждый розыгрыш
            </p>
          </div>
        </div>

        {/* Стало */}
        <div className="bg-white rounded-lg p-5 border-2 border-amber-300">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-amber-600 text-xl">🎉</span>
            </div>
            <h3 className="text-lg font-semibold text-amber-900">Стало (автоматически)</h3>
          </div>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>Все данные о победителях собираются автоматически</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>Система сохраняет ссылки на посты участников</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>Промокоды генерируются и фиксируются автоматически</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>Сообщения отправляются системой</span>
            </li>
            <li className="flex items-start">
              <span className="text-amber-500 mr-2">•</span>
              <span>Статус доставки отображается в реальном времени</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-sm font-semibold text-amber-700">
              ⏱ Время: ~2 минуты на просмотр результатов
            </p>
            <p className="text-xs text-amber-600 mt-1">
              💰 Экономия: 43 минуты на розыгрыш
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
