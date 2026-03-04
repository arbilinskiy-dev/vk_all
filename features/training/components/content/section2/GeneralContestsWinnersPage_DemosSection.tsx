/**
 * Секция «Интерактивные примеры»
 * Обёртки Sandbox для 7 демо-компонентов победителей конкурсов.
 */
import React from 'react';
import { Sandbox } from '../shared';
import {
  WinnersTableDemo,
  DeliveryStatusDemo,
  PostLinksDemo,
  PromoCodeDisplayDemo,
  EmptyWinnersStateDemo,
  LoadingWinnersStateDemo,
  WinnersHeaderDemo,
} from './GeneralContestsWinnersPage_DemoComponents';

export const DemosSection: React.FC = () => {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        Интерактивные примеры
      </h2>

      {/* 1. Таблица победителей */}
      <Sandbox
        title="1. Таблица победителей с полной информацией"
        description="Таблица показывает 7 колонок с данными о каждом победителе: дату розыгрыша, имя победителя, ссылки на посты, информацию о призе, промокод и статус доставки."
        highlight="amber"
      >
        <WinnersTableDemo />
      </Sandbox>

      {/* 2. Статусы доставки */}
      <Sandbox
        title="2. Статусы доставки сообщений"
        description="Система показывает, было ли успешно доставлено сообщение с промокодом победителю. Зелёный статус означает успешную отправку, жёлтый — ошибку с подробностями."
        highlight="amber"
      >
        <DeliveryStatusDemo />
      </Sandbox>

      {/* 3. Ссылки на посты */}
      <Sandbox
        title="3. Кнопки перехода к постам"
        description="Две кнопки для быстрого перехода: серая ведёт к посту автора-участника, золотистая — к посту с итогами конкурса."
        highlight="amber"
      >
        <PostLinksDemo />
      </Sandbox>

      {/* 4. Отображение промокодов */}
      <Sandbox
        title="4. Отображение промокодов"
        description="Промокоды показываются моноширинным шрифтом для удобства чтения и копирования. Если промокод не выдавался, ячейка остаётся пустой."
        highlight="amber"
      >
        <PromoCodeDisplayDemo />
      </Sandbox>

      {/* 5. Пустое состояние */}
      <Sandbox
        title="5. Состояние до проведения розыгрыша"
        description="Если победители ещё не выбраны, система показывает информативное сообщение с подсказкой."
        highlight="amber"
      >
        <EmptyWinnersStateDemo />
      </Sandbox>

      {/* 6. Загрузка данных */}
      <Sandbox
        title="6. Загрузка списка победителей"
        description="При загрузке данных показывается анимированный спиннер в золотистом цвете, соответствующем тематике победителей."
        highlight="amber"
      >
        <LoadingWinnersStateDemo />
      </Sandbox>

      {/* 7. Шапка таблицы */}
      <Sandbox
        title="7. Заголовок секции победителей"
        description="Шапка вкладки выполнена в золотистой цветовой гамме, символизирующей награды и достижения."
        highlight="amber"
      >
        <WinnersHeaderDemo />
      </Sandbox>
    </section>
  );
};
