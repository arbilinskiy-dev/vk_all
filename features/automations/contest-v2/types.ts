/**
 * Типы для Конкурс 2.0
 * Этап 1: Создание и публикация стартового поста
 */

import { PhotoAttachment } from '../../../shared/types';

// Реэкспорт типов условий из general-contests
export type { ConditionType, ContestCondition, ConditionGroup } from '../general-contests/types';

// Тип старта конкурса: новый пост или существующий
export type StartType = 'new_post' | 'existing_post';

// Статус конкурса
export type ContestV2Status = 
    | 'draft'           // Черновик (создан, но не активирован)
    | 'scheduled'       // Запланирован (пост ожидает публикации)
    | 'active'          // Активен (пост опубликован, сбор участников)
    | 'finished'        // Завершен
    | 'archived';       // В архиве

// Основная модель конкурса для Этапа 1
export interface ContestV2 {
    id: string;
    project_id: string;
    
    // === Основные параметры ===
    is_active: boolean;              // Активность механики (toggle)
    title: string;                   // Название конкурса (внутреннее)
    description?: string;            // Описание конкурса (опционально)
    
    // === Конкурсный пост (старт) ===
    start_type: StartType;           // Создать новый / Выбрать существующий
    existing_post_link?: string;     // Ссылка на существующий пост (если start_type='existing_post')
    
    // Данные нового поста (если start_type='new_post')
    start_post_date?: string;        // Дата публикации (ISO)
    start_post_time?: string;        // Время публикации (HH:mm)
    start_post_text?: string;        // Текст поста
    start_post_images?: PhotoAttachment[]; // Изображения поста
    
    // === Условия участия ===
    conditions_schema?: import('../general-contests/types').ConditionGroup[];
    
    // === Победители ===
    winners_count: number;           // Количество победителей
    unique_winner: boolean;          // 1 приз в 1 руки
    
    // === Подведение итогов ===
    finish_type: 'duration' | 'date'; // Через время / В точную дату
    finish_duration_days?: number;    // Дней до итогов (если finish_type='duration')
    finish_duration_hours?: number;   // Часов до итогов (если finish_type='duration')
    finish_date?: string;             // Дата итогов (если finish_type='date')
    finish_time?: string;             // Время итогов (если finish_type='date')
    
    // === Пост итогов ===
    template_result_post?: string;    // Шаблон текста поста итогов
    result_post_images?: PhotoAttachment[]; // Изображения поста итогов
    
    // === Служебные поля ===
    status: ContestV2Status;
    vk_start_post_id?: number;       // ID опубликованного поста в VK
    created_at: string;
    updated_at: string;
}

// Форма создания/редактирования конкурса (Этап 1)
export interface ContestV2FormData {
    is_active: boolean;
    title: string;
    description: string;
    
    start_type: StartType;
    existing_post_link: string;
    
    start_post_date: string;
    start_post_time: string;
    start_post_text: string;
    start_post_images: PhotoAttachment[];
}

// Дефолтные значения для формы
export const getDefaultContestV2FormData = (): ContestV2FormData => ({
    is_active: true,
    title: 'Новый конкурс',
    description: '',
    
    start_type: 'new_post',
    existing_post_link: '',
    
    start_post_date: new Date().toISOString().split('T')[0], // Сегодня
    start_post_time: '12:00',
    start_post_text: '',
    start_post_images: [],
});

// Конвертация ContestV2 -> ContestV2FormData
export const contestToFormData = (contest: ContestV2): ContestV2FormData => ({
    is_active: contest.is_active,
    title: contest.title,
    description: contest.description || '',
    
    start_type: contest.start_type,
    existing_post_link: contest.existing_post_link || '',
    
    start_post_date: contest.start_post_date || new Date().toISOString().split('T')[0],
    start_post_time: contest.start_post_time || '12:00',
    start_post_text: contest.start_post_text || '',
    start_post_images: contest.start_post_images || [],
});
