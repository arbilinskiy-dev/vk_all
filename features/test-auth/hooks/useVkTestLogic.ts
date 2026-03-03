// Хук логики VK Test Auth — стейт, обработчики, эффекты
import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import { VkUserFromDb, VkGroup } from '../types';
import { APP_ID_1, APP_ID_STANDALONE, STANDALONE_SCOPE } from '../constants';
import { generateCodeVerifier } from '../utils/cryptoUtils';

export function useVkTestLogic() {
  const { loginWithVk } = useAuth();
  const [activeAppId, setActiveAppId] = useState<number>(APP_ID_1);
  const [authResult, setAuthResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>(() => {
    // Восстанавливаем логи из sessionStorage при загрузке
    try {
      const saved = sessionStorage.getItem('vk-test-logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  // Храним verifier и redirectUri в стейте для консистентности
  const [authContext, setAuthContext] = useState<{verifier: string, redirectUrl: string, scope?: string} | null>(null);
  
  // Список авторизованных VK пользователей из БД
  const [vkUsers, setVkUsers] = useState<VkUserFromDb[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Состояние для групп пользователя
  const [selectedUserForGroups, setSelectedUserForGroups] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<VkGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  
  // Состояние для Standalone авторизации
  const [isStandaloneLoading, setIsStandaloneLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => {
    const newLogs = [...prev, `${new Date().toLocaleTimeString()} - ${msg}`];
    // Сохраняем в sessionStorage
    try {
      sessionStorage.setItem('vk-test-logs', JSON.stringify(newLogs.slice(-50))); // Храним последние 50
    } catch {}
    return newLogs;
  });

  // Функция очистки логов
  const clearLogs = () => {
    setLogs([]);
    try {
      sessionStorage.removeItem('vk-test-logs');
    } catch {}
  };

  // Обработка Standalone callback
  const handleStandaloneCallback = async (accessToken: string, userId: string, expiresIn: string | null) => {
    setIsStandaloneLoading(true);
    addLog(`📡 POST /api/vk-test/standalone-callback`);
    addLog(`   user_id: ${userId}`);
    addLog(`   app_id: ${APP_ID_STANDALONE}`);
    addLog(`   expires_in: ${expiresIn}`);
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/vk-test/standalone-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: accessToken,
          user_id: userId,
          expires_in: expiresIn ? parseInt(expiresIn) : 0,
          app_id: APP_ID_STANDALONE
        })
      });
      
      addLog(`📥 Response status: ${res.status}`);
      const data = await res.json();
      
      if (res.ok) {
        addLog(`✅ Standalone auth SUCCESS!`);
        addLog(`👤 User: ${data.user_info?.first_name} ${data.user_info?.last_name}`);
        addLog(`🔗 Token expires: ${data.token_expires_at || 'never (offline)'}`);
        
        if (data.groups_test?.count !== undefined) {
          addLog(`📁 Groups test OK: ${data.groups_test.count} managed groups found`);
        } else if (data.groups_test?.error) {
          addLog(`⚠️ Groups test failed: ${data.groups_test.error.error_msg}`);
        }
        
        setAuthResult(data);
        fetchVkUsers();
        
        // Авторизуем в контексте приложения
        if (data.user_info) {
          loginWithVk({
            vk_user_id: userId,
            first_name: data.user_info.first_name || 'VK',
            last_name: data.user_info.last_name || 'User',
            photo_url: data.user_info.photo_200 || data.user_info.photo_100 || '',
            access_token: accessToken
          });
          addLog(`🎉 User logged into app context`);
        }
      } else {
        addLog(`❌ Standalone auth ERROR: ${data.detail}`);
      }
    } catch (e: any) {
      addLog(`❌ Network error: ${e.message}`);
    } finally {
      setIsStandaloneLoading(false);
    }
  };

  // Обработка callback от Standalone авторизации (токен в URL hash)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      addLog('🔑 Detected Standalone auth callback in URL hash');
      
      // Парсим параметры из hash
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const userId = params.get('user_id');
      const expiresIn = params.get('expires_in');
      
      addLog(`📋 Parsed params: user_id=${userId}, expires_in=${expiresIn}`);
      addLog(`🔐 Token: ${accessToken?.substring(0, 20)}...`);
      
      if (accessToken && userId) {
        addLog(`✅ Standalone token received for user ${userId}`);
        
        // Сохраняем токен на бэкенд
        handleStandaloneCallback(accessToken, userId, expiresIn);
        
        // Очищаем hash из URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        addLog('❌ Missing access_token or user_id in hash!');
      }
    }
  }, []);

  // Запуск Standalone авторизации
  const startStandaloneAuth = () => {
    const currentUrl = window.location.origin + window.location.pathname;
    const authUrl = `https://oauth.vk.com/authorize?client_id=${APP_ID_STANDALONE}&display=page&redirect_uri=${encodeURIComponent(currentUrl)}&scope=${STANDALONE_SCOPE}&response_type=token&v=5.199`;
    
    addLog(`🚀 Starting Standalone auth for App ${APP_ID_STANDALONE}...`);
    addLog(`🔗 Redirect URL: ${currentUrl}`);
    addLog(`📋 Scope: ${STANDALONE_SCOPE}`);
    addLog(`🌐 Opening VK OAuth...`);
    
    window.location.href = authUrl;
  };

  // Функция загрузки VK пользователей
  const fetchVkUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/vk-test/users');
      if (res.ok) {
        const data = await res.json();
        setVkUsers(data);
        addLog(`Loaded ${data.length} VK users from DB`);
      }
    } catch (e: any) {
      addLog(`Error loading users: ${e.message}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Функция удаления VK пользователя
  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/vk-test/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addLog(`Deleted user ${userId}`);
        fetchVkUsers(); // Перезагружаем список
        // Если удалили пользователя, для которого показывали группы — сбрасываем
        if (selectedUserForGroups === userId) {
          setSelectedUserForGroups(null);
          setUserGroups([]);
        }
      }
    } catch (e: any) {
      addLog(`Error deleting user: ${e.message}`);
    }
  };

  // Функция получения групп пользователя
  const fetchUserGroups = async (userId: string) => {
    setIsLoadingGroups(true);
    setGroupsError(null);
    setSelectedUserForGroups(userId);
    setUserGroups([]);
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/vk-test/users/${userId}/groups`);
      const data = await res.json();
      
      if (!res.ok) {
        setGroupsError(data.detail || 'Ошибка получения групп');
        addLog(`Error fetching groups: ${data.detail}`);
        return;
      }
      
      if (data.success) {
        setUserGroups(data.groups);
        addLog(`Loaded ${data.count} groups for user ${userId}`);
      } else {
        setGroupsError(data.error?.error_msg || 'Ошибка VK API');
        addLog(`VK API Error: ${data.error?.error_msg}`);
      }
    } catch (e: any) {
      setGroupsError(e.message);
      addLog(`Network error: ${e.message}`);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Загружаем пользователей при монтировании
  useEffect(() => {
    fetchVkUsers();
  }, []);

  // Обработчик postMessage от callback окна VK авторизации
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'VK_AUTH_CALLBACK') {
        const { code, device_id } = event.data.payload;
        addLog(`Received VK callback via postMessage! Code: ${code?.substring(0, 10)}...`);
        
        if (code && authContext) {
          // Используем verifier из текущего контекста
          handleServerAuth(code, device_id, authContext.verifier, authContext.redirectUrl, activeAppId);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [authContext, activeAppId]);

  const initVK = (verifier: string, redirectUrl: string, appId: number) => {
    if ('VKIDSDK' in window) {
      const VKID = window.VKIDSDK;
      addLog(`VK SDK Init for App ${appId}. Verifier: ${verifier.substring(0,5)}...`);

      // Попытка 5: Добавляем email для проверки
      const scopeList = 'notify friends photos audio video stories pages notes wall ads offline docs groups notifications stats email market';
      // Сохраняем scope в контекст для переиспользования
      setAuthContext({verifier, redirectUrl, scope: scopeList});

      VKID.Config.init({
        app: appId,
        redirectUrl: redirectUrl, 
        responseMode: VKID.ConfigResponseMode.Callback,
        scope: scopeList, 
        codeVerifier: verifier 
      });

      const oneTap = new VKID.OneTap();
      const container = document.getElementById('vk-test-container');
      
      if (container) {
          container.innerHTML = ''; 
          oneTap.render({
            container: container,
            showAlternativeLogin: true
          })
          .on(VKID.WidgetEvents.ERROR, (error: any) => {
             console.error('VK error', error);
             addLog(`VK Widget Error: ${JSON.stringify(error)}`);
          })
          .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, (payload: any) => {
             const { code, device_id } = payload;
             addLog(`OneTap Success! Sending to backend...`);
             handleServerAuth(code, device_id, verifier, redirectUrl, appId);
          });
      }
    }
  };

  // Эффект переинициализации при смене activeAppId
  useEffect(() => {
    setLogs([]); // Очищаем логи при переключении
    addLog(`Switching to App ID: ${activeAppId}`);
    
    // 2. Подготовка контекста (генерируем НОВЫЙ verifier для новой сессии)
    const verifier = generateCodeVerifier();
    // Используем текущий домен (поддержка ngrok и продакшена)
    const redirectUrl = window.location.origin + '/'; 
    setAuthContext({ verifier, redirectUrl });

    // Динамическая загрузка VK SDK
    if (!document.getElementById('vkid-sdk')) {
       const script = document.createElement('script');
       script.id = 'vkid-sdk';
       script.src = 'https://unpkg.com/@vkid/sdk@latest/dist-sdk/umd/index.js';
       script.onload = () => initVK(verifier, redirectUrl, activeAppId);
       document.body.appendChild(script);
    } else {
       // Небольшая задержка для cleanup при быстром переключении
       setTimeout(() => initVK(verifier, redirectUrl, activeAppId), 50);
    }
  }, [activeAppId]);

  // Ручной вызов авторизации
  const manualLogin = () => {
     if ('VKIDSDK' in window) {
         if (!authContext) {
             addLog("Error: Auth Context not ready");
             return;
         }

         // Генерируем НОВЫЙ verifier перед каждым ручным вызовом, чтобы избежать конфликтов
         const newVerifier = generateCodeVerifier();
         const scopeList = authContext.scope || 'email groups wall photos docs offline';
         
         addLog(`Starting Manual Auth.login (forcing params)...`);
         addLog(`New Verifier: ${newVerifier.substring(0,5)}...`);

         const loginParams = {
            codeVerifier: newVerifier,
            scope: scopeList 
        };
         
         // @ts-ignore - Insist on passing params
         window.VKIDSDK.Auth.login(loginParams) 
            .then((payload: any) => {
                addLog(`Manual Login Payload Keys: ${Object.keys(payload).join(', ')}`);

                const { code, device_id } = payload;
                
                // ВАЖНО: При ручном вызове используем ТОТ ЖЕ verifier, что передали в loginParams
                const msgVerifier = payload.code_verifier || newVerifier;
                
                addLog(`Using verifier for exchange: ${msgVerifier.substring(0,5)}...`);

                handleServerAuth(code, device_id, msgVerifier, authContext.redirectUrl, activeAppId);
            })
            .catch((err: any) => {
                addLog(`Manual Login Error: ${JSON.stringify(err)}`);
            });
     }
  };

  const handleServerAuth = async (code: string, deviceId: string, verifier: string, redirectUrl: string, appId: number) => {
      try {
          const body = { 
            code, 
            device_id: deviceId, 
            code_verifier: verifier,
            redirect_uri: redirectUrl,
            app_id: appId
          };
          
          addLog(`POST /api/vk-test/exchange-token (For App ${appId})`);
          
          const res = await fetch('http://127.0.0.1:8000/api/vk-test/exchange-token', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(body)
          });

          const data = await res.json();
          addLog(`Backend Response: ${res.status}`);
          
          if (!res.ok) {
              addLog(`Error: ${JSON.stringify(data)}`);
              return;
          }

          setAuthResult(data);
          addLog("Success! User saved to DB: " + (data.user_info?.first_name || 'Unknown'));
          addLog(`DEBUG: user_info = ${JSON.stringify(data.user_info)}`);
          addLog(`DEBUG: auth_data.user_id = ${data.auth_data?.user_id}`);
          
          // Авторизуем пользователя в контексте приложения
          if (data.user_info) {
              const vkUserId = String(data.auth_data?.user_id || data.user_info.id);
              const firstName = data.user_info.first_name || 'VK';
              const lastName = data.user_info.last_name || 'User';
              const photoUrl = data.user_info.photo_200 || data.user_info.photo_100;
              
              addLog(`DEBUG: Calling loginWithVk with: ${firstName} ${lastName}, vk_id=${vkUserId}`);
              
              loginWithVk({
                  vk_user_id: vkUserId,
                  first_name: firstName,
                  last_name: lastName,
                  photo_url: photoUrl,
                  access_token: data.auth_data?.access_token || ''
              });
              addLog("User logged into app context");
          } else {
              addLog("ERROR: No user_info in response!");
          }
          
          // Перезагружаем список пользователей после успешной авторизации
          fetchVkUsers();
          
      } catch (e: any) {
          addLog(`Network Error: ${e.message}`);
      }
  };

  return {
    state: {
      activeAppId,
      authResult,
      logs,
      authContext,
      vkUsers,
      isLoadingUsers,
      selectedUserForGroups,
      userGroups,
      isLoadingGroups,
      groupsError,
      isStandaloneLoading,
    },
    actions: {
      setActiveAppId,
      addLog,
      clearLogs,
      startStandaloneAuth,
      fetchVkUsers,
      handleDeleteUser,
      fetchUserGroups,
      manualLogin,
      setSelectedUserForGroups,
      setUserGroups,
      setGroupsError,
    }
  };
}
