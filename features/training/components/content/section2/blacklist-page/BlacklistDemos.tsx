import React, { useState } from 'react';

// ============================================
// Демо-компоненты для интерактивных примеров
// Чёрный список участников конкурса
// ============================================

/** Демо: общий вид таблицы чёрного списка */
export const BlacklistTableDemo: React.FC = () => {
  const mockEntries = [
    { id: '1', user: 'Иван Спамеров', vkId: 123456789, until: 'Навсегда', added: '10.02.2026' },
    { id: '2', user: null, vkId: 987654321, until: '20.03.2026', added: '12.02.2026' },
    { id: '3', user: 'Мария Накруткина', vkId: 555666777, until: '15.03.2026', added: '15.02.2026' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Черный список (Конкурс)</h3>
          <p className="text-sm text-gray-500">Участники, исключённые для этого конкурса.</p>
        </div>
        <button className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100">
          Добавить в ЧС
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="px-6 py-3">Пользователь</th>
              <th className="px-6 py-3">Срок</th>
              <th className="px-6 py-3">Добавлен</th>
              <th className="px-6 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockEntries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {entry.user ? entry.user : <span className="text-gray-500">ID {entry.vkId}</span>}
                </td>
                <td className="px-6 py-4">{entry.until}</td>
                <td className="px-6 py-4 text-gray-500">{entry.added}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-red-600 hover:text-red-800 text-xs">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** Демо: кнопка «Добавить в ЧС» с предупреждением */
export const AddToBlacklistButtonDemo: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [isContestSaved, setIsContestSaved] = useState(false);

  const handleClick = () => {
    if (!isContestSaved) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Черный список (Конкурс)</h3>
          <p className="text-sm text-gray-500">Участники, исключённые для этого конкурса.</p>
        </div>
        <button
          onClick={handleClick}
          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
        >
          Добавить в ЧС
        </button>
      </div>

      {showWarning && (
        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200 animate-fade-in-up">
          ⚠ Сохраните конкурс перед добавлением в чёрный список.
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isContestSaved}
            onChange={(e) => setIsContestSaved(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Конкурс сохранён</span>
        </label>
      </div>

      <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
        💡 Попробуйте нажать кнопку без сохранения конкурса — появится предупреждение
      </p>
    </div>
  );
};

/** Демо: модальное окно добавления в ЧС */
export const AddBlacklistModalDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [urls, setUrls] = useState('');
  const [isForever, setIsForever] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100"
      >
        Открыть всплывающее окно
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
            <header className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Добавить в ЧС (Конкурс)</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </header>
            <main className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ссылки / ID (по одной в строке)
                </label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={5}
                  className="w-full border rounded-md p-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="https://vk.com/id12345&#10;https://vk.com/durov"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Срок блокировки</label>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={isForever}
                      onChange={() => setIsForever(true)}
                      className="h-4 w-4"
                    />
                    <span className="ml-2">Бессрочно</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      checked={!isForever}
                      onChange={() => setIsForever(false)}
                      className="h-4 w-4"
                    />
                    <span className="ml-2">До даты</span>
                  </label>
                </div>
                {!isForever && (
                  <div className="mt-2 ml-6">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full border rounded-md p-2 text-sm border-gray-300"
                    />
                  </div>
                )}
              </div>
            </main>
            <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Сохранить
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

/** Демо: таблица с подробными строками ЧС */
export const BlacklistTableRowsDemo: React.FC = () => {
  const [entries] = useState([
    { id: '1', name: 'Анна Иванова', vkId: 123456, until: '25.03.2026', added: '10.02.2026' },
    { id: '2', name: null, vkId: 987654, until: 'Навсегда', added: '12.02.2026' },
    { id: '3', name: 'Пётр Сидоров', vkId: 555777, until: '15.04.2026', added: '14.02.2026' }
  ]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
          <tr>
            <th className="px-6 py-3 text-left">Пользователь</th>
            <th className="px-6 py-3 text-left">Срок</th>
            <th className="px-6 py-3 text-left">Добавлен</th>
            <th className="px-6 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                {entry.name ? (
                  <span className="text-gray-900">{entry.name}</span>
                ) : (
                  <span className="text-gray-500">ID {entry.vkId}</span>
                )}
              </td>
              <td className="px-6 py-4">
                {entry.until === 'Навсегда' ? (
                  <span className="text-red-600 font-medium">{entry.until}</span>
                ) : (
                  <span className="text-gray-700">{entry.until}</span>
                )}
              </td>
              <td className="px-6 py-4 text-gray-500 text-xs">{entry.added}</td>
              <td className="px-6 py-4 text-right">
                <button className="text-red-600 hover:text-red-800 text-xs font-medium">
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        💡 <strong>Особенности:</strong> Если нет имени — показывается "ID {'{vk_id}'}". Срок "Навсегда" выделен красным.
      </div>
    </div>
  );
};

/** Демо: временная блокировка с выбором даты */
export const TemporaryBlockDemo: React.FC = () => {
  const [isForever, setIsForever] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-03-20');
  const [entries, setEntries] = useState([
    { id: '1', name: 'Дмитрий Тестов', until: 'Навсегда' }
  ]);

  const handleAdd = () => {
    const newEntry = {
      id: Date.now().toString(),
      name: 'Новый пользователь',
      until: isForever ? 'Навсегда' : new Date(selectedDate).toLocaleDateString('ru-RU')
    };
    setEntries([...entries, newEntry]);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Срок блокировки</label>
        <div className="space-y-3 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={isForever}
              onChange={() => setIsForever(true)}
              className="h-4 w-4"
            />
            <span className="ml-2">Бессрочно</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={!isForever}
              onChange={() => setIsForever(false)}
              className="h-4 w-4"
            />
            <span className="ml-2">До даты</span>
          </label>
        </div>
        {!isForever && (
          <div className="ml-6 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border rounded-md p-2 text-sm border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">
              Пользователь будет автоматически разблокирован {new Date(selectedDate).toLocaleDateString('ru-RU')}
            </p>
          </div>
        )}
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Добавить запись
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500">Пользователь</th>
              <th className="px-6 py-3 text-left text-gray-500">Срок</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(entry => (
              <tr key={entry.id}>
                <td className="px-6 py-4">{entry.name}</td>
                <td className="px-6 py-4">
                  {entry.until === 'Навсегда' ? (
                    <span className="text-red-600 font-medium">{entry.until}</span>
                  ) : (
                    <span className="text-gray-700">{entry.until}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** Демо: удаление из ЧС с подтверждением */
export const DeleteFromBlacklistDemo: React.FC = () => {
  const [entries, setEntries] = useState([
    { id: '1', name: 'Мария Удаляева', vkId: 123456 },
    { id: '2', name: 'Иван Блокиров', vkId: 654321 }
  ]);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; vkId: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (entry: { id: string; name: string; vkId: number }) => {
    setToDelete(entry);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setIsDeleting(true);
    setTimeout(() => {
      setEntries(prev => prev.filter(e => e.id !== toDelete.id));
      setToDelete(null);
      setIsDeleting(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-gray-500">Пользователь</th>
              <th className="px-6 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{entry.name}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(entry)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Всплывающее окно подтверждения */}
      {toDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Удалить из чёрного списка?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Разблокировать {toDelete.name}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:bg-green-400"
              >
                {isDeleting ? 'Удаление...' : 'Разблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
        💡 Нажмите "Удалить" на любой записи — появится всплывающее окно подтверждения
      </p>
    </div>
  );
};

/** Демо: пустое состояние (нет записей в ЧС) */
export const EmptyStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Черный список (Конкурс)</h3>
      </div>
      
      <div className="flex items-center justify-center p-8 text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🚫</span>
          </div>
          <p className="text-sm">Пусто.</p>
          <p className="text-xs text-gray-500 mt-2">
            Пользователи появятся после добавления в чёрный список
          </p>
        </div>
      </div>
    </div>
  );
};

/** Демо: состояние загрузки */
export const LoadingStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden" style={{ height: '300px' }}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="loader h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Загрузка списка...</p>
        </div>
      </div>
    </div>
  );
};
