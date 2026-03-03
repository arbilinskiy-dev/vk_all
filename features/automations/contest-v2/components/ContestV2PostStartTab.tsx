/**
 * Вкладка "Пост-старт" для редактора Конкурс 2.0
 * Содержит настройки создания стартового поста конкурса
 * Копия дизайна из general-contests/SettingsTab
 */

import React, { useMemo, useState } from 'react';
import { ContestV2 } from '../types';
import { Project, SystemPost } from '../../../../shared/types';
import { PostMediaSection } from '../../../posts/components/modals/PostMediaSection';
import { RichTemplateEditor } from '../../reviews-contest/components/settings/controls/RichTemplateEditor';
import { CustomDatePicker, CustomTimePicker } from '../../../posts/components/modals/PostDateTimePicker';

interface ContestV2PostStartTabProps {
    contest: ContestV2;
    onChange: (field: keyof ContestV2, value: any) => void;
    project: Project;
    onSavePost: () => void;
    isSavingPost: boolean;
    savedPost: SystemPost | null;
}

export const ContestV2PostStartTab: React.FC<ContestV2PostStartTabProps> = ({
    contest,
    onChange,
    project,
    onSavePost,
    isSavingPost,
    savedPost
}) => {
    // Можно ли сохранить пост
    const canSavePost = contest.start_type === 'new_post'
        ? !!(contest.start_post_date && contest.start_post_time && contest.start_post_text?.trim())
        : !!(contest.existing_post_link?.trim());

    // Проверка изменений в посте (относительно сохраненного поста)
    const hasPostChanges = useMemo(() => {
        if (!savedPost) return true; // Нет поста = можно создать
        
        // Проверяем валидность даты
        const savedDate = new Date(savedPost.publication_date);
        if (isNaN(savedDate.getTime())) return true; // Невалидная дата = считаем что есть изменения
        
        // Сравниваем текущие значения с сохраненным постом
        const savedDateStr = savedDate.toISOString().split('T')[0];
        const savedTimeStr = `${String(savedDate.getHours()).padStart(2, '0')}:${String(savedDate.getMinutes()).padStart(2, '0')}`;
        
        const dateChanged = contest.start_post_date !== savedDateStr;
        const timeChanged = contest.start_post_time !== savedTimeStr;
        const textChanged = contest.start_post_text !== savedPost.text;
        const imagesChanged = JSON.stringify(contest.start_post_images || []) !== JSON.stringify(savedPost.images || []);
        
        return dateChanged || timeChanged || textChanged || imagesChanged;
    }, [savedPost, contest.start_post_date, contest.start_post_time, contest.start_post_text, contest.start_post_images]);

    // Статус опубликованного поста
    const isPublished = contest.status === 'active' && contest.vk_start_post_id;

    // Режим редактирования опубликованного поста
    const [isEditingPublished, setIsEditingPublished] = useState(false);

    return (
        <div className="space-y-8">
            {/* Секция: Конкурсный пост (старт) */}
            <div className="space-y-6 pb-6 last:pb-0">
                <h3 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">Конкурсный пост (старт)</h3>
                
                {/* Тумблер выбора сценария */}
                <div className={`flex bg-gray-100 p-1 rounded-lg gap-1 mb-4 ${isPublished ? 'opacity-50 pointer-events-none' : ''}`}>
                    <button
                        type="button"
                        onClick={() => onChange('start_type', 'new_post')}
                        disabled={isPublished}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            contest.start_type === 'new_post' || !contest.start_type
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Создать новый пост
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange('start_type', 'existing_post')}
                        disabled={isPublished}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                            contest.start_type === 'existing_post'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Выбрать существующий
                    </button>
                </div>

                {isPublished ? (
                    // Конкурс опубликован - показываем информацию о посте с возможностью редактирования
                    <div className="space-y-4">
                        {/* Информационный блок */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3 text-gray-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-sm font-medium">Пост опубликован</span>
                            </div>
                            {contest.start_type === 'existing_post' ? (
                                <p className="text-sm text-gray-600">Используется существующий пост</p>
                            ) : (
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><span className="font-medium">Дата:</span> {contest.start_post_date} в {contest.start_post_time}</p>
                                    <p><span className="font-medium">Текст:</span> {contest.start_post_text?.substring(0, 100)}{contest.start_post_text && contest.start_post_text.length > 100 ? '...' : ''}</p>
                                </div>
                            )}
                        </div>

                        {!isEditingPublished ? (
                            // Предупреждение и кнопка редактирования
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium text-amber-800 mb-2">Важно!</p>
                                        <p className="text-sm text-amber-700 mb-3">
                                            Мы <strong>не рекомендуем</strong> менять условия конкурса после его публикации — это запрещено правилами ВКонтакте. 
                                            Однако, если вам нужно отредактировать что-то другое (исправить опечатку, обновить изображение), 
                                            вы можете приступить к редактированию.
                                        </p>
                                        <button
                                            onClick={() => setIsEditingPublished(true)}
                                            className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Редактировать пост
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Форма редактирования опубликованного поста
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span className="text-sm font-medium text-amber-800">Режим редактирования опубликованного поста</span>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingPublished(false)}
                                        className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                                    >
                                        Отмена
                                    </button>
                                </div>

                                {/* Текст поста */}
                                <RichTemplateEditor 
                                    label="Текст поста" 
                                    value={contest.start_post_text || ''}
                                    onChange={(val) => onChange('start_post_text', val)}
                                    project={project}
                                    rows={6}
                                />
                                
                                {/* Изображения */}
                                <PostMediaSection 
                                    mode="edit"
                                    projectId={project.id}
                                    editedImages={contest.start_post_images || []}
                                    onImagesChange={(imgs) => onChange('start_post_images', typeof imgs === 'function' ? imgs(contest.start_post_images || []) : imgs)}
                                    onUploadStateChange={() => {}}
                                    postAttachments={[]}
                                    editedAttachments={[]}
                                    onAttachmentsChange={() => {}}
                                    collapsible={true}
                                />
                                
                                {/* Кнопки сохранения */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsEditingPublished(false)}
                                        className="flex-1 px-4 py-3 text-sm font-medium rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSavePost();
                                            // Не закрываем форму сразу - закроем после успешного сохранения
                                        }}
                                        disabled={isSavingPost}
                                        className="flex-1 px-4 py-3 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSavingPost ? (
                                            <div className="loader border-white border-t-transparent h-4 w-4"></div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Сохранить изменения
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : contest.start_type === 'existing_post' ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Режим существующего поста</p>
                                <p>Механика привяжется к уже опубликованному посту. Сбор участников начнется сразу после сохранения и активации.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-800 mb-1">Ссылка на пост ВКонтакте</label>
                            <input 
                                type="text"
                                value={contest.existing_post_link || ''}
                                onChange={e => onChange('existing_post_link', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                                placeholder="https://vk.com/wall-xxxxxx_yyyyyy или vk.ru/wall-..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Скопируйте ссылку на пост из браузера или мобильного приложения.</p>
                        </div>
                    </div>
                ) : (
                
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Статус сохраненного поста */}
                        {savedPost && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-grow">
                                    <span className="text-sm text-emerald-800 font-medium">Пост запланирован</span>
                                    <p className="text-xs text-emerald-600">
                                        {(() => {
                                            const date = new Date(savedPost.publication_date);
                                            if (isNaN(date.getTime())) return 'Дата не указана';
                                            return date.toLocaleString('ru-RU', {
                                                day: 'numeric',
                                                month: 'long',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                        })()}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {/* Дата и время публикации */}
                        <div className="flex gap-4 items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="text-sm font-medium text-indigo-900">Публикация:</span>
                            <CustomDatePicker 
                                value={contest.start_post_date || ''} 
                                onChange={(v) => onChange('start_post_date', v)} 
                            />
                            <CustomTimePicker 
                                value={contest.start_post_time || '12:00'} 
                                onChange={(v) => onChange('start_post_time', v)} 
                                className="w-24" 
                            />
                        </div>

                        {/* Текст поста */}
                        <RichTemplateEditor 
                            label="Текст поста" 
                            value={contest.start_post_text || ''}
                            onChange={(val) => onChange('start_post_text', val)}
                            project={project}
                            rows={6}
                        />
                        
                        {/* Изображения */}
                        <PostMediaSection 
                            mode="edit"
                            projectId={project.id}
                            editedImages={contest.start_post_images || []}
                            onImagesChange={(imgs) => onChange('start_post_images', typeof imgs === 'function' ? imgs(contest.start_post_images || []) : imgs)}
                            onUploadStateChange={() => {}}
                            postAttachments={[]}
                            editedAttachments={[]}
                            onAttachmentsChange={() => {}}
                            collapsible={true}
                        />
                        
                        {/* Кнопка сохранения/обновления поста */}
                        <div className="mt-6">
                            {savedPost ? (
                                // Пост уже создан - показываем кнопку обновления
                                <div className="space-y-3">
                                    {hasPostChanges && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span className="text-sm text-amber-800">Есть несохраненные изменения в посте</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={onSavePost}
                                        disabled={isSavingPost || !canSavePost || !hasPostChanges}
                                        className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSavingPost ? (
                                            <div className="loader border-white border-t-transparent h-4 w-4"></div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                                {hasPostChanges ? 'Сохранить изменения' : 'Изменений нет'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                // Пост еще не создан - показываем кнопку создания
                                <>
                                    <button
                                        onClick={onSavePost}
                                        disabled={isSavingPost || !canSavePost}
                                        className="w-full px-6 py-3 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSavingPost ? (
                                            <div className="loader border-white border-t-transparent h-4 w-4"></div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                </svg>
                                                Сохранить и запланировать пост
                                            </>
                                        )}
                                    </button>
                                    {!canSavePost && (
                                        <p className="text-xs text-amber-600 text-center mt-2">
                                            Заполните дату, время и текст поста для сохранения
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
