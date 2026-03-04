import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 5: Шаблоны сообщений —
 * редактор сообщений победителю и проигравшему с переменными подстановки.
 */
const GeneralContestsSettingsPage_Messages: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 5: ШАБЛОНЫ СООБЩЕНИЙ */}
      <h3>5. Шаблоны сообщений</h3>
      <p>
        Система автоматически отправит сообщения победителям и участникам, которые не выиграли. Здесь вы настраиваете текст этих сообщений.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Редактор сообщения победителю">
          <WinnerMessageDemo />
        </Sandbox>
      </div>

      <p><strong>Доступные переменные для подстановки:</strong></p>
      <ul>
        <li><code>{'{USER_NAME}'}</code> — имя пользователя</li>
        <li><code>{'{USER_FIRST_NAME}'}</code> — имя</li>
        <li><code>{'{USER_LAST_NAME}'}</code> — фамилия</li>
        <li><code>{'{CONTEST_NAME}'}</code> — название конкурса</li>
        <li><code>{'{PROJECT_NAME}'}</code> — название проекта</li>
      </ul>

      <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
        <p className="text-green-800 m-0">
          <strong>Совет:</strong> Используйте переменные для персонализации — обращение по имени повышает доверие и отклик участников.
        </p>
      </div>

      <div className="not-prose my-6">
        <Sandbox title="Редактор сообщения проигравшему">
          <LoserMessageDemo />
        </Sandbox>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_Messages;

// ────────────────────────────────────────
// Демо-компоненты раздела «Шаблоны сообщений»
// ────────────────────────────────────────

/** Демо: редактор сообщения победителю с переменными */
const WinnerMessageDemo: React.FC = () => {
  const [message, setMessage] = useState('Поздравляем, {USER_FIRST_NAME}! 🎉\n\nВы выиграли в конкурсе "{CONTEST_NAME}"!\nСвяжитесь с нами для получения приза.');

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Сообщение победителю
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['{USER_NAME}', '{USER_FIRST_NAME}', '{CONTEST_NAME}', '{PROJECT_NAME}'].map((variable) => (
          <button
            key={variable}
            onClick={() => {
              const textarea = document.querySelector('textarea');
              if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = message.substring(0, start) + variable + message.substring(end);
                setMessage(newText);
              }
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded hover:bg-gray-200 transition-colors"
          >
            {variable}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Превью (с подставленными значениями):</p>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">
          {message
            .replace('{USER_NAME}', 'Иван Петров')
            .replace('{USER_FIRST_NAME}', 'Иван')
            .replace('{USER_LAST_NAME}', 'Петров')
            .replace('{CONTEST_NAME}', 'Еженедельный розыгрыш мерча')
            .replace('{PROJECT_NAME}', 'Сообщество геймеров')}
        </p>
      </div>
    </div>
  );
};

/** Демо: редактор сообщения проигравшему */
const LoserMessageDemo: React.FC = () => {
  const [message, setMessage] = useState('Привет, {USER_FIRST_NAME}!\n\nК сожалению, в этот раз вы не вошли в число победителей конкурса "{CONTEST_NAME}".\n\nНо не расстраивайтесь — следите за нашими обновлениями, скоро будет новый розыгрыш! 🎁');

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Сообщение проигравшему
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm"
        />
      </div>

      <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">
        ⚠️ Сообщения проигравшим отправляются массово. Будьте вежливы и позитивны — это мотивирует участвовать в будущих конкурсах.
      </div>
    </div>
  );
};
