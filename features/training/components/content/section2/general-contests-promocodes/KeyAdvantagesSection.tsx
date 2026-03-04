import React from 'react';

/**
 * Секция «Ключевые преимущества» — карточки с описанием основных плюсов
 * системы промокодов: загрузка из Excel, автовыдача, полная история.
 */
export const KeyAdvantagesSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-sm border border-indigo-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Ключевые преимущества
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900 mb-2">Загрузка из Excel</h3>
          <p className="text-sm text-gray-600">
            Копируйте данные прямо из таблицы — система автоматически распознает формат. Экономия времени на ручной ввод.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">🤖</div>
          <h3 className="font-semibold text-gray-900 mb-2">Автовыдача</h3>
          <p className="text-sm text-gray-600">
            Система сама выбирает свободный промокод и отправляет его победителю. Никакой ручной работы.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Полная история</h3>
          <p className="text-sm text-gray-600">
            Видно кто, когда и какой код получил. Ссылки на профили и диалоги для быстрого доступа.
          </p>
        </div>
      </div>
    </section>
  );
};
