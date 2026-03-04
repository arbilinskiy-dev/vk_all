/**
 * Секция «Ключевые преимущества»
 * Карточки преимуществ вкладки победителей конкурсов.
 */
import React from 'react';

/** Структура карточки преимущества */
interface Advantage {
  icon: string;
  title: string;
  description: string;
}

/** Список преимуществ */
const advantages: Advantage[] = [
  {
    icon: '📊',
    title: 'Полная история',
    description:
      'Все данные о победителях сохраняются и доступны в любой момент для проверки и отчётности.',
  },
  {
    icon: '🎯',
    title: 'Прозрачность',
    description:
      'Видны все детали: кто победил, какой приз получил, успешно ли доставлено сообщение.',
  },
  {
    icon: '⚡',
    title: 'Быстрый доступ',
    description:
      'Один клик — и вы переходите к нужному посту или профилю победителя.',
  },
];

export const AdvantagesSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Ключевые преимущества
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {advantages.map((item, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl mb-2">{item.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
