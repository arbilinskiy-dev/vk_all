// Секция авторизации — VK SDK OneTap, ручной вход, Standalone OAuth
import React from 'react';
import { APP_ID_1, APP_ID_2, APP_ID_STANDALONE, STANDALONE_SCOPE } from '../constants';

interface LoginSectionProps {
  activeAppId: number;
  authResult: any;
  isStandaloneLoading: boolean;
  onManualLogin: () => void;
  onStartStandaloneAuth: () => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({
  activeAppId,
  authResult,
  isStandaloneLoading,
  onManualLogin,
  onStartStandaloneAuth,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-2">Login Area <span className="text-xs font-normal text-gray-500">(App: {activeAppId})</span></h2>
      <div id="vk-test-container" className="flex justify-center my-4 min-h-[50px]"></div>
      
      {authResult && (
        <div className="mt-4 p-4 bg-green-50 rounded text-sm text-green-800">
          <p className="font-bold">Authorized Successfully!</p>
          <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(authResult, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8 border-t pt-4">
        <h3 className="text-md font-bold mb-2">Alternative Method</h3>
        <button 
          onClick={onManualLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Force Permission Request (Auth.login)
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Use this if OneTap doesn't ask for scopes. <br/>
          <b>Note:</b> If you already authorized the app, revoke access in VK Settings to trigger permission prompt again.
        </p>
      </div>

      {/* Standalone авторизация */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-md font-bold mb-2 flex items-center gap-2">
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Рекомендуется</span>
          Standalone OAuth (App {APP_ID_STANDALONE})
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Полный доступ к VK API, включая groups.get и все методы.<br/>
          Использует классический OAuth redirect вместо VK ID SDK.
        </p>
        <button 
          onClick={onStartStandaloneAuth}
          disabled={isStandaloneLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {isStandaloneLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Обработка...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Авторизация Standalone
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Scope: {STANDALONE_SCOPE.split(',').slice(0, 5).join(', ')}...
        </p>
      </div>
    </div>
  );
};
