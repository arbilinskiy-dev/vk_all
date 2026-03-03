// VkTestPage — тонкий хаб-компонент.
// Логика в hooks/useVkTestLogic.ts, секции в components/
import React from 'react';
import { useVkTestLogic } from './hooks/useVkTestLogic';
import { APP_ID_1, APP_ID_2 } from './constants';
import { LoginSection } from './components/LoginSection';
import { LogsPanel } from './components/LogsPanel';
import { UsersTable } from './components/UsersTable';
import { GroupsSection } from './components/GroupsSection';

export const VkTestPage: React.FC = () => {
  const { state, actions } = useVkTestLogic();

  return (
    <div className="p-6 max-w-4xl mx-auto">
       {/* Заголовок + переключатель App ID */}
       <div className="flex justify-between items-center mb-6">
           <h1 className="text-2xl font-bold text-gray-800">VK Auth Test Integration</h1>
           
           <div className="flex bg-gray-200 rounded-lg p-1">
               <button 
                  onClick={() => actions.setActiveAppId(APP_ID_1)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${state.activeAppId === APP_ID_1 ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
               >
                   Main App ({APP_ID_1})
               </button>
               <button 
                  onClick={() => actions.setActiveAppId(APP_ID_2)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${state.activeAppId === APP_ID_2 ? 'bg-purple-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
               >
                   New App ({APP_ID_2})
               </button>
           </div>
       </div>
       
       {/* Секция авторизации + логи */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <LoginSection
             activeAppId={state.activeAppId}
             authResult={state.authResult}
             isStandaloneLoading={state.isStandaloneLoading}
             onManualLogin={actions.manualLogin}
             onStartStandaloneAuth={actions.startStandaloneAuth}
           />
           <LogsPanel
             logs={state.logs}
             onClearLogs={actions.clearLogs}
           />
       </div>

       {/* Таблица авторизованных VK пользователей */}
       <UsersTable
         vkUsers={state.vkUsers}
         isLoadingUsers={state.isLoadingUsers}
         isLoadingGroups={state.isLoadingGroups}
         selectedUserForGroups={state.selectedUserForGroups}
         onRefresh={actions.fetchVkUsers}
         onDeleteUser={actions.handleDeleteUser}
         onFetchGroups={actions.fetchUserGroups}
       />

       {/* Секция групп пользователя */}
       {state.selectedUserForGroups && (
           <GroupsSection
             selectedUserForGroups={state.selectedUserForGroups}
             userGroups={state.userGroups}
             isLoadingGroups={state.isLoadingGroups}
             groupsError={state.groupsError}
             onClose={() => {
               actions.setSelectedUserForGroups(null);
               actions.setUserGroups([]);
               actions.setGroupsError(null);
             }}
           />
       )}
    </div>
  );
};
