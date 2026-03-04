import React from 'react';

// ============================================
// Статические секции страницы «Предпросмотр конкурса»
// ============================================

/** Секция «Что такое предпросмотр» */
export const WhatIsPreviewSection: React.FC = () => (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
      Что такое "Предпросмотр"?
    </h2>
    <div className="prose prose-blue max-w-none">
      <p className="text-gray-700 leading-relaxed mb-4">
        <strong className="text-indigo-700">Предпросмотр</strong> — это режим, который показывает, как будут выглядеть все посты и сообщения конкурса в интерфейсе ВКонтакте. Вы видите <strong>точную имитацию VK</strong>: цвета, шрифты, кнопки, аватары — всё как в настоящей социальной сети.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        <strong>Что показывается:</strong>
      </p>
      <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
        <li><strong>Стартовый пост</strong> — как будет выглядеть объявление о начале конкурса (с текстом и фотографиями)</li>
        <li><strong>Итоговый пост</strong> — как система оформит результаты с именами и номерами победителей</li>
        <li><strong>Личное сообщение</strong> — какой текст с промокодом получит победитель в ЛС</li>
        <li><strong>Комментарий-заглушка</strong> — что система напишет под постом пользователя, если личные сообщения закрыты</li>
      </ul>
      <p className="text-gray-700 leading-relaxed mt-4">
        Превью показывает <strong>подстановку переменных</strong> с примерами данных. Например, <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{winners_list}'}</code> заменяется на «1. Иван Петров (№42)», а <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{promo_code}'}</code> на «WIN-2025».
      </p>
    </div>
  </section>
);

/** Секция «Было / Стало» — сравнение ручного и автоматического подхода */
export const BeforeAfterSection: React.FC = () => (
  <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
      Было / Стало
    </h2>
    
    <div className="grid md:grid-cols-2 gap-6">
      {/* Было */}
      <div className="bg-white rounded-lg p-5 border-2 border-red-200">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-red-600 text-xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-red-900">Было (вручную)</h3>
        </div>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Писали текст поста в блокноте, не видя как выглядит</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Не знали, куда встанут переменные типа {'{winners_list}'}</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Публиковали пост — только тогда видели опечатки</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Приходилось редактировать уже опубликованный пост</span>
          </li>
          <li className="flex items-start">
            <span className="text-red-500 mr-2">•</span>
            <span>Не было уверенности: правильно ли подставятся данные</span>
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-red-200">
          <p className="text-sm font-semibold text-red-700">
            ⏱ Время: ~20 минут на правки после публикации
          </p>
        </div>
      </div>

      {/* Стало */}
      <div className="bg-white rounded-lg p-5 border-2 border-green-300">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-green-600 text-xl">✅</span>
          </div>
          <h3 className="text-lg font-semibold text-green-900">Стало (автоматически)</h3>
        </div>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Видите точную имитацию VK ещё до публикации</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Переменные подставлены с примерами данных</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Видно, как выглядят все 3 сценария (старт, итоги, ЛС)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Проверяете текст, форматирование, фото перед запуском</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Запускаете конкурс с уверенностью — всё проверено</span>
          </li>
        </ul>
        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-sm font-semibold text-green-700">
            ⏱ Время: ~2 минуты на проверку
          </p>
          <p className="text-xs text-green-600 mt-1">
            💰 Экономия: 18 минут + нет правок после публикации
          </p>
        </div>
      </div>
    </div>
  </section>
);

