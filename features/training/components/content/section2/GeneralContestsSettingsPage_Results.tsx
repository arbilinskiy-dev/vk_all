import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 4: Результаты конкурса —
 * способ завершения (авто/ручной), количество победителей, дата/время.
 */
const GeneralContestsSettingsPage_Results: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 4: РЕЗУЛЬТАТЫ */}
      <h3>4. Результаты конкурса</h3>
      <p>
        Настройки определения победителей: система может выбрать их автоматически сразу после окончания конкурса или дождаться вашего ручного запуска.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Выбор способа завершения">
          <FinishTypeDemo />
        </Sandbox>
      </div>

      <ul>
        <li><strong>"Автоматически"</strong> — система сама выберет победителей в указанное время</li>
        <li><strong>"Вручную"</strong> — вы сами решите когда запустить определение победителей</li>
      </ul>

      <div className="not-prose my-6">
        <Sandbox title="Настройка количества победителей и времени">
          <ResultsSettingsDemo />
        </Sandbox>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 m-0">
            <strong>Совет:</strong> Для конкурсов с большим призовым фондом используйте ручное завершение — так вы сможете проверить победителей перед объявлением результатов.
          </p>
        </div>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_Results;

// ────────────────────────────────────────
// Демо-компоненты раздела «Результаты»
// ────────────────────────────────────────

/** Демо: переключатель авто / ручное завершение */
const FinishTypeDemo: React.FC = () => {
  const [finishType, setFinishType] = useState<'auto' | 'manual'>('auto');

  return (
    <div className="space-y-4 p-4">
      <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
        <button
          onClick={() => setFinishType('auto')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            finishType === 'auto'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Автоматически
        </button>
        <button
          onClick={() => setFinishType('manual')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            finishType === 'manual'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Вручную
        </button>
      </div>

      <div className="mt-4">
        {finishType === 'auto' ? (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-800 text-sm">
              ⚙️ Система автоматически выберет победителей в указанное время после окончания конкурса
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              👤 Вы сами решите когда запустить выбор победителей после окончания конкурса
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Демо: количество победителей и дата/время завершения */
const ResultsSettingsDemo: React.FC = () => {
  const [winnersCount, setWinnersCount] = useState(3);
  const [finishDate, setFinishDate] = useState('2026-02-27');
  const [finishTime, setFinishTime] = useState('18:00');

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Количество победителей
        </label>
        <input
          type="number"
          min="1"
          value={winnersCount}
          onChange={(e) => setWinnersCount(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата завершения
          </label>
          <input
            type="date"
            value={finishDate}
            onChange={(e) => setFinishDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Время завершения
          </label>
          <input
            type="time"
            value={finishTime}
            onChange={(e) => setFinishTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800">
        Будет выбрано {winnersCount} {winnersCount === 1 ? 'победитель' : winnersCount < 5 ? 'победителя' : 'победителей'} {finishDate} в {finishTime}
      </div>
    </div>
  );
};
