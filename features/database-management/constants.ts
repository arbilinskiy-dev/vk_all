import { ColumnDefinition } from './components/ProjectTable';

// Режим просмотра страницы управления базой
export type ViewMode = 'main' | 'archive' | 'global-variables' | 'project-context' | 'administered';

// Определение колонок таблицы проектов
export const COLUMNS: ColumnDefinition[] = [
    { key: 'sort_order', label: '№' },
    { key: 'name', label: 'Название проекта' },
    { key: 'teams', label: 'Команды' },
    { key: 'disabled', label: 'Статус' },
    { key: 'archived', label: 'В архив' },
    { key: 'communityToken', label: 'Токен сообщества' },
    { key: 'additional_community_tokens', label: 'Доп. токены' },
    { key: 'notes', label: 'Заметки' },
    { key: 'vk_confirmation_code', label: 'Код Callback API' },
    { key: 'dlvry_affiliate_id', label: 'DLVRY ID' },
    { key: 'vkGroupName', label: 'Название VK' },
    { key: 'vkLink', label: 'Ссылка VK' },
];
