import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 3: Условия участия —
 * конструктор условий с логикой «И» / «ИЛИ».
 */
const GeneralContestsSettingsPage_Conditions: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 3: УСЛОВИЯ УЧАСТИЯ */}
      <h3>3. Условия участия</h3>
      <p>
        Самый важный блок — здесь вы определяете, что должен сделать человек, чтобы участвовать в конкурсе. 
        Можно комбинировать несколько условий с логикой "И" и "ИЛИ".
      </p>

      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg my-4">
        <p className="!text-indigo-900 !m-0">
          <strong>Доступные условия:</strong> Лайк ❤️, Репост 📢, Комментарий 💬, Подписка 👥, Состоит в группе 🤝, Подписан на рассылку 📩
        </p>
      </div>

      <div className="not-prose my-6">
        <Sandbox title="Конструктор условий участия">
          <ConditionsDemo />
        </Sandbox>
      </div>

      <p><strong>Как работает логика условий:</strong></p>
      <ul>
        <li><strong>Внутри одной карточки (группы)</strong> — логика "И" (должны выполниться ВСЕ условия)</li>
        <li><strong>Между карточками</strong> — логика "ИЛИ" (достаточно выполнить условия ЛЮБОЙ карточки)</li>
      </ul>

      <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
        <p className="text-green-800 m-0">
          <strong>Пример:</strong> Создайте две карточки: первая с условиями "Лайк И Репост", вторая — "Комментарий И Подписка". 
          Тогда пользователь может участвовать двумя способами: либо поставить лайк и сделать репост, либо написать комментарий и подписаться.
        </p>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_Conditions;

// ────────────────────────────────────────
// Демо-компонент раздела «Условия участия»
// ────────────────────────────────────────

/** Демо: конструктор групп условий с логикой И/ИЛИ */
const ConditionsDemo: React.FC = () => {
  const [groups, setGroups] = useState<Array<{ id: number; conditions: Array<{ type: string; label: string; emoji: string }> }>>([
    { id: 1, conditions: [{ type: 'like', label: 'Лайк', emoji: '❤️' }] }
  ]);

  const conditionTypes = [
    { type: 'like', label: 'Лайк', emoji: '❤️' },
    { type: 'repost', label: 'Репост', emoji: '📢' },
    { type: 'comment', label: 'Комментарий', emoji: '💬' },
    { type: 'subscription', label: 'Подписка', emoji: '👥' },
    { type: 'member_of_group', label: 'Состоит в группе', emoji: '🤝' },
    { type: 'mailing', label: 'Подписан на рассылку', emoji: '📩' },
  ];

  const addGroup = () => {
    setGroups([...groups, { id: Date.now(), conditions: [{ type: 'like', label: 'Лайк', emoji: '❤️' }] }]);
  };

  const removeGroup = (groupId: number) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const addCondition = (groupId: number, condType: typeof conditionTypes[0]) => {
    setGroups(groups.map(g => 
      g.id === groupId 
        ? { ...g, conditions: [...g.conditions, condType] }
        : g
    ));
  };

  const removeCondition = (groupId: number, condIndex: number) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, conditions: g.conditions.filter((_, i) => i !== condIndex) }
        : g
    ));
  };

  return (
    <div className="space-y-4 p-4">
      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          {/* Разделитель ИЛИ между группами */}
          {groupIndex > 0 && (
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">ИЛИ</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          )}

          {/* Карточка группы условий */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Группа условий #{groupIndex + 1}</span>
              {groups.length > 1 && (
                <button
                  onClick={() => removeGroup(group.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Список условий в группе */}
            <div className="space-y-2">
              {group.conditions.map((cond, condIndex) => (
                <div key={condIndex}>
                  {condIndex > 0 && (
                    <div className="text-center text-xs font-medium text-gray-500 my-1">И</div>
                  )}
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                    <span className="text-2xl">{cond.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{cond.label}</span>
                    <button
                      onClick={() => removeCondition(group.id, condIndex)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка добавления условия в группу */}
            <div className="relative mt-3">
              <details className="group">
                <summary className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer list-none">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Добавить условие</span>
                </summary>
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {conditionTypes.map((ct) => (
                    <button
                      key={ct.type}
                      onClick={() => {
                        addCondition(group.id, ct);
                        // Закрываем details
                        const details = document.querySelector('details[open]');
                        if (details) details.removeAttribute('open');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-xl">{ct.emoji}</span>
                      <span className="text-sm text-gray-700">{ct.label}</span>
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </div>
      ))}

      {/* Кнопка добавления новой группы */}
      <button
        onClick={addGroup}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">Добавить альтернативную группу (ИЛИ)</span>
      </button>
    </div>
  );
};
