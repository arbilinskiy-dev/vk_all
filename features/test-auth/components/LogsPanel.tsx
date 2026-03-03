// Панель логов — консоль-подобная область с выводом действий
import React from 'react';

interface LogsPanelProps {
  logs: string[];
  onClearLogs: () => void;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs h-96 overflow-auto">
      <div className="border-b border-gray-700 pb-2 mb-2 font-bold text-gray-300 flex justify-between items-center">
        <span>Logs</span>
        <button 
          onClick={onClearLogs}
          className="text-xs text-gray-500 hover:text-red-400 transition"
        >
          Очистить
        </button>
      </div>
      {logs.length === 0 ? (
        <div className="text-gray-500 italic">Логи пусты. Выполните авторизацию...</div>
      ) : (
        logs.map((L, i) => <div key={i}>{L}</div>)
      )}
    </div>
  );
};