/** Секция «Частые вопросы» — 6 раскрывающихся блоков */
export const FAQSection: React.FC = () => (
  <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
      Частые вопросы
    </h2>
    
    <div className="space-y-4">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Зачем нужен предпросмотр, если можно просто опубликовать?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 mb-2">
            Предпросмотр помогает избежать ошибок <strong>до</strong> публикации:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>Опечатки в тексте</strong> — исправьте до того, как участники увидят</li>
            <li><strong>Неправильные переменные</strong> — убедитесь, что {'{winners_list}'} стоит в нужном месте</li>
            <li><strong>Форматирование</strong> — проверьте переносы строк, эмодзи, пробелы</li>
            <li><strong>Фотографии</strong> — убедитесь, что загрузили правильные изображения</li>
          </ul>
          <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mt-3">
            💡 <strong>Правило:</strong> Всегда проверяйте превью перед запуском конкурса. Правки после публикации видны всем участникам — это выглядит непрофессионально.
          </p>
        </div>
      </details>

      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Где найти вкладку "Превью"?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 mb-2">
            Вкладка "Превью" находится на странице редактирования конкурса:
          </p>
          <ol className="list-decimal list-inside text-gray-700 space-y-1 ml-4">
            <li>Откройте раздел "Автоматизации" → "Универсальные конкурсы"</li>
            <li>Выберите конкурс из списка (или создайте новый)</li>
            <li>В верхней части экрана увидите вкладки: Настройки, Условия, Участники, Победители, Промокоды, Список рассылки, Чёрный список, <strong>Превью</strong></li>
            <li>Кликните на "Превью" — справа откроется панель с имитацией VK</li>
          </ol>
          <p className="text-xs text-gray-600 mt-2">
            Превью доступно на всех вкладках конкурса — справа всегда видна панель с актуальным предпросмотром.
          </p>
        </div>
      </details>

      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Почему кнопки Like/Comment размыты?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            Размытие второстепенных элементов (blurredExtras) — это дизайнерское решение для акцента на главном. Вам важно проверить <strong>текст</strong> и <strong>переменные</strong>, а не количество лайков (которое в превью фиктивное). Размытие помогает не отвлекаться на детали и сконцентрироваться на контенте конкурса.
          </p>
        </div>
      </details>

      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Данные в превью настоящие?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 mb-2">
            <strong>Частично.</strong> Превью использует:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>Настоящие:</strong> тексты постов, шаблоны, фотографии, название и аватар сообщества, даты</li>
            <li><strong>Примеры:</strong> имена победителей («Иван Петров»), промокоды («WIN-2025»), лайки/комментарии (36/12)</li>
          </ul>
          <p className="text-gray-700 mt-2">
            При реальной публикации система подставит <strong>настоящие</strong> данные победителей из базы, а не примеры из превью.
          </p>
        </div>
      </details>

      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Можно ли редактировать текст прямо в превью?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            <strong>Нет.</strong> Превью — это режим только для просмотра (read-only). Чтобы изменить текст, вернитесь на вкладку <strong>"Настройки"</strong>, отредактируйте поля «Текст поста», «Итоговый пост» или «Личное сообщение», и превью автоматически обновится.
          </p>
        </div>
      </details>

      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer list-none p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
          <span className="font-medium text-gray-900">
            Что такое "Комментарий-заглушка"?
          </span>
          <span className="text-blue-600 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700 mb-2">
            Это запасной сценарий на случай, если победителю нельзя отправить личное сообщение (закрыты ЛС или заблокировано сообщество). Система найдёт любой пост победителя в вашем сообществе и напишет под ним комментарий:
          </p>
          <div className="bg-gray-100 p-3 rounded my-2 text-sm italic text-gray-700">
            "Напишите нам в личные сообщения, Мария, чтобы забрать приз!"
          </div>
          <p className="text-gray-700">
            Переменная <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{user_name}'}</code> заменится на имя победителя. В превью показывается, как это будет выглядеть.
          </p>
        </div>
      </details>
    </div>
  </section>
);

/** Секция «Ключевые преимущества» — 3 карточки */
export const KeyAdvantagesSection: React.FC = () => (
  <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-6">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
      Ключевые преимущества
    </h2>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <div className="text-3xl mb-2">👁️</div>
        <h3 className="font-semibold text-gray-900 mb-2">Точная имитация VK</h3>
        <p className="text-sm text-gray-600">
          Видите посты именно так, как их увидят участники. Цвета, шрифты, кнопки — всё как в настоящем ВКонтакте.
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <div className="text-3xl mb-2">🔤</div>
        <h3 className="font-semibold text-gray-900 mb-2">Проверка переменных</h3>
        <p className="text-sm text-gray-600">
          Убедитесь, что переменные стоят в правильных местах и подставятся корректно.
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <div className="text-3xl mb-2">⚡</div>
        <h3 className="font-semibold text-gray-900 mb-2">Нет правок после публикации</h3>
        <p className="text-sm text-gray-600">
          Запускайте конкурс с уверенностью — все опечатки и ошибки форматирования найдены заранее.
        </p>
      </div>
    </div>
  </section>
);
