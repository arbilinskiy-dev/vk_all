import React from 'react';
import { ContentProps, NavigationButtons } from '../shared';
import {
  BeforeAfterSection,
  DemosSection,
  FAQSection,
  AdvantagesSection
} from './blacklist-page';

/**
 * Страница «Чёрный список участников» — хаб-компонент.
 * Секции вынесены в blacklist-page/.
 */
export const GeneralContestsBlacklistPage: React.FC<ContentProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Заголовок страницы */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Чёрный список участников
        </h1>
        <p className="text-lg text-gray-600">
          Узнайте, как исключать пользователей из конкурса, устанавливать временные блокировки и управлять списком нежелательных участников.
        </p>
      </div>

      {/* Что это такое */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Что такое "Чёрный список"?
        </h2>
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong className="text-red-700">Чёрный список</strong> — это механизм защиты конкурса от недобросовестных участников. Пользователи из чёрного списка автоматически исключаются из розыгрыша, даже если выполнили все условия.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>Кого добавлять:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Накрутчики</strong> — аккаунты, созданные только для участия в конкурсах (пустой профиль, без активности)</li>
            <li><strong>Многократные победители</strong> — если нужно дать шанс новым участникам</li>
            <li><strong>Нарушители правил</strong> — оскорбления в комментариях, спам, попытки обмануть систему</li>
            <li><strong>Проблемные получатели</strong> — те, кто не забирает призы или отказывается от них</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Блокировка может быть <strong>постоянной</strong> (навсегда) или <strong>временной</strong> (до определённой даты). Это позволяет гибко управлять доступом к конкурсам.
          </p>
        </div>
      </section>

      {/* Было / Стало */}
      <BeforeAfterSection />

      {/* Интерактивные демонстрации */}
      <DemosSection />

      {/* Частые вопросы */}
      <FAQSection />

      {/* Ключевые преимущества */}
      <AdvantagesSection />

      {/* Навигация */}
      <NavigationButtons
        onPrevious={() => onNavigate('2-4-4-10-sending-list')}
        onNext={() => onNavigate('2-4-4-12-preview')}
        previousLabel="Список рассылки"
        nextLabel="Предпросмотр"
      />
    </div>
  );
};
