/**
 * Демо-компоненты для страницы «Победители конкурса».
 * Используются в секции интерактивных примеров (DemosSection).
 */
import React from 'react';

// ============================================
// Данные для демо
// ============================================

/** Мок-данные победителей */
const mockWinners = [
  {
    id: '1',
    date: '15 февраля 2026',
    winner: 'Анна Смирнова',
    prize: 'Скидка 20% на все товары',
    promo: 'WIN2026-ANNA',
    status: 'success' as const
  },
  {
    id: '2',
    date: '10 февраля 2026',
    winner: 'Дмитрий Козлов',
    prize: 'Бесплатная доставка на 3 месяца',
    promo: 'DELIVERY-FREE',
    status: 'success' as const
  },
  {
    id: '3',
    date: '5 февраля 2026',
    winner: 'Елена Петрова',
    prize: 'Подарочный набор',
    promo: '',
    status: 'error' as const
  }
];

// ============================================
// 1. Таблица победителей
// ============================================

export const WinnersTableDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
      {/* Шапка */}
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800">
          🏆 Список победителей
        </h3>
        <p className="text-sm text-amber-700 mt-1">
          Всего победителей: {mockWinners.length}
        </p>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата розыгрыша
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Победитель
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Пост автора
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Итоги конкурса
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Приз
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Промокод
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус доставки
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockWinners.map((winner) => (
              <tr key={winner.id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {winner.date}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    {winner.winner}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Открыть
                  </button>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <button className="inline-flex items-center px-3 py-1.5 border border-amber-200 rounded-md text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Итоги
                  </button>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {winner.prize}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {winner.promo ? (
                    <code className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs">
                      {winner.promo}
                    </code>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {winner.status === 'success' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Отправлено
                    </span>
                  ) : (
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help"
                      title="Пользователь запретил сообщения от сообщества"
                    >
                      ⚠ Ошибка
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// 2. Статусы доставки
// ============================================

export const DeliveryStatusDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Анна Смирнова</p>
            <p className="text-xs text-gray-500">15 февраля 2026</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Отправлено
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Сообщение с промокодом успешно доставлено победителю
        </p>
      </div>

      <div className="bg-white rounded-lg border border-yellow-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Елена Петрова</p>
            <p className="text-xs text-gray-500">5 февраля 2026</p>
          </div>
          <span 
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 cursor-help"
            title="Пользователь запретил сообщения от сообщества"
          >
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Ошибка доставки
          </span>
        </div>
        <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
          <strong>Причина:</strong> Пользователь запретил сообщения от сообщества
        </p>
        <p className="text-xs text-gray-600 mt-2">
          💡 Свяжитесь с победителем через комментарии или другие каналы
        </p>
      </div>
    </div>
  );
};

// ============================================
// 3. Ссылки на посты
// ============================================

export const PostLinksDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Кнопки для навигации:</h4>
        
        <div className="space-y-3">
          {/* Кнопка к посту автора */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Пост автора
            </button>
            <span className="text-sm text-gray-600">
              → Переход к публикации участника
            </span>
          </div>

          {/* Кнопка к итогам */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center px-4 py-2 border border-amber-200 rounded-md text-sm font-medium bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Итоги конкурса
            </button>
            <span className="text-sm text-gray-600">
              → Переход к посту с результатами
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Подсказка:</strong> Обе ссылки открываются в новой вкладке браузера
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 4. Отображение промокодов
// ============================================

export const PromoCodeDisplayDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Примеры отображения промокодов:</h4>
        
        <div className="space-y-3">
          {/* С промокодом */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Анна Смирнова</p>
              <p className="text-xs text-gray-500">Скидка 20%</p>
            </div>
            <code className="font-mono text-gray-700 bg-gray-100 px-3 py-1.5 rounded text-sm border border-gray-300">
              WIN2026-ANNA
            </code>
          </div>

          {/* С промокодом */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Дмитрий Козлов</p>
              <p className="text-xs text-gray-500">Бесплатная доставка</p>
            </div>
            <code className="font-mono text-gray-700 bg-gray-100 px-3 py-1.5 rounded text-sm border border-gray-300">
              DELIVERY-FREE
            </code>
          </div>

          {/* Без промокода */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Елена Петрова</p>
              <p className="text-xs text-gray-500">Подарочный набор (физический приз)</p>
            </div>
            <span className="text-gray-400 text-sm italic">
              — промокод не требуется —
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            💡 <strong>Моноширинный шрифт</strong> облегчает чтение и копирование промокодов
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// 5. Пустое состояние (нет победителей)
// ============================================

export const EmptyWinnersStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800">
          🏆 Список победителей
        </h3>
      </div>
      
      <div className="p-12 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Победители еще не выбраны
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Здесь появится список, когда вы проведете первый розыгрыш и опубликуете пост с итогами конкурса.
        </p>
      </div>
    </div>
  );
};

// ============================================
// 6. Состояние загрузки
// ============================================

export const LoadingWinnersStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800">
          🏆 Список победителей
        </h3>
      </div>
      
      <div className="p-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 text-sm">
          Загрузка списка победителей...
        </p>
      </div>
    </div>
  );
};

// ============================================
// 7. Шапка таблицы победителей
// ============================================

export const WinnersHeaderDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
      <div className="bg-amber-50 px-6 py-5 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-amber-800 mb-1">
              🏆 Список победителей
            </h3>
            <p className="text-sm text-amber-700">
              История всех розыгрышей и информация о призах
            </p>
          </div>
          <button className="px-4 py-2 border border-amber-200 rounded-md text-sm font-medium hover:bg-amber-100 text-amber-700 transition-colors">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50">
        <p className="text-sm text-gray-600 text-center">
          Золотистая цветовая гамма символизирует награды и достижения
        </p>
      </div>
    </div>
  );
};
