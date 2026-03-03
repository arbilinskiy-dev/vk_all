// Секция групп пользователя VK
import React from 'react';
import { VkGroup } from '../types';

interface GroupsSectionProps {
  selectedUserForGroups: string;
  userGroups: VkGroup[];
  isLoadingGroups: boolean;
  groupsError: string | null;
  onClose: () => void;
}

export const GroupsSection: React.FC<GroupsSectionProps> = ({
  selectedUserForGroups,
  userGroups,
  isLoadingGroups,
  groupsError,
  onClose,
}) => {
  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Группы пользователя
          <span className="ml-2 text-sm font-normal text-gray-500">
            (VK ID: {selectedUserForGroups})
          </span>
        </h2>
        <button 
          onClick={onClose}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Закрыть
        </button>
      </div>

      {isLoadingGroups ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groupsError ? (
        <div className="text-center py-8 text-red-500">
          <p className="font-medium">Ошибка получения групп</p>
          <p className="text-sm mt-1">{groupsError}</p>
          <p className="text-xs mt-2 text-gray-500">
            Возможно, токен VK ID не имеет доступа к методу groups.get.<br/>
            Попробуйте Standalone-авторизацию.
          </p>
        </div>
      ) : userGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>У пользователя нет групп или нет доступа.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userGroups.map((group) => (
            <div 
              key={group.id} 
              className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {group.photo_200 ? (
                <img 
                  src={group.photo_200} 
                  alt={group.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <a 
                  href={`https://vk.com/${group.screen_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                >
                  {group.name}
                </a>
                <p className="text-xs text-gray-500 mt-0.5">
                  @{group.screen_name}
                </p>
                {group.members_count !== undefined && (
                  <p className="text-xs text-gray-400 mt-1">
                    {group.members_count.toLocaleString('ru-RU')} подписчиков
                  </p>
                )}
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                  group.type === 'group' ? 'bg-blue-100 text-blue-700' :
                  group.type === 'page' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {group.type === 'group' ? 'Группа' : 
                   group.type === 'page' ? 'Страница' : 
                   group.type === 'event' ? 'Мероприятие' : group.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
