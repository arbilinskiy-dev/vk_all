// =====================================================================
// ХАБ-ФАЙЛ: МОКИ ПОСТОВ ДЛЯ ЦЕНТРА ОБУЧЕНИЯ
// Декомпозирован на подмодули — реэкспортирует всё для обратной совместимости
// =====================================================================

// Типы и моковые данные
export type { MockPostRowProps, MockPost } from './ListsMocks_Posts_Types';
export { mockPosts } from './ListsMocks_Posts_Types';

// Базовая таблица постов (раздел 3.2.1)
export { MockPostRow, MockPostsTable } from './ListsMocks_Posts_BasicTable';

// Аннотированная таблица — анатомия UI (раздел 3.2.4)
export { PostsTableAnatomy } from './ListsMocks_Posts_Anatomy';

// Таблица постов с данными, строка поста, состояния (раздел 3.2.4)
export { PostRow, PostsTableDemo, PostsTableStatesDemo } from './ListsMocks_Posts_TableDemo';

// Интерактивный поиск постов
export { PostsSearchDemo } from './ListsMocks_Posts_Search';

// Демонстрация бесконечной прокрутки
export { PostsInfiniteScrollDemo } from './ListsMocks_Posts_InfiniteScroll';
