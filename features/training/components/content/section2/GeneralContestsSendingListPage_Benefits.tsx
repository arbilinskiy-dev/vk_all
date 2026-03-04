import React from 'react';

/**
 * Секция «Ключевые преимущества» —
 * карточки с основными плюсами журнала отправки призов.
 */
const GeneralContestsSendingListPage_Benefits: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-sm border border-indigo-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Ключевые преимущества
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">Полная прозрачность</h3>
          <p className="text-sm text-gray-600">
            Видно всё: кто получил приз, когда, с каким результатом. Никакой неопределённости.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">🔄</div>
          <h3 className="font-semibold text-gray-900 mb-2">Автоповтор ошибок</h3>
          <p className="text-sm text-gray-600">
            Не нужно вручную искать и писать пользователям. Кнопка "Повторить всем" делает всё за вас.
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-semibold text-gray-900 mb-2">Контроль в реальном времени</h3>
          <p className="text-sm text-gray-600">
            Счётчики показывают актуальную статистику. Сразу видно, есть ли проблемы с доставкой.
          </p>
        </div>
      </div>
    </section>
  );
};

export default GeneralContestsSendingListPage_Benefits;
