// Таблица авторизованных VK пользователей
import React from 'react';
import { VkUserFromDb } from '../types';

interface UsersTableProps {
  vkUsers: VkUserFromDb[];
  isLoadingUsers: boolean;
  isLoadingGroups: boolean;
  selectedUserForGroups: string | null;
  onRefresh: () => void;
  onDeleteUser: (userId: string) => void;
  onFetchGroups: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  vkUsers,
  isLoadingUsers,
  isLoadingGroups,
  selectedUserForGroups,
  onRefresh,
  onDeleteUser,
  onFetchGroups,
}) => {
  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Авторизованные VK пользователи
          <span className="ml-2 text-sm font-normal text-gray-500">({vkUsers.length})</span>
        </h2>
        <button 
          onClick={onRefresh}
          disabled={isLoadingUsers}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-2"
        >
          {isLoadingUsers ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Обновить
        </button>
      </div>

      {vkUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Пока нет авторизованных пользователей.</p>
          <p className="text-sm mt-1">Авторизуйтесь через VK выше, чтобы увидеть данные здесь.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Пользователь</th>
                <th className="px-4 py-3 text-left">VK ID</th>
                <th className="px-4 py-3 text-left">App ID</th>
                <th className="px-4 py-3 text-left">Последний вход</th>
                <th className="px-4 py-3 text-left">Токен</th>
                <th className="px-4 py-3 text-left">Токен истекает</th>
                <th className="px-4 py-3 text-center">Статус</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vkUsers.map((user) => (
                <tr key={user.vk_user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.photo_url ? (
                        <img 
                          src={user.photo_url} 
                          alt="" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                          VK
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        {user.email && (
                          <div className="text-xs text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">
                    {user.vk_user_id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.app_id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.last_login ? new Date(user.last_login + 'Z').toLocaleString('ru-RU') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {user.access_token ? (
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 max-w-[200px] truncate block" title={user.access_token}>
                          {user.access_token.substring(0, 20)}...
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.access_token!);
                            window.showAppToast?.('Токен скопирован', 'success');
                          }}
                          className="text-gray-400 hover:text-blue-600 flex-shrink-0"
                          title="Скопировать токен"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.token_expires_at ? new Date(user.token_expires_at + 'Z').toLocaleString('ru-RU') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      // Проверяем истёк ли токен (с учётом UTC)
                      const expired = user.token_expires_at ? new Date(user.token_expires_at + 'Z') < new Date() : false;
                      if (expired) {
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Истёк
                          </span>
                        );
                      }
                      return user.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Неактивен
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onFetchGroups(user.vk_user_id)}
                        disabled={isLoadingGroups && selectedUserForGroups === user.vk_user_id}
                        className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                        title="Получить группы"
                      >
                        {isLoadingGroups && selectedUserForGroups === user.vk_user_id ? (
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.vk_user_id)}
                        className="text-red-500 hover:text-red-700"
                        title="Удалить пользователя"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
