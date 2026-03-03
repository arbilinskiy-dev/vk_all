// Типы для структуры оглавления Центра обучения

export interface TocItem {
    title: string;
    path: string; // Уникальный путь/идентификатор
    children?: TocItem[];
}
