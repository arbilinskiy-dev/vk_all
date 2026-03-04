// =====================================================================
// ProductsMocks — ХАБ-файл
// Реэкспортирует все mock-компоненты и данные для раздела "Товары".
// Логика вынесена в подфайлы ProductsMocks.*.tsx / .ts
// =====================================================================

// Типы
export type { MockProduct, MockAlbum, MockCategory } from './ProductsMocks.types';

// Компоненты
export { MockProductsHeader } from './ProductsMocks.Header';
export { MockAlbumFilters } from './ProductsMocks.AlbumFilters';
export { MockProductRow } from './ProductsMocks.ProductRow';
export { MockDiffViewer } from './ProductsMocks.DiffViewer';
export { MockSaveResultsModal } from './ProductsMocks.SaveResultsModal';

// Данные
export { mockAlbums, mockProducts } from './ProductsMocks.data';
