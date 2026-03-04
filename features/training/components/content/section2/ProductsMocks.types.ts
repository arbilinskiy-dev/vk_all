// =====================================================================
// Типы и интерфейсы для mock-компонентов раздела "Товары"
// =====================================================================

/** Мок-товар */
export interface MockProduct {
    id: number;
    title: string;
    description: string;
    price: number;
    oldPrice?: number;
    photo: string;
    album?: string;
    category?: string;
    sku?: string;
}

/** Мок-подборка */
export interface MockAlbum {
    id: number;
    title: string;
    count: number;
}

/** Мок-категория */
export interface MockCategory {
    id: number;
    name: string;
    section: string;
}
