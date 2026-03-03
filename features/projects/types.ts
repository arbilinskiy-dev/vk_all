export type TeamFilter = string;
export type ContentFilter = 'all' | 'empty' | 'not_empty' | 'lt5' | '5-10' | 'gt10';
export type StoriesFilter = 'all' | 'active' | 'inactive';
export type ContestFilter = 'all' | 'active' | 'inactive';
/** Фильтр по подключению callback-сервера */
export type CallbackFilter = 'all' | 'connected' | 'not-connected';
/** Фильтр по наличию непрочитанных диалогов */
export type UnreadDialogsFilter = 'all' | 'has-unread';