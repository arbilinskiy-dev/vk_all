import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import {
  BeforeAfterSection,
  FAQSection,
  KeyAdvantagesSection,
  DemoSandboxes,
} from './general-contests-promocodes';

/**
 * Страница «Промокоды конкурса» — центр обучения.
 * Хаб-компонент: композиция секций и демо-блоков.
 */
export const GeneralContestsPromocodesPage: React.FC<ContentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Промокоды конкурса
        </h1>
        <p className="text-lg text-gray-600">
          Узнайте, как загружать промокоды для автоматической раздачи победителям, редактировать описания призов и контролировать статус выдачи.
        </p>
      </div>

      {/* Что это такое */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Что такое вкладка "Промокоды"?
        </h2>
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong className="text-indigo-700">Вкладка "Промокоды"</strong> — это база кодов для автоматической раздачи призов победителям конкурса. Система сама выдаёт промокоды при розыгрыше и отправляет их в личные сообщения.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Главная фишка — <strong>загрузка прямо из Excel</strong>. Вы копируете два столбца (код и описание приза) из таблицы и вставляете в форму — система автоматически распознаёт формат.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>База промокодов</strong> — таблица с кодами, статусами и информацией о выдаче</li>
            <li><strong>Свободные коды</strong> — доступны для раздачи новым победителям</li>
            <li><strong>Выданные коды</strong> — уже использованы, видна история (кому, когда)</li>
            <li><strong>Описание приза</strong> — текст, который можно вставить в сообщение через переменную</li>
          </ul>
        </div>
      </section>

      {/* Было / Стало */}
      <BeforeAfterSection />

      {/* Интерактивные демонстрации */}
      <DemoSandboxes />

      {/* Частые вопросы */}
      <FAQSection />

      {/* Ключевые преимущества */}
      <KeyAdvantagesSection />

      {/* Навигация */}
      <NavigationButtons
        onPrevious={() => onNavigate('2-4-4-8-winners')}
        onNext={() => onNavigate('2-4-4-10-sending-list')}
        previousLabel="Победители"
        nextLabel="Список рассылки"
      />
    </div>
  );
};
