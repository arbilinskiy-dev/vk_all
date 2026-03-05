import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import * as api from '../../../services/api';
import { AuthUser } from '../../../shared/types';
import { LoginPayload } from '../../../services/api';

// Данные VK пользователя после авторизации
interface VkAuthData {
    vk_user_id: string;
    first_name: string;
    last_name: string;
    photo_url?: string;
    access_token: string;
}

interface IAuthContext {
    user: AuthUser | null;
    isLoading: boolean;
    login: (credentials: LoginPayload) => Promise<void>;
    loginWithVk: (vkData: VkAuthData) => void;
    logout: () => void;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const useAuth = (): IAuthContext => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const SESSION_STORAGE_KEY = 'vk-content-planner-auth';
const SESSION_TOKEN_KEY = 'vk-planner-session-token';
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 минут

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- Таймаут бездействия ---
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        // Запускаем таймер только если пользователь авторизован
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
        if (token) {
            inactivityTimerRef.current = setTimeout(() => {
                console.warn('⏰ Сессия завершена по таймауту бездействия (20 мин)');
                performLogout();
                window.showAppToast?.('Сессия завершена: вы были неактивны более 20 минут', 'warning');
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, []);

    // Слушаем активность пользователя для сброса таймера
    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        const handler = () => resetInactivityTimer();
        
        events.forEach(event => window.addEventListener(event, handler, { passive: true }));
        
        return () => {
            events.forEach(event => window.removeEventListener(event, handler));
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [resetInactivityTimer]);

    // --- Обработка глобального события session-expired (от apiClient) ---
    useEffect(() => {
        const handleSessionExpired = () => {
            console.warn('🔒 Сервер сообщил об истечении сессии');
            performLogout();
            window.showAppToast?.('Сессия истекла. Пожалуйста, авторизуйтесь заново.', 'warning');
        };
        
        window.addEventListener('vk-planner:session-expired', handleSessionExpired);
        return () => window.removeEventListener('vk-planner:session-expired', handleSessionExpired);
    }, []);

    // --- Восстановление сессии при загрузке ---
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const storedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
                const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
                
                if (storedUser && sessionToken) {
                    // Проверяем валидность сессии на сервере
                    try {
                        const sessionData = await api.checkSession();
                        const parsed = JSON.parse(storedUser) as AuthUser;
                        // Обновляем full_name из ответа сервера (если было обновлено в БД)
                        if (sessionData.full_name) {
                            parsed.full_name = sessionData.full_name;
                        }
                        // Обновляем флаг системного администратора
                        parsed.is_system_admin = sessionData.is_system_admin === true;
                        setUser(parsed);
                        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
                        resetInactivityTimer();
                    } catch {
                        // Сессия протухла — очищаем
                        console.warn('🔒 Серверная сессия недействительна, очищаю...');
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                        sessionStorage.removeItem(SESSION_TOKEN_KEY);
                    }
                }
            } catch (error) {
                console.error('Не удалось восстановить сессию', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        restoreSession();
    }, []);

    const performLogout = useCallback(() => {
        // Пытаемся сообщить серверу о выходе (fire-and-forget)
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
        if (token) {
            api.logout().catch(() => {}); // Не блокируем UI при ошибке
        }
        setUser(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }, []);

    const login = useCallback(async (credentials: LoginPayload) => {
        const response = await api.login(credentials);
        if (response.success) {
            const authUser: AuthUser = { 
                username: response.username, 
                role: response.role as 'admin' | 'user',
                full_name: response.full_name || undefined,
                vk_user_id: undefined,
                photo_url: undefined,
                is_system_admin: response.is_system_admin === true,
            };
            
            // Сохраняем серверный session_token
            if (response.session_token) {
                sessionStorage.setItem(SESSION_TOKEN_KEY, response.session_token);
            }
            
            setUser(authUser);
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
            resetInactivityTimer();
        }
    }, [resetInactivityTimer]);

    // Авторизация через VK
    const loginWithVk = useCallback((vkData: VkAuthData) => {
        console.log('🔐 loginWithVk called with:', vkData);
        const authUser: AuthUser = { 
            username: `${vkData.first_name} ${vkData.last_name}`.trim(),
            role: 'user', // VK пользователи получают роль user по умолчанию
            vk_user_id: vkData.vk_user_id,
            photo_url: vkData.photo_url
        };
        console.log('🔐 Setting authUser:', authUser);
        setUser(authUser);
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser));
        // VK-авторизация пока не использует серверные сессии — задел на будущее
    }, []);

    const value = { user, isLoading, login, loginWithVk, logout: performLogout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
