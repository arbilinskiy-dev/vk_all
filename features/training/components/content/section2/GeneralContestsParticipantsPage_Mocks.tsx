import React, { useState } from 'react';

// =====================================================================
// Общая функция рендеринга статуса — используется в нескольких демо
// =====================================================================

export const statusBadge = (status: string): React.ReactElement => {
  switch (status) {
    case 'processed':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Обработан</span>;
    case 'processing':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">В очереди</span>;
    case 'winner':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Победитель</span>;
    case 'error':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Ошибка</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Новый</span>;
  }
};

// =====================================================================
// Моковые данные участников
// =====================================================================

const mockParticipants = [
  {
    id: '1',
    user_name: 'Анна Смирнова',
    user_vk_id: 123456,
    post_link: 'https://vk.com/wall-123456_789',
    vk_post_id: 789,
    post_text: 'Участвую в конкурсе! Очень хочу выиграть 🎁',
    entry_number: 1,
    status: 'processed',
    created_at: '2026-02-19T10:30:00',
  },
  {
    id: '2',
    user_name: 'Иван Петров',
    user_vk_id: 234567,
    post_link: 'https://vk.com/wall-123456_790',
    vk_post_id: 790,
    post_text: '',
    entry_number: 2,
    status: 'processed',
    created_at: '2026-02-19T11:15:00',
  },
  {
    id: '3',
    user_name: 'Мария Кузнецова',
    user_vk_id: 345678,
    post_link: 'https://vk.com/wall-123456_791',
    vk_post_id: 791,
    post_text: 'Отличный конкурс, давно хотела такой приз!',
    entry_number: 3,
    status: 'processing',
    created_at: '2026-02-19T12:45:00',
  },
  {
    id: '4',
    user_name: null,
    user_vk_id: 456789,
    post_link: null,
    vk_post_id: 0,
    post_text: '',
    entry_number: 0,
    status: 'error',
    created_at: '2026-02-19T13:20:00',
  },
];

// =====================================================================
// Демо: таблица участников
// =====================================================================

export const ParticipantsTableDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="overflow-auto max-h-96">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Участник</th>
              <th className="px-4 py-3">Пост</th>
              <th className="px-4 py-3 w-24 text-center">Номер</th>
              <th className="px-4 py-3 w-32">Статус</th>
              <th className="px-4 py-3 w-40">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockParticipants.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-indigo-600">
                    {p.user_name || `ID: ${p.user_vk_id}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                  {p.post_link ? (
                    <div>
                      <span className="text-indigo-600">Пост #{p.vk_post_id}</span>
                      {p.post_text && (
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">{p.post_text}</div>
                      )}
                    </div>
                  ) : <span className="text-gray-400">-</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {p.entry_number > 0 ? (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{p.entry_number}</span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(p.created_at).toLocaleString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =====================================================================
// Демо: все возможные статусы
// =====================================================================

export const StatusBadgesDemo: React.FC = () => {
  const statuses = [
    { status: 'processed', label: 'Обработан', desc: 'Прошёл проверку, участвует в розыгрыше' },
    { status: 'processing', label: 'В очереди', desc: 'Система проверяет условия (мигает)' },
    { status: 'winner', label: 'Победитель', desc: 'Выбран при подведении итогов' },
    { status: 'error', label: 'Ошибка', desc: 'Не прошёл проверку условий' },
    { status: 'new', label: 'Новый', desc: 'Только обнаружен системой' },
  ];

  return (
    <div className="space-y-3">
      {statuses.map((s) => (
        <div key={s.status} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          {statusBadge(s.status)}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{s.label}</p>
            <p className="text-xs text-gray-600">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// =====================================================================
// Демо: панель управления (счётчик + кнопки)
// =====================================================================

export const HeaderActionsDemo: React.FC = () => {
  const [participantsCount, setParticipantsCount] = useState(47);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setParticipantsCount(prev => prev + Math.floor(Math.random() * 5));
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="text-sm text-gray-500">
          Всего участников: <strong className="text-gray-800">{participantsCount}</strong>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 text-sm bg-white border border-red-200 rounded hover:bg-red-50 text-red-600 transition-colors"
            onClick={() => alert('Требуется подтверждение действия')}
          >
            Очистить
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? '...' : 'Обновить'}
          </button>
        </div>
      </div>
      <div className="p-4 text-center text-gray-400 text-sm">
        Нажмите "Обновить" чтобы увидеть изменение счётчика
      </div>
    </div>
  );
};

// =====================================================================
// Демо: индикатор загрузки
// =====================================================================

export const LoadingStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
      <div className="flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-center text-gray-500 text-sm mt-4">Загрузка списка участников...</p>
    </div>
  );
};

// =====================================================================
// Демо: пустой список
// =====================================================================

export const EmptyStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-12">
      <div className="text-center text-gray-400 text-sm">
        <p className="text-base mb-2">Нет участников.</p>
        <p>Сбор начнется после публикации стартового поста.</p>
      </div>
    </div>
  );
};

// =====================================================================
// Демо: порядковые номера
// =====================================================================

export const EntryNumbersDemo: React.FC = () => {
  const numbers = [1, 2, 3, 15, 42, 158];

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
      {numbers.map(num => (
        <div key={num} className="flex flex-col items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">
            {num}
          </span>
          <span className="text-xs text-gray-500">Участник #{num}</span>
        </div>
      ))}
    </div>
  );
};
