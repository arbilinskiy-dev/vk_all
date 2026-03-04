import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 6: Пост с результатами + циклический перезапуск —
 * автоматическая публикация результатов и настройка повторного запуска.
 */
const GeneralContestsSettingsPage_ResultsPost: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 6: ПОСТ С РЕЗУЛЬТАТАМИ */}
      <h3>6. Пост с результатами</h3>
      <p>
        После завершения конкурса система может автоматически опубликовать пост с объявлением победителей.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Автоматическая публикация результатов">
          <ResultsPostDemo />
        </Sandbox>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-4">
        <p className="text-amber-800 m-0">
          <strong>Внимание:</strong> Если включите автоматическую публикацию, пост с результатами появится сразу после определения победителей. 
          Убедитесь что текст и изображения настроены правильно.
        </p>
      </div>

      <h2>Циклический перезапуск</h2>
      <p>
        Для регулярных конкурсов (например, еженедельных) есть функция автоматического перезапуска.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Настройка циклического перезапуска">
          <CyclicRestartDemo />
        </Sandbox>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg my-4">
        <p className="!text-indigo-900 !m-0">
          <strong>Как это работает:</strong> После завершения конкурса система автоматически запустит новый через указанный интервал с теми же настройками.
          Это удобно для серийных конкурсов — настроил один раз, и система работает сама.
        </p>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_ResultsPost;

// ────────────────────────────────────────
// Демо-компоненты раздела «Пост с результатами»
// ────────────────────────────────────────

/** Демо: переключатель автопубликации и редактор поста с результатами */
const ResultsPostDemo: React.FC = () => {
  const [autoPublish, setAutoPublish] = useState(true);
  const [postText, setPostText] = useState('');

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Автоматически публиковать пост с результатами</span>
        <button
          onClick={() => setAutoPublish(!autoPublish)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            autoPublish ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              autoPublish ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {autoPublish && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст поста с результатами
            </label>
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="🏆 Подводим итоги конкурса!&#10;&#10;Победители:&#10;{WINNERS_LIST}&#10;&#10;Поздравляем!"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-lg">🖼️</span>
              <span className="text-sm font-medium text-gray-700">Добавить фото</span>
            </button>
          </div>
        </>
      )}

      <div className={`p-3 rounded-lg ${autoPublish ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
        {autoPublish 
          ? '✅ Пост с результатами будет опубликован автоматически после определения победителей' 
          : '⏸️ Вам придётся опубликовать пост с результатами вручную'}
      </div>
    </div>
  );
};

/** Демо: циклический перезапуск конкурса */
const CyclicRestartDemo: React.FC = () => {
  const [cyclicRestart, setCyclicRestart] = useState(false);
  const [intervalDays, setIntervalDays] = useState(7);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="cyclic-restart"
          checked={cyclicRestart}
          onChange={(e) => setCyclicRestart(e.target.checked)}
          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <div className="flex-1">
          <label htmlFor="cyclic-restart" className="block text-sm font-medium text-gray-700 cursor-pointer">
            Автоматически перезапускать конкурс
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Система автоматически запустит новый конкурс через указанный интервал после завершения предыдущего
          </p>
        </div>
      </div>

      {cyclicRestart && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Интервал перезапуска (дней)
          </label>
          <input
            type="number"
            min="1"
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Новый конкурс запустится через {intervalDays} {intervalDays === 1 ? 'день' : intervalDays < 5 ? 'дня' : 'дней'} после завершения предыдущего
          </p>
        </div>
      )}

      <div className={`p-3 rounded-lg ${cyclicRestart ? 'bg-indigo-50 text-indigo-800' : 'bg-gray-50 text-gray-600'}`}>
        {cyclicRestart 
          ? `♻️ Конкурс будет автоматически перезапускаться каждые ${intervalDays} ${intervalDays === 1 ? 'день' : intervalDays < 5 ? 'дня' : 'дней'}`
          : '⏹️ Конкурс завершится без автоматического перезапуска'}
      </div>
    </div>
  );
};
