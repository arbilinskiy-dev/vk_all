/**
 * Секция «Что такое вкладка "Победители"»
 * Описание функциональности вкладки победителей конкурсов.
 */
import React from 'react';

export const WhatIsSection: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Что такое вкладка "Победители"?
      </h2>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong className="text-amber-700">Вкладка "Победители"</strong> — это специальный раздел в универсальных конкурсах, который показывает список всех пользователей, выбранных победителями розыгрыша. Здесь вы можете увидеть:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
          <li>Дату проведения розыгрыша</li>
          <li>Информацию о победителе (имя, ссылку на профиль)</li>
          <li>Ссылку на пост автора-участника</li>
          <li>Ссылку на пост с итогами конкурса</li>
          <li>Описание приза</li>
          <li>Выданный промокод (если применимо)</li>
          <li>Статус доставки сообщения победителю</li>
        </ul>
        <p className="text-gray-700 leading-relaxed mt-4">
          Это финальный этап работы с конкурсом — здесь фиксируются результаты розыгрыша и контролируется процесс вручения призов.
        </p>
      </div>
    </section>
  );
};
