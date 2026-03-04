// =====================================================================
// ListsStatsMocks.tsx — Х
// еэкспорт всех mock-компонентов статистики списков.
// огика вынесена в подфайлы, контракт импорта  изменён.
// =====================================================================

// бщие вспомогательные компоненты
export { MockStatCard, MockValueWithPercent, MockProgressBar } from './ListsStatsMocks_Shared';

// арточки статистики пользователей
export {
    MockQualityCard,
    MockMailingStatusCard,
    MockLifetimeCard,
    MockLastContactCard,
    MockDemographicsCard,
    MockPlatformsCard,
    MockOnlineCard,
} from './ListsStatsMocks_UserCards';

// рафики и диаграммы (столбчатые, круговые, линейный)
export {
    MockAgeCard,
    MockBirthdayCard,
    MockGeoCard,
    MockLineChart,
} from './ListsStatsMocks_Charts';

// Статистика постов и иконки метрик
export {
    MockMetricBlock,
    MockTopPostCard,
    ViewsIcon,
    LikesIcon,
    CommentsIcon,
    RepostsIcon,
} from './ListsStatsMocks_PostStats';
