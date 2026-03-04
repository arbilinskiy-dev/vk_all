import type { MockAlbum, MockProduct } from './ProductsMocks.types';

// =====================================================================
// Экспортируемые mock-данные для раздела "Товары"
// =====================================================================

/** Мок-подборки */
export const mockAlbums: MockAlbum[] = [
    { id: 1, title: 'Новинки', count: 12 },
    { id: 2, title: 'Акции', count: 8 },
    { id: 3, title: 'Хиты продаж', count: 15 }
];

/** Мок-товары */
export const mockProducts: MockProduct[] = [
    {
        id: 1,
        title: 'Футболка с принтом',
        description: 'Яркая футболка из хлопка с авторским принтом',
        price: 1200,
        oldPrice: 1500,
        photo: 'https://picsum.photos/seed/product1/200/200',
        album: 'Новинки',
        category: 'Одежда',
        sku: 'TSH-001'
    },
    {
        id: 2,
        title: 'Джинсы классические',
        description: 'Удобные джинсы прямого кроя, универсальная модель на каждый день',
        price: 2800,
        photo: 'https://picsum.photos/seed/product2/200/200',
        album: 'Хиты продаж',
        category: 'Одежда',
        sku: 'JNS-045'
    },
    {
        id: 3,
        title: 'Кроссовки спортивные',
        description: 'Легкие кроссовки для бега и фитнеса',
        price: 4500,
        oldPrice: 5200,
        photo: 'https://picsum.photos/seed/product3/200/200',
        album: 'Акции',
        category: 'Обувь',
        sku: 'SHO-123'
    }
];
