import React from 'react';
import { NavigationButtons } from '../shared';

// =====================================================================
// Секция «Сравнение подходов, FAQ и итог»
// =====================================================================

export const ComparisonAndFAQ: React.FC = () => (
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
            <td className="border border-gray-300 px-4 py-2">Сбор участников</td>
            <td className="border border-gray-300 px-4 py-2 bg-red-50">Просматривать комментарии/лайки вручную</td>
            <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматический сбор в фоне</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Проверка условий</td>
            <td className="border border-gray-300 px-4 py-2 bg-red-50">Заходить в каждый профиль вручную</td>
            <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматическая проверка всех условий</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Нумерация участников</td>
            <td className="border border-gray-300 px-4 py-2 bg-red-50">Вручную присваивать номера в Excel</td>
            <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматическая нумерация по порядку</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Отслеживание дубликатов</td>
            <td className="border border-gray-300 px-4 py-2 bg-red-50">Проверять вручную по ID</td>
            <td className="border border-gray-300 px-4 py-2 bg-green-50">Автоматическая фильтрация дубликатов</td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2">Обновление списка</td>
            <td className="border border-gray-300 px-4 py-2 bg-red-50">Каждый час заново собирать</td>
            <td className="border border-gray-300 px-4 py-2 bg-green-50">Одна кнопка "Обновить"</td>
          </tr>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-gray-300 px-4 py-2">Время на обслуживание</td>
            <td className="border border-gray-300 px-4 py-2 text-red-700">30-60 мин/день</td>
            <td className="border border-gray-300 px-4 py-2 text-green-700">0 минут</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>❓ Частые вопросы</h2>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Почему в списке нет нового участника, хотя он выполнил условия?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Система собирает участников периодически (обычно раз в несколько минут). Нажмите кнопку "Обновить" чтобы загрузить свежие данные с сервера. Если участник всё равно не появился — проверьте выполнены ли все условия конкурса.
        </p>
      </div>
    </details>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Можно ли вручную добавить или удалить участника из списка?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Нет, ручное редактирование списка невозможно — это гарантирует честность конкурса. Система автоматически добавляет только тех, кто выполнил условия. Единственное исключение — кнопка "Очистить" для админов, которая удаляет всех участников сразу.
        </p>
      </div>
    </details>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Что означает статус "Ошибка" и что с этим делать?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Статус "Ошибка" появляется когда система не смогла проверить выполнение условий. Причины: участник удалил пост/комментарий, закрыл профиль, или временные технические проблемы ВКонтакте. Такие участники автоматически исключаются из розыгрыша.
        </p>
      </div>
    </details>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Как экспортировать список участников в Excel?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Функция экспорта в Excel пока не реализована в интерфейсе. Если нужен список участников в файле — обратитесь к техническому специалисту или администратору, они могут выгрузить данные напрямую из базы.
        </p>
      </div>
    </details>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Сколько участников может обработать система?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Система справляется с любым количеством участников — от десятков до десятков тысяч. Таблица имеет прокрутку, так что даже при большом списке интерфейс остаётся удобным. Обработка происходит партиями в фоновом режиме.
        </p>
      </div>
    </details>

    <details className="mb-4">
      <summary className="font-semibold cursor-pointer text-indigo-600 hover:text-indigo-800">
        Можно ли искать участника по имени или номеру?
      </summary>
      <div className="mt-2 pl-4 border-l-2 border-gray-300">
        <p>
          Функция поиска и фильтрации пока не реализована. Для поиска конкретного участника используйте встроенный поиск браузера (Ctrl+F / Cmd+F) прямо на странице.
        </p>
      </div>
    </details>

    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 my-8 rounded-r-lg">
      <h3 className="!mt-0 !text-green-800">🎯 Итог: Ваша выгода</h3>
      <p className="!text-gray-800">
        Вкладка "Участники" — это полная автоматизация самой трудоёмкой части проведения конкурса.
        Вместо ежедневной ручной работы по сбору и проверке участников система делает всё сама: собирает, проверяет, нумерует и обновляет список в реальном времени.
      </p>
      <p className="!text-gray-800 !mb-0">
        <strong>Результат:</strong> Вы экономите 30-60 минут каждый день конкурса и получаете стопроцентную точность — ни один участник не потеряется, все условия проверены автоматически.
      </p>
    </div>

    {/* NavigationButtons: в оригинале получал undefined-пропы, рендерил null */}
    <NavigationButtons currentPath="" />
  </>
);
