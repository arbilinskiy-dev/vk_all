/**
 * Редактор конкурса 2.0
 * Этап 1: Основные параметры + Пост старт
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ContestV2, ContestV2FormData, getDefaultContestV2FormData, contestToFormData, StartType } from '../types';
import { PhotoAttachment } from '../../../../shared/types';

interface ContestV2EditorProps {
    projectId: string;
    contest?: ContestV2;
    isNew: boolean;
    onSave: (contest: Partial<ContestV2>) => void;
    onCancel: () => void;
    setNavigationBlocker?: React.Dispatch<React.SetStateAction<(() => boolean) | null>>;
}

export const ContestV2Editor: React.FC<ContestV2EditorProps> = ({
    projectId,
    contest,
    isNew,
    onSave,
    onCancel,
    setNavigationBlocker,
}) => {
    // Инициализация формы
    const [formData, setFormData] = useState<ContestV2FormData>(
        contest ? contestToFormData(contest) : getDefaultContestV2FormData()
    );
    
    // Флаг изменений для блокировки навигации
    const [hasChanges, setHasChanges] = useState(false);
    
    // Устанавливаем блокировщик навигации
    useEffect(() => {
        if (setNavigationBlocker) {
            setNavigationBlocker(() => () => hasChanges);
        }
        return () => {
            if (setNavigationBlocker) {
                setNavigationBlocker(null);
            }
        };
    }, [hasChanges, setNavigationBlocker]);
    
    // Обновление поля формы
    const updateField = useCallback(<K extends keyof ContestV2FormData>(
        field: K, 
        value: ContestV2FormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    }, []);
    
    // Обработчик сохранения
    const handleSave = () => {
        onSave({
            ...formData,
            project_id: projectId,
        });
        setHasChanges(false);
    };
    
    // Обработчик отмены
    const handleCancel = () => {
        if (hasChanges) {
            if (window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти?')) {
                onCancel();
            }
        } else {
            onCancel();
        }
    };
    
    // Обработчик загрузки изображений (временный - просто для демо)
    const handleImageUpload = () => {
        // TODO: Реализовать загрузку изображений
        alert('Загрузка изображений будет реализована позже');
    };
    
    // Обработчик добавления фото из фотоальбома
    const handleAddFromAlbum = () => {
        // TODO: Реализовать выбор из альбома
        alert('Выбор из альбома будет реализован позже');
    };
    
    // Удаление изображения
    const handleRemoveImage = (index: number) => {
        const newImages = [...formData.start_post_images];
        newImages.splice(index, 1);
        updateField('start_post_images', newImages);
    };
    
    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Заголовок с кнопками действий */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Назад к списку"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {isNew ? 'Создание конкурса' : 'Редактирование конкурса'}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Этап 1: Настройка стартового поста
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
            
            {/* Контент - две колонки */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Левая колонка - Форма настроек */}
                    <div className="space-y-6">
                        {/* Секция: Основные параметры */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Основные параметры
                            </h2>
                            
                            {/* Активность механики */}
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div>
                                    <div className="font-medium text-gray-900 text-sm">Активность механики</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Включите, чтобы запустить сбор, обработку участников и публикацию постов.
                                    </div>
                                </div>
                                <button
                                    onClick={() => updateField('is_active', !formData.is_active)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        formData.is_active ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            formData.is_active ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                            
                            {/* Название конкурса */}
                            <div className="py-3 border-b border-gray-100">
                                <label className="block text-sm font-medium text-amber-600 mb-1.5">
                                    Название конкурса (внутреннее)
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    placeholder="Например: Новогодний розыгрыш 2026"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            
                            {/* Описание конкурса */}
                            <div className="pt-3">
                                <label className="block text-sm font-medium text-amber-600 mb-1.5">
                                    Описание конкурса (опционально)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="Краткое описание механики или приза"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                />
                            </div>
                        </div>
                        
                        {/* Секция: Конкурсный пост (старт) */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Конкурсный пост (старт)
                            </h2>
                            
                            {/* Переключатель типа старта */}
                            <div className="flex rounded-lg border border-gray-200 p-1 mb-4">
                                <button
                                    onClick={() => updateField('start_type', 'new_post')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        formData.start_type === 'new_post'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Создать новый пост
                                </button>
                                <button
                                    onClick={() => updateField('start_type', 'existing_post')}
                                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                        formData.start_type === 'existing_post'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    Выбрать существующий
                                </button>
                            </div>
                            
                            {formData.start_type === 'new_post' ? (
                                <>
                                    {/* Дата и время публикации */}
                                    <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                                        <span className="text-sm text-gray-700 font-medium">Публикация:</span>
                                        <input
                                            type="date"
                                            value={formData.start_post_date}
                                            onChange={(e) => updateField('start_post_date', e.target.value)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <input
                                            type="time"
                                            value={formData.start_post_time}
                                            onChange={(e) => updateField('start_post_time', e.target.value)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    
                                    {/* Текст поста */}
                                    <div className="py-3 border-b border-gray-100">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-sm font-medium text-amber-600">
                                                Текст поста
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Прикрепить файл">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                </button>
                                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Добавить эмодзи">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            value={formData.start_post_text}
                                            onChange={(e) => updateField('start_post_text', e.target.value)}
                                            placeholder="Введите текст шаблона..."
                                            rows={5}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>
                                    
                                    {/* Изображения */}
                                    <div className="pt-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Изображения ({formData.start_post_images.length})
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleImageUpload}
                                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Загрузить
                                                </button>
                                                <button
                                                    onClick={handleAddFromAlbum}
                                                    className="px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                                                >
                                                    Добавить фото
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {formData.start_post_images.length > 0 ? (
                                            <div className="grid grid-cols-4 gap-2">
                                                {formData.start_post_images.map((img, index) => (
                                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                        <img 
                                                            src={img.url} 
                                                            alt="" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                                <div className="text-gray-400 text-sm">
                                                    Изображения не добавлены
                                                </div>
                                                <div className="text-gray-300 text-xs mt-1">
                                                    Перетащите файлы сюда или используйте кнопки выше
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Ввод ссылки на существующий пост */
                                <div className="py-3">
                                    <label className="block text-sm font-medium text-amber-600 mb-1.5">
                                        Ссылка на пост
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.existing_post_link}
                                        onChange={(e) => updateField('existing_post_link', e.target.value)}
                                        placeholder="https://vk.com/wall-123456789_12345 или https://vk.ru/wall-..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1.5">
                                        Вставьте ссылку на существующий пост в вашем сообществе
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Правая колонка - Превью */}
                    <div className="lg:sticky lg:top-6 self-start">
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Превью
                            </h2>
                            
                            {/* Секция 1: Старт конкурса */}
                            <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    1. Старт конкурса
                                </div>
                                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {formData.start_type === 'new_post' ? (
                                        <div className="flex items-start gap-3">
                                            {/* Аватар сообщества (заглушка) */}
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                VK
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-gray-900">Ваше сообщество</span>
                                                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formData.start_post_date} в {formData.start_post_time}
                                                </div>
                                                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                                                    {formData.start_post_text || 'Текст стартового поста...'}
                                                </div>
                                                
                                                {/* Превью изображений */}
                                                {formData.start_post_images.length > 0 && (
                                                    <div className="mt-2 grid grid-cols-3 gap-1">
                                                        {formData.start_post_images.slice(0, 3).map((img, index) => (
                                                            <div key={index} className="aspect-square rounded overflow-hidden bg-gray-200">
                                                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* Статистика поста */}
                                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                        36
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                        12
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                        4
                                                    </span>
                                                    <span className="ml-auto flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        1.9K
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 text-sm py-4">
                                            Будет использован существующий пост
                                            {formData.existing_post_link && (
                                                <div className="mt-2 text-xs text-indigo-600 break-all">
                                                    {formData.existing_post_link}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Секция 2: Объявление итогов (заглушка) */}
                            <div className="mb-4 opacity-50">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    2. Объявление итогов
                                </div>
                                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
                                    Будет доступно на следующем этапе
                                </div>
                            </div>
                            
                            {/* Секция 3: Вручение приза (заглушка) */}
                            <div className="opacity-50">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    3. Вручение приза
                                </div>
                                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 text-sm">
                                    Будет доступно на следующем этапе
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
