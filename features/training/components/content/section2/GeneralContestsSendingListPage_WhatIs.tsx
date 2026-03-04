import React from 'react';

/**
 * Секция «Что такое Журнал отправки призов» —
 * описание функциональности и ключевых возможностей.
 */
const GeneralContestsSendingListPage_WhatIs: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Что такое "Журнал отправки призов"?
      </h2>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong className="text-indigo-700">Журнал отправки призов</strong> — это детальная история всех попыток отправить промокоды и призы победителям конкурса. Здесь видно:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li><strong>Кто получил приз</strong> — имя победителя и его VK ID</li>
          <li><strong>Какой код отправлен</strong> — конкретный промокод из базы</li>
          <li><strong>Статус доставки</strong> — успешно или ошибка</li>
          <li><strong>Время отправки</strong> — точная дата и время попытки</li>
          <li><strong>Возможность повтора</strong> — если доставка не удалась, можно попробовать снова</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-4">
          Это контрольная точка для проверки: все ли победители получили свои призы. Если кто-то не получил — видна причина ошибки.
        </p>
      </div>
    </section>
  );
};

export default GeneralContestsSendingListPage_WhatIs;
