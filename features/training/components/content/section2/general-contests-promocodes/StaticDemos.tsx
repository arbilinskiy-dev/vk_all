import React from 'react';

// ============================================
// Статические демо-компоненты (без состояния)
// ============================================

/**
 * Демо двухпанельного интерфейса: форма загрузки (33%) + таблица промокодов (67%).
 */
export const TwoPanelLayoutDemo: React.FC = () => {
  return (
    <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
      <div className="flex gap-4 h-96">
        {/* Левая панель - форма загрузки */}
        <div className="w-1/3 bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-sm">Загрузка кодов</h3>
            <span className="text-xs text-gray-500">33%</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2 text-xs text-blue-800">
            <p className="font-semibold">Формат: КОД | ОПИСАНИЕ</p>
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded p-2 text-xs text-gray-400 font-mono">
            PROMO123 | Скидка 500р<br/>
            WIN2024 | Пицца в подарок
          </div>
          <button className="mt-2 py-2 bg-indigo-600 text-white rounded text-sm font-medium">
            Загрузить в базу
          </button>
        </div>

        {/* Правая панель - таблица */}
        <div className="flex-1 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3 p-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-800 text-sm">База промокодов</h3>
            <span className="text-xs text-gray-500">67%</span>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs bg-green-50 p-2 rounded">
                <div className="w-20 font-mono font-bold">PROMO123</div>
                <div className="flex-1 text-gray-600">Скидка 500р</div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">Свободен</span>
              </div>
              <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                <div className="w-20 font-mono font-bold">WIN2024</div>
                <div className="flex-1 text-gray-600">Пицца в подарок</div>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">Выдан</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mt-3 text-center">
        💡 Разделение на панели позволяет работать с формой и видеть результат в таблице одновременно
      </p>
    </div>
  );
};

/**
 * Демо таблицы промокодов с 7 колонками: чекбокс, код, описание, статус,
 * кому выдан, диалог, удаление.
 */
export const PromocodesTableDemo: React.FC = () => {
  /** Мок-данные промокодов */
  const mockPromocodes = [
    { id: '1', code: 'PROMO123', description: 'Скидка 500 рублей', isFree: true },
    { id: '2', code: 'WIN2024', description: 'Бесплатная доставка', isFree: true },
    { id: '3', code: 'SALE777', description: 'Пицца в подарок', isFree: false, user: 'Анна Смирнова', userId: 123456, date: '15.02.2026' }
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">База промокодов</span>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-500">Всего: <strong>3</strong></span>
          <span className="text-green-600">Свободно: <strong>2</strong></span>
          <span className="text-indigo-600">Выдано: <strong>1</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-3 w-40">Код</th>
              <th className="px-4 py-3">Описание</th>
              <th className="px-4 py-3 w-28">Статус</th>
              <th className="px-4 py-3 w-48">Кому выдан</th>
              <th className="px-4 py-3 w-24 text-center">Диалог</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockPromocodes.map(promo => (
              <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-center">
                  {promo.isFree && <input type="checkbox" className="rounded border-gray-300" />}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700 font-medium">
                  {promo.code}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {promo.description}
                </td>
                <td className="px-4 py-3">
                  {promo.isFree ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      Свободен
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      Выдан
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!promo.isFree ? (
                    <div className="flex flex-col">
                      <span className="text-indigo-600 font-medium text-xs">{promo.user}</span>
                      <span className="text-xs text-gray-400">ID: {promo.userId}</span>
                      <span className="text-[10px] text-gray-400">{promo.date}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {!promo.isFree ? (
                    <button className="text-gray-400 hover:text-indigo-600 inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-indigo-50 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {promo.isFree && (
                    <button className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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

/**
 * Демо счётчиков и статусов: шапка с «Всего / Свободно / Выдано» + бейджи строк.
 */
export const StatusesAndCountersDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <span className="text-sm font-medium text-gray-700">База промокодов</span>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Всего: <strong className="text-gray-900">15</strong></span>
            <span className="text-green-600">Свободно: <strong>8</strong></span>
            <span className="text-indigo-600">Выдано: <strong>7</strong></span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded">
            <div className="flex items-center gap-3">
              <code className="font-mono font-bold text-sm">PROMO123</code>
              <span className="text-gray-600 text-sm">Скидка 500 рублей</span>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
              ✓ Свободен
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center gap-3">
              <code className="font-mono font-bold text-sm">WIN2024</code>
              <span className="text-gray-600 text-sm">Бесплатная доставка</span>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
              ✓ Выдан
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
        💡 <strong>Счётчики обновляются автоматически:</strong> При загрузке новых кодов увеличивается "Свободно", при выдаче победителям — "Выдано"
      </p>
    </div>
  );
};
