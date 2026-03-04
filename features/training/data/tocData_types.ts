// Типы для данных оглавления центра обучения

export interface TocItem {
    title: string;
    path: string; // Уникальный путь/идентификатор
    children?: TocItem[];
}
