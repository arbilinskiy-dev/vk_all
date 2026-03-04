// =====================================================================
// PostModalMocks_MediaEditing.tsx — ХАБ (реэкспорт из подмодулей)
// Оригинальный файл декомпозирован на 3 самостоятельных модуля:
//   - Upload    → MockMediaUploadMethods, MockUploadStates, MockPhotoUploadStates
//   - Grid      → MockMediaGrid, MockCompactMode, MockGridSizeSwitch
//   - VKGallery → MockVKGallery, MockDragDropOverlay, MockCreateAlbumModal
// =====================================================================

// Загрузка медиафайлов (способы загрузки, состояния, статусы)
export {
    MockMediaUploadMethods,
    MockUploadStates,
    MockPhotoUploadStates,
} from './PostModalMocks_MediaEditing_Upload';

// Сетки и отображение медиа (грид, компакт, переключатель размера)
export {
    MockMediaGrid,
    MockCompactMode,
    MockGridSizeSwitch,
} from './PostModalMocks_MediaEditing_Grid';

// VK-галерея, альбомы, drag-drop, модалка создания альбома
export {
    MockVKGallery,
    MockDragDropOverlay,
    MockCreateAlbumModal,
} from './PostModalMocks_MediaEditing_VKGallery';
