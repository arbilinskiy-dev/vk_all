import React, { useState } from 'react';
import { Sandbox } from '../shared';

/**
 * Раздел 1: Основные параметры конкурса —
 * переключатель активности, название, дата/время, длительность.
 */
const GeneralContestsSettingsPage_BasicParams: React.FC = () => {
  return (
    <>
      {/* РАЗДЕЛ 1: ОСНОВНЫЕ ПАРАМЕТРЫ */}
      <h3>1. Основные параметры</h3>
      <p>
        Здесь вы включаете или выключаете конкурс, устанавливаете название и определяете время его работы.
      </p>

      <div className="not-prose my-6">
        <Sandbox title="Переключатель активности и название конкурса">
          <BasicParamsDemo />
        </Sandbox>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 m-0">
            <strong>Совет:</strong> Сначала настройте все параметры конкурса с выключенным переключателем, а затем включите его когда всё будет готово.
          </p>
        </div>
      </div>

      <ul>
        <li><strong>Переключатель "Конкурс активен"</strong> — включает или выключает работу конкурса</li>
        <li><strong>Название</strong> — внутреннее название для вашего удобства (не показывается участникам)</li>
        <li><strong>Дата и время начала</strong> — когда конкурс начнёт принимать участников</li>
        <li><strong>Длительность</strong> — сколько дней и часов будет длиться конкурс</li>
      </ul>

      <div className="not-prose my-6">
        <Sandbox title="Выбор даты, времени и длительности">
          <DateTimeDemo />
        </Sandbox>
      </div>
    </>
  );
};

export default GeneralContestsSettingsPage_BasicParams;

// ────────────────────────────────────────
// Демо-компоненты раздела «Основные параметры»
// ────────────────────────────────────────

/** Демо: переключатель активности и название конкурса */
const BasicParamsDemo: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [contestName, setContestName] = useState('');

  return (
    <div className="space-y-4 p-4">
      {/* Переключатель активности */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Конкурс активен</span>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? 'bg-indigo-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Поле названия */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название конкурса
        </label>
        <input
          type="text"
          value={contestName}
          onChange={(e) => setContestName(e.target.value)}
          placeholder="Например: Еженедельный розыгрыш мерча"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Индикатор состояния */}
      <div className={`p-3 rounded-lg ${isActive ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
        {isActive ? '✅ Конкурс запущен и принимает участников' : '⏸️ Конкурс остановлен'}
      </div>
    </div>
  );
};

/** Демо: выбор даты, времени и длительности конкурса */
const DateTimeDemo: React.FC = () => {
  const [startDate, setStartDate] = useState('2026-02-20');
  const [startTime, setStartTime] = useState('12:00');
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(0);

  return (
    <div className="space-y-4 p-4">
      {/* Дата и время начала */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата начала
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Время начала
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Длительность */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дней
          </label>
          <input
            type="number"
            min="0"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Часов
          </label>
          <input
            type="number"
            min="0"
            max="23"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Итоговая информация */}
      <div className="bg-indigo-50 p-3 rounded-lg text-sm text-indigo-800">
        Конкурс начнётся {startDate} в {startTime} и продлится {days} {days === 1 ? 'день' : 'дней'} {hours > 0 ? `и ${hours} ${hours === 1 ? 'час' : 'часов'}` : ''}
      </div>
    </div>
  );
};
