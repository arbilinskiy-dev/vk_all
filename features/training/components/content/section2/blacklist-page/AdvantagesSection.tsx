import React from 'react';

/**
 * Секция «Ключевые преимущества» — 3 карточки-преимущества чёрного списка.
 */
export const AdvantagesSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm border border-red-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Ключевые преимущества
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-3xl mb-2">🚫</div>
          <h3 className="font-semibold text-gray-900 mb-2">Автоматическое исключение</h3>
          <p className="text-sm text-gray-600">
            Заблокированные пользователи не попадут в розыгрыш — система проверяет чёрный список автоматически.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="font-semibold text-gray-900 mb-2">Временные блокировки</h3>
          <p className="text-sm text-gray-600">
            Заблокируйте пользователя до конкретной даты — система разблокирует автоматически.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900 mb-2">Массовое добавление</h3>
          <p className="text-sm text-gray-600">
            Добавьте несколько пользователей сразу — вставьте ссылки построчно, система обработает все.
          </p>
        </div>
      </div>
    </section>
  );
};
