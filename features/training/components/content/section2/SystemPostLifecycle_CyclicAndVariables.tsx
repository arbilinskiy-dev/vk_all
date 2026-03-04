import React from 'react';
import { Sandbox } from '../shared';
import { CyclicRegenerationDemo } from './SystemPostLifecycleMocks';

/**
 * Секция «Циклическая регенерация» + «Глобальные переменные»
 * Алгоритм создания следующего поста, лимиты, процесс подстановки переменных
 */
export const CyclicAndVariablesSection: React.FC = () => (
  <>
    {/* Циклическая регенерация */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Циклическая регенерация: создание следующего поста</h2>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Одна из ключевых возможностей системных постов — автоматическое создание следующих повторов при циклической публикации. Процесс регенерации запускается сразу после успешной верификации поста на стене VK, обеспечивая непрерывность цепочки публикаций.
    </p>

    <div className="not-prose my-8">
      <Sandbox
        title="Процесс циклической регенерации"
        description="Пошаговая визуализация создания следующего поста"
        instructions={['Переключайте шаги, чтобы увидеть полный цикл']}
      >
        <CyclicRegenerationDemo />
      </Sandbox>
    </div>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Алгоритм регенерации</h3>

    <ol className="!text-base !leading-relaxed !text-gray-700">
      <li>
        <strong>Триггер: успешная верификация</strong> — когда пост-трекер находит <code>vk_post_id</code> текущего поста в списке постов стены VK, он вызывает функцию <code>_create_next_cyclic_post()</code>.
      </li>
      <li>
        <strong>Проверка лимитов</strong> — перед созданием проверяются два типа лимитов:
        <ul>
          <li><strong>По количеству:</strong> если <code>recurrence_end_type = 'count'</code> и <code>recurrence_end_count ≤ 1</code> — следующий пост создаётся как НЕАКТИВНЫЙ (<code>is_active = False</code>)</li>
          <li><strong>По дате:</strong> если <code>recurrence_end_type = 'date'</code> и следующая дата {'>'} <code>recurrence_end_date</code> — следующий пост создаётся как НЕАКТИВНЫЙ</li>
        </ul>
      </li>
      <li>
        <strong>Расчёт следующей даты</strong> — функция <code>_calculate_next_occurrence()</code> вычисляет новую дату публикации на основе <code>recurrence_type</code> и <code>recurrence_interval</code>. Для месячного интервала учитываются <code>recurrence_fixed_day</code> и <code>recurrence_is_last_day</code>.
      </li>
      <li>
        <strong>Копирование настроек</strong> — создаётся новый пост с уникальным ID <code>cyclic-&#123;uuid&#125;</code>. Копируются: текст, изображения, вложения, все параметры цикличности, <code>ai_generation_params</code>, <code>title</code>, <code>description</code>. Статус: <code>pending_publication</code>.
      </li>
      <li>
        <strong>Сохранение в БД</strong> — новый пост добавляется в таблицу <code>system_posts</code> через <code>db.add()</code> и <code>db.commit()</code>.
      </li>
      <li>
        <strong>Удаление оригинала</strong> — только после успешного создания следующего поста удаляется текущий через <code>crud.delete_system_post()</code>. Это гарантирует, что цепочка никогда не прервётся.
      </li>
    </ol>

    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg p-4 my-6">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0" aria-hidden="true">⚡</span>
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-1">Неактивные посты при достижении лимита</h4>
          <p className="text-sm text-gray-700">
            Когда лимит повторов достигнут, система не прекращает создание постов полностью — вместо этого следующий пост создаётся с флагом <code>is_active = False</code>. Это сохраняет настройки автоматизации в базе, но пост не попадёт в очередь публикации. Вы сможете вручную активировать его позже через редактирование, если нужно продолжить цикл.
          </p>
        </div>
      </div>
    </div>

    <hr className="!my-10" />

    {/* Глобальные переменные */}
    <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Глобальные переменные: момент подстановки</h2>

    <p className="!text-base !leading-relaxed !text-gray-700">
      Глобальные переменные — это плейсхолдеры в тексте поста вида <code>{`{global_shopname}`}</code>, которые автоматически заменяются реальными значениями из настроек проекта. Важно понимать, что подстановка происходит не при создании или редактировании поста, а непосредственно перед публикацией.
    </p>

    <h3 className="!text-xl !font-semibold !text-gray-800 !mt-8">Процесс подстановки</h3>

    <ol className="!text-base !leading-relaxed !text-gray-700">
      <li>
        <strong>Момент вызова</strong> — функция <code>global_variable_service.substitute_global_variables()</code> вызывается внутри <code>_publication_check()</code> пост-трекера, после того как пост уже заблокирован статусом «Публикуется», но до вызова <code>wall.post</code> VK API.
      </li>
      <li>
        <strong>Поиск плейсхолдеров</strong> — текст поста сканируется регулярным выражением на наличие конструкций <code>{`{global_*}`}</code>. Каждый найденный плейсхолдер извлекается.
      </li>
      <li>
        <strong>Загрузка значений</strong> — для проекта, к которому относится пост, загружаются все глобальные переменные из таблицы <code>global_variables</code> в БД.
      </li>
      <li>
        <strong>Замена</strong> — каждый плейсхолдер заменяется соответствующим значением переменной. Если переменная не найдена — плейсхолдер остаётся без изменений (или заменяется на пустую строку, в зависимости от настроек).
      </li>
      <li>
        <strong>Отправка в VK</strong> — уже обработанный текст с подставленными значениями передаётся в <code>wall.post</code>.
      </li>
    </ol>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
      <p className="text-sm text-gray-700 mb-2">
        <strong>Пример использования:</strong>
      </p>
      <div className="space-y-2 text-sm">
        <div className="bg-white p-2 rounded border border-blue-200">
          <p className="font-semibold text-gray-900 mb-1">Текст в базе данных (шаблон):</p>
          <p className="text-gray-700 font-mono text-xs">
            🛍️ Новое поступление в магазине <code>{`{global_shopname}`}</code>!<br />
            📍 Адрес: <code>{`{global_address}`}</code><br />
            📞 Телефон: <code>{`{global_phone}`}</code>
          </p>
        </div>
        <div className="bg-white p-2 rounded border border-green-200">
          <p className="font-semibold text-gray-900 mb-1">Текст после подстановки (публикуется):</p>
          <p className="text-gray-700 text-xs">
            🛍️ Новое поступление в магазине <strong>Модный бутик "Стиль"</strong>!<br />
            📍 Адрес: <strong>ул. Ленина, д. 15</strong><br />
            📞 Телефон: <strong>+7 (999) 123-45-67</strong>
          </p>
        </div>
      </div>
    </div>

    <p className="!text-base !leading-relaxed !text-gray-700">
      <strong>Важное следствие:</strong> Если вы измените значение глобальной переменной в настройках проекта, все ещё не опубликованные посты автоматически получат новое значение при публикации. Уже опубликованные посты, естественно, останутся без изменений.
    </p>
  </>
);
