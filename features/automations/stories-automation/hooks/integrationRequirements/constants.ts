import { IntegrationRequirementsState } from './types';

// ─── Начальное состояние ─────────────────────────────────────────

export const INITIAL_STATE: IntegrationRequirementsState = {
    isChecked: false,
    isChecking: false,
    isReady: false,
    error: null,
    hasToken: false,
    groupName: null,
    groupShortName: null,
    groupId: null,
    hasCallback: false,
    serverName: null,
    serverUrl: null,
    callbackStatus: null,
    enabledEventsCount: 0,
    enabledEvents: [],
    hasWallPostNew: false,
};
