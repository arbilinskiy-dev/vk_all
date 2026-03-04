import { callApi } from '../../shared/utils/apiClient';

// --- AUTH API ---
export type LoginPayload = {
    username: string;
    password: string;
}

export const login = async (credentials: LoginPayload): Promise<{ success: boolean; role: 'admin' | 'user', username: string, full_name?: string, session_token?: string }> => {
    return callApi('auth/login', credentials);
};

export const logout = async (): Promise<{ success: boolean }> => {
    return callApi('auth/logout', {});
};

export const checkSession = async (): Promise<{ valid: boolean; username: string; role: string; full_name?: string }> => {
    return callApi('auth/check-session', {});
};

// --- AUTH LOGS API (только для администраторов) ---

export interface AuthLogEntry {
    id: string;
    user_id: string | null;
    user_type: string;
    username: string | null;
    full_name: string | null;
    event_type: string;
    ip_address: string | null;
    user_agent: string | null;
    details: Record<string, any> | null;
    created_at: string | null;
}

export interface AuthLogsResponse {
    logs: AuthLogEntry[];
    total: number;
    page: number;
    page_size: number;
}

export interface GetAuthLogsPayload {
    page?: number;
    page_size?: number;
    user_id?: string | null;
    event_type?: string | null;
    date_from?: string | null;
    date_to?: string | null;
}

export const getAuthLogs = async (payload: GetAuthLogsPayload = {}): Promise<AuthLogsResponse> => {
    return callApi('auth-logs/get', payload);
};

export const getAuthLogUsers = async (): Promise<{ user_id: string; username: string }[]> => {
    return callApi('auth-logs/users', {});
};

export const clearAuthLogs = async (olderThanDays?: number): Promise<{ success: boolean; deleted: number }> => {
    return callApi('auth-logs/clear', { older_than_days: olderThanDays ?? null });
};

// --- ACTIVE SESSIONS API (только для администраторов) ---

export interface ActiveSession {
    id: string;
    user_id: string;
    username: string;
    full_name: string | null;
    role: string;
    user_type: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string | null;
    last_activity: string | null;
    session_duration_minutes: number | null;
    idle_minutes: number | null;
}

export interface ActiveSessionsResponse {
    sessions: ActiveSession[];
    total: number;
}

export const getActiveSessions = async (): Promise<ActiveSessionsResponse> => {
    return callApi('active-sessions/get', {});
};

export const terminateSession = async (sessionId: string): Promise<{ success: boolean; message?: string }> => {
    return callApi('active-sessions/terminate', { session_id: sessionId });
};
