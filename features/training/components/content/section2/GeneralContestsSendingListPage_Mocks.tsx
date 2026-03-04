import React, { useState } from 'react';

// ============================================
// Демо-компоненты для журнала отправки призов
// ============================================

/** Демо: Общий вид журнала отправки */
export const DeliveryJournalDemo: React.FC = () => {
  const mockLogs = [
    { id: '1', user: 'Анна Смирнова', code: 'PROMO123', status: 'sent' as const, time: '15.02.2026, 14:30' },
    { id: '2', user: 'ID 987654321', code: 'WIN2024', status: 'error' as const, time: '15.02.2026, 14:31' },
    { id: '3', user: 'Дмитрий Козлов', code: 'SALE777', status: 'sent' as const, time: '15.02.2026, 14:32' }
  ];

  const stats = {
    sent: mockLogs.filter(l => l.status === 'sent').length,
    error: mockLogs.filter(l => l.status === 'error').length
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      {/* Шапка */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">Журнал отправки призов (Конкурс)</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="text-green-600">Успешно: <strong>{stats.sent}</strong></span>
            <span className="ml-3 text-red-500">Ошибки: <strong>{stats.error}</strong></span>
          </div>
          {stats.error > 0 && (
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs">
              Повторить всем
            </button>
          )}
          <button className="px-3 py-1.5 border rounded text-xs">
            Очистить
          </button>
        </div>
      </div>

      {/* Таблица */}
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
          <tr>
            <th className="px-4 py-3">Пользователь</th>
            <th className="px-4 py-3">Код / Приз</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3">Время</th>
            <th className="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {mockLogs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{log.user}</td>
              <td className="px-4 py-3 font-mono">{log.code}</td>
              <td className="px-4 py-3">{log.status}</td>
              <td className="px-4 py-3 text-gray-500">{log.time}</td>
              <td className="px-4 py-3 text-right">
                {log.status === 'error' && (
                  <button className="text-xs text-indigo-600 hover:text-indigo-800">
                    Повторить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Демо: Заголовок и счётчики статистики */
export const HeaderWithCountersDemo: React.FC = () => {
  const [sentCount, setSentCount] = useState(12);
  const [errorCount, setErrorCount] = useState(3);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 text-lg">Журнал отправки призов (Конкурс)</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              Успешно: <strong className="text-lg">{sentCount}</strong>
            </span>
            <span className="text-red-500 flex items-center gap-1">
              Ошибки: <strong className="text-lg">{errorCount}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSentCount(c => c + 1)}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          + Успешная отправка
        </button>
        <button
          onClick={() => setErrorCount(c => c + 1)}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          + Ошибка отправки
        </button>
        <button
          onClick={() => { setSentCount(0); setErrorCount(0); }}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Сбросить
        </button>
      </div>

      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
        💡 Счётчики обновляются автоматически при изменении данных в журнале
      </p>
    </div>
  );
};

/** Демо: Таблица записей о доставке */
export const DeliveryTableDemo: React.FC = () => {
  const mockLogs = [
    { id: '1', user: 'Анна Смирнова', userId: '123456789', code: 'PROMO123', status: 'sent' as const, time: '15 февраля 2026 г., 14:30:15' },
    { id: '2', user: 'Дмитрий Козлов', userId: '987654321', code: 'WIN2024', status: 'sent' as const, time: '15 февраля 2026 г., 14:31:22' },
    { id: '3', user: null, userId: '555666777', code: 'SALE777', status: 'error' as const, time: '15 февраля 2026 г., 14:32:08' }
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
          <tr>
            <th className="px-4 py-3 text-left">Пользователь</th>
            <th className="px-4 py-3 text-left">Код / Приз</th>
            <th className="px-4 py-3 text-left">Статус</th>
            <th className="px-4 py-3 text-left">Время</th>
            <th className="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {mockLogs.map(log => (
            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                {log.user ? (
                  <span className="text-gray-900">{log.user}</span>
                ) : (
                  <span className="text-gray-500">ID {log.userId}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <code className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {log.code}
                </code>
              </td>
              <td className="px-4 py-3">
                <span className={log.status === 'sent' ? 'text-green-600' : 'text-red-500'}>
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {log.time}
              </td>
              <td className="px-4 py-3 text-right">
                {log.status === 'error' && (
                  <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    Повторить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        💡 <strong>Особенности:</strong> Промокоды выделены моноширинным шрифтом, статусы показаны текстом (sent/error)
      </div>
    </div>
  );
};

/** Демо: Повтор отправки для одной записи */
export const RetryButtonDemo: React.FC = () => {
  const [logs, setLogs] = useState([
    { id: '1', user: 'Елена Петрова', code: 'ERROR123', status: 'error' as const, retrying: false },
    { id: '2', user: 'ID 777888999', code: 'FAIL456', status: 'error' as const, retrying: false }
  ]);

  const handleRetry = (id: string) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, retrying: true } : l));
    
    setTimeout(() => {
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'sent' as const, retrying: false } : l));
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Пользователь</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Код</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">Статус</th>
              <th className="px-4 py-3 text-right text-gray-500 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{log.user}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.code}</td>
                <td className="px-4 py-3">
                  <span className={log.status === 'sent' ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {log.status === 'sent' ? '✓ sent' : '✗ error'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {log.status === 'error' && (
                    <button
                      onClick={() => handleRetry(log.id)}
                      disabled={log.retrying}
                      className="text-xs text-indigo-600 hover:text-indigo-800 disabled:text-gray-400"
                    >
                      {log.retrying ? '...' : 'Повторить'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600 bg-indigo-50 p-3 rounded border border-indigo-200">
        💡 Попробуйте нажать "Повторить" — кнопка заблокируется, покажет "...", затем статус изменится на "sent"
      </p>
    </div>
  );
};

/** Демо: Массовый повтор для всех ошибок */
export const RetryAllButtonDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorCount, setErrorCount] = useState(3);

  const handleRetryAll = () => {
    setShowModal(false);
    setIsRetrying(true);
    
    setTimeout(() => {
      setErrorCount(0);
      setIsRetrying(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Журнал отправки призов</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-500">
              Ошибки: <strong>{errorCount}</strong>
            </span>
            {errorCount > 0 && (
              <button
                onClick={() => setShowModal(true)}
                disabled={isRetrying}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
              >
                {isRetrying ? 'Отправка...' : 'Повторить всем'}
              </button>
            )}
          </div>
        </div>

        {errorCount === 0 && (
          <div className="text-center py-8 text-green-600">
            ✓ Все сообщения доставлены успешно!
          </div>
        )}

        {errorCount > 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            {errorCount} записей со статусом "error" ожидают повторной отправки
          </div>
        )}
      </div>

      {/* Всплывающее окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Повторить отправку всем?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Вы уверены? Система попытается отправить сообщения всем пользователям со статусом "error".
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleRetryAll}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                Да, повторить
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => { setErrorCount(3); setIsRetrying(false); }}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Сбросить демо
      </button>
    </div>
  );
};

/** Демо: Очистка журнала отправки */
export const ClearButtonDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasRecords, setHasRecords] = useState(true);

  const handleClear = () => {
    setIsClearing(true);
    
    setTimeout(() => {
      setShowModal(false);
      setHasRecords(false);
      setIsClearing(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Журнал отправки призов</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 border rounded text-xs hover:bg-gray-50 transition-colors"
          >
            Очистить
          </button>
        </div>

        {hasRecords ? (
          <div className="text-sm text-gray-600 text-center py-4">
            📝 В журнале 15 записей
          </div>
        ) : (
          <div className="text-center py-8 text-green-600">
            ✓ Журнал очищен
          </div>
        )}
      </div>

      {/* Всплывающее окно с КРАСНОЙ кнопкой */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Очистить журнал?
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Удалить все записи? <strong className="text-red-600">Это действие необратимо.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                disabled={isClearing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:bg-red-400 flex items-center gap-2"
              >
                {isClearing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Очистка...
                  </>
                ) : (
                  'Да, очистить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        ⚠ <strong>Внимание:</strong> Кнопка подтверждения красная — это опасное действие, которое нельзя отменить
      </div>

      <button
        onClick={() => { setHasRecords(true); setShowModal(false); setIsClearing(false); }}
        className="text-xs text-gray-500 hover:text-gray-700 underline"
      >
        Сбросить демо
      </button>
    </div>
  );
};

/** Демо: Пустой журнал */
export const EmptyStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-700">Журнал отправки призов (Конкурс)</h3>
      </div>
      
      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📭</span>
        </div>
        <p className="text-gray-400 text-sm">
          Нет записей.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Записи появятся после первой отправки призов победителям
        </p>
      </div>
    </div>
  );
};

/** Демо: Загрузка журнала с сервера */
export const LoadingStateDemo: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden" style={{ height: '300px' }}>
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Загрузка журнала...</p>
        </div>
      </div>
    </div>
  );
};
