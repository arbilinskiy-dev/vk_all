export interface StoriesAutomationPageProps {
    projectId?: string;
    // Вкладка хранится в родительском компоненте для сохранения между переключениями проектов
    activeTab: 'settings' | 'stats' | 'create';
    setActiveTab: (tab: 'settings' | 'stats' | 'create') => void;
}

export interface PublishedPost {
    id: string;
    projectId: string;
    text: string;
    date: string;
    vkPostUrl: string;
    images?: string | any[];
}

export interface StoryLog {
    id: string;
    project_id: string;
    vk_post_id: number;
    created_at: string;
    status: string;
    log: string;
}

export interface StoryStats {
    id: string; // Log ID
    vkPostId: number;
    date: string;
    storyLink: string;
    stats: any;
    statsUpdatedAt?: string;
}

// Базовая статистика с состоянием (on/off/hidden)
export interface StatCounter {
    state?: string;
    count: number;
}

// Примечание: VK API stories.getStats НЕ возвращает демографические данные (age, sex, cities, countries).
// Эти данные доступны только через веб-интерфейс VK для владельцев групп.

export interface DetailedStats {
    // Основные счетчики
    answer: StatCounter;
    bans: StatCounter;
    open_link: StatCounter;
    link_clicks?: StatCounter; // Альтернативное имя для кликов
    replies: StatCounter;
    shares: StatCounter;
    subscribers: StatCounter;
    views: StatCounter;
    likes: StatCounter;
    
    // Охват (дополнительно)
    reach?: StatCounter;
    feed_reach?: StatCounter;
}

// Данные о зрителе истории (с полной детализацией как в списках подписчиков)
export interface StoryViewer {
    user_id: number;
    is_liked: boolean;
    reaction_id?: number;
    is_member?: boolean | null; // true = подписчик, false = виральный, null = не проверялось
    user: {
        id: number;
        first_name: string;
        last_name: string;
        photo_100?: string;
        sex?: number; // 1 - жен, 2 - муж
        bdate?: string; // "1.1.1990"
        city?: string;
        domain?: string;
        has_mobile?: boolean;
        last_seen?: number; // Unix timestamp
        platform?: number; // 1-m.vk, 2-iPhone, 3-iPad, 4-Android, 5-WP, 6-Win10, 7-Web
        is_closed: boolean;
        can_access_closed: boolean;
        deactivated?: string; // 'deleted' | 'banned'
    };
}

// Данные о всех зрителях истории
export interface ViewersData {
    items: StoryViewer[];
    count: number;
    reactions_count: number;
    partial?: boolean;
}

export interface UnifiedStory {
    vk_story_id: number;
    date: number; // Unix timestamp for display order
    type: string;
    preview: string | null;
    video_url: string | null; // URL видеофайла для воспроизведения (только для type='video')
    link: string | null;
    
    // Status flags
    is_active: boolean; // From VK stories.get
    is_automated: boolean; // From DB logs
    
    // DB / Log info
    log_id: string | null;
    vk_post_id: number | null;
    
    // Stats
    views: number; // Basic views
    detailed_stats: DetailedStats | null;
    stats_updated_at: string | null;
    
    // Viewers
    viewers: ViewersData | null;
    viewers_updated_at: string | null;
}
