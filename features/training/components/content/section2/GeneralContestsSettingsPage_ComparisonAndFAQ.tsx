import React from 'react';

/**
 * Секция «Сравнение, альтернативы и FAQ» —
 * таблица сравнения подходов, альтернативные инструменты,
 * частые вопросы и итоговый блок с выводами.
 */
const GeneralContestsSettingsPage_ComparisonAndFAQ: React.FC = () => {
  return (
    <>
      <h2>📊 Сравнение подходов</h2>
      
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">Задача</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Без системы (вручную)</th>
              <th className="border border-gray-300 px-4 py-2 text-left">С системой (автоматически)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Отслеживание участников</td>
              <td className="border border-gray-300 px-4 py-2 bg-red-50">Вручную записывать в Excel, следить за лайками/репостами</td>
              <td className="border border-gray-300 px-4 py-2 bg-green-50">Система сама собирает всех участников</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Проверка условий</td>
              <td className="border border-gray-300 px-4 py-2 bg-red-50">Заходить в профиль каждого, проверять подписки</td>
              <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматическая проверка всех условий</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Выбор победителей</td>
              <td className="border border-gray-300 px-4 py-2 bg-red-50">Использовать random.org или тянуть жребий</td>
              <td className="border border-gray-300 px-4 py-2 bg-green-50">Случайный выбор из валидных участников</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Уведомление победителей</td>
              <td className="border border-gray-300 px-4 py-2 bg-red-50">Писать каждому лично, копировать текст</td>
              <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматическая рассылка по шаблону</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">Публикация результатов</td>
              <td className="border border-gray-300 px-4 py-2 bg-red-50">Вручную создавать пост, искать ссылки на победителей</td>
              <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматический пост с упоминаниями</td>
            </tr>
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-4 py-2">Время на конкурс</td>
              <td className="border border-gray-300 px-4 py-2 text-red-700">3-5 часов</td>
              <td className="border border-gray-300 px-4 py-2 text-green-700">10-15 минут</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Альтернативы</h2>
      <p>Если универсальные конкурсы не подходят под вашу задачу:</p>
      <ul>
        <li><strong>Конкурс отзывов</strong> — если хотите собирать отзывы от клиентов и выбирать победителей среди них</li>
        <li><strong>Дроп промокодов</strong> — если нужно раздать промокоды первым N участникам без жеребьёвки</li>
        <li><strong>Ручной конкурс в разделе "Посты"</strong> — если условия слишком сложные и требуют вашей оценки каждого участника</li>
      </ul>

      <h2>❓ Частые вопросы</h2>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Можно ли изменить условия конкурса после запуска?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            Нет, после активации конкурса условия изменить нельзя — это гарантирует честность для уже зарегистрированных участников. 
            Если нужно что-то поменять, выключите текущий конкурс и создайте новый.
          </p>
        </div>
      </details>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Что если участников больше чем мест для победителей?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            Система случайным образом выберет нужное количество победителей из всех валидных участников. 
            Каждый участник имеет равные шансы на победу.
          </p>
        </div>
      </details>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Можно ли вручную добавить или исключить участника?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            На текущий момент нет, система работает только с автоматическим сбором участников по заданным условиям. 
            Это сделано специально для прозрачности и честности конкурса.
          </p>
        </div>
      </details>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Что делать если конкурс завис или работает неправильно?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            Выключите конкурс переключателем, проверьте все настройки (особенно условия и даты), затем включите снова. 
            Если проблема повторяется — обратитесь к технической поддержке с названием конкурса и описанием проблемы.
          </p>
        </div>
      </details>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Как работает циклический перезапуск?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            После завершения конкурса система ждёт указанный интервал (например, 7 дней) и автоматически запускает новый конкурс с теми же настройками. 
            Это удобно для еженедельных или ежемесячных конкурсов — настраиваете один раз, и система работает постоянно.
          </p>
        </div>
      </details>

      <details className="mb-4">
        <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
          Могу ли я видеть список участников до завершения конкурса?
        </summary>
        <div className="mt-2 pl-4 border-l-2 border-gray-300">
          <p>
            Да, на вкладке "Участники" вы можете в реальном времени видеть всех, кто уже выполнил условия участия. 
            Это помогает оценить популярность конкурса и при необходимости скорректировать стратегию продвижения.
          </p>
        </div>
      </details>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 my-8 rounded-r-lg">
        <h3 className="!mt-0 !text-green-800">🎯 Итог: Ваша выгода</h3>
        <p className="!text-gray-800">
          Страница настроек универсального конкурса — это полная автоматизация процесса проведения конкурсов. 
          Вместо 3-5 часов ручной работы вы тратите 10-15 минут на настройку, а система берёт на себя всю рутину: 
          отслеживание участников, проверку условий, выбор победителей, рассылку сообщений и публикацию результатов.
        </p>
        <p className="!text-gray-800 !mb-0">
          <strong>Результат:</strong> Вы можете запускать конкурсы регулярно, увеличивая вовлечённость аудитории, без дополнительной нагрузки на команду.
        </p>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_ComparisonAndFAQ;
