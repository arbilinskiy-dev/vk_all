/**
 * Страница редактирования конкурса 2.0
 * Копия структуры GeneralContestEditorPage
 * Этап 1: Основные параметры + Пост старт
 */

import React, { useState, useEffect } from 'react';
import { useToast } from '../../../../shared/components/ToastProvider';
import { useProjects } from '../../../../contexts/ProjectsContext';
import { ContestV2, ContestV2FormData } from '../types';
import { ContestV2SettingsTab } from './ContestV2SettingsTab';
import { ContestV2PostStartTab } from './ContestV2PostStartTab';
import { ContestV2ConditionsTab } from './ContestV2ConditionsTab';
import { ContestV2ResultsTab } from './ContestV2ResultsTab';
import { ContestV2Preview } from './ContestV2Preview';
import { getContestV2ById, createContestV2, updateContestV2 } from '../../../../services/api/contestV2.api';
import { SystemPost } from '../../../../shared/types';

interface ContestV2EditorPageProps {
    projectId: string;
    contestId?: string;
    onClose: () => void;
}

type Tab = 'settings' | 'post-start' | 'conditions' | 'results';

const DEFAULT_CONTEST: ContestV2 = {
    id: '',
    project_id: '',
    is_active: true,
    title: 'Новый конкурс',
    description: '',
    start_type: 'new_post',
    start_post_date: new Date().toISOString().split('T')[0],
    start_post_time: '12:00',
    start_post_text: '',
    start_post_images: [],
    winners_count: 1,
    unique_winner: true,
    finish_type: 'date',
    finish_date: new Date().toISOString().split('T')[0],
    finish_time: '12:00',
    finish_duration_days: 7,
    finish_duration_hours: 0,
    template_result_post: 'Поздравляем победителей!\n\n{winners_list}',
    result_post_images: [],
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

const getFormattedDateTime = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return { date, time };
};

export const ContestV2EditorPage: React.FC<ContestV2EditorPageProps> = ({ projectId, contestId, onClose }) => {
    const { projects, allSystemPosts, handleSystemPostUpdate } = useProjects();
    const project = projects.find(p => p.id === projectId);
    const toast = useToast();

    const [contest, setContest] = useState<ContestV2>({ ...DEFAULT_CONTEST, project_id: projectId });
    const [isLoading, setIsLoading] = useState(!!contestId);
    const [isSavingPost, setIsSavingPost] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [initialContest, setInitialContest] = useState<ContestV2 | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('settings');
    // Состояние для сохраненного поста (отображается в настройках после создания)
    const [savedPost, setSavedPost] = useState<SystemPost | null>(null);
    // ID созданного конкурса (нужен для обновления)
    const [createdContestId, setCreatedContestId] = useState<string | null>(contestId || null);
    
    // Функция поиска поста в системных постах проекта
    const findContestPost = (contestIdToFind: string): SystemPost | null => {
        const projectSystemPosts = allSystemPosts[projectId] || [];
        return projectSystemPosts.find(p => 
            p.post_type === 'contest_v2_start' && 
            p.related_id === contestIdToFind
        ) || null;
    };

    useEffect(() => {
        const loadContest = async () => {
            if (contestId) {
                setIsLoading(true);
                try {
                    const loadedContest = await getContestV2ById(contestId);
                    setContest(loadedContest);
                    setInitialContest(loadedContest);
                    
                    // Ищем существующий пост в allSystemPosts
                    const existingPost = findContestPost(contestId);
                    if (existingPost) {
                        setSavedPost(existingPost);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки конкурса:', error);
                    toast.error('Ошибка загрузки конкурса');
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Новое создание
                const now = new Date();
                const start = new Date(now.getTime() + 5 * 60 * 1000); // +5 минут
                const { date: startDate, time: startTime } = getFormattedDateTime(start);

                const draft: ContestV2 = { 
                    ...DEFAULT_CONTEST, 
                    project_id: projectId,
                    start_post_date: startDate,
                    start_post_time: startTime,
                };
                setContest(draft);
                setInitialContest(draft);
                setIsLoading(false);
            }
        };
        
        loadContest();
    }, [contestId, projectId]);
    
    // Обновляем savedPost когда меняются allSystemPosts (после handleSystemPostUpdate)
    useEffect(() => {
        if (createdContestId) {
            const post = findContestPost(createdContestId);
            if (post) {
                setSavedPost(post);
            }
        }
    }, [allSystemPosts, createdContestId, projectId]);

    const getStatusBadge = () => {
        if (contest.is_active) {
            return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 animate-pulse">Активен</span>;
        }
        return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Выключен</span>;
    };

    // Сохранение поста конкурса (создает конкурс + системный пост)
    const handleSavePost = async () => {
        setIsSavingPost(true);
        console.log("Сохранение конкурсного поста:", { createdContestId, contest });
        try {
            // Преобразуем ContestV2 в ContestV2FormData для API
            const formData: ContestV2FormData = {
                is_active: contest.is_active,
                title: contest.title,
                description: contest.description || '',
                start_type: contest.start_type,
                existing_post_link: contest.existing_post_link || '',
                start_post_date: contest.start_post_date || '',
                start_post_time: contest.start_post_time || '',
                start_post_text: contest.start_post_text || '',
                start_post_images: contest.start_post_images || [],
            };
            
            let savedContest: ContestV2;
            
            if (createdContestId) {
                // Обновление существующего конкурса
                savedContest = await updateContestV2(createdContestId, formData);
            } else {
                // Создание нового конкурса
                savedContest = await createContestV2(projectId, formData);
                setCreatedContestId(savedContest.id);
            }
            
            // Обновляем системные посты проекта - это перезагрузит allSystemPosts
            // После этого useEffect с зависимостью [allSystemPosts] обновит savedPost
            await handleSystemPostUpdate([projectId]);
            
            setInitialContest({ ...contest, id: savedContest.id });
            setContest(prev => ({ ...prev, id: savedContest.id }));
            toast.success(createdContestId ? 'Пост обновлен!' : 'Пост создан и добавлен в расписание!');
        } catch (e: any) {
            console.error("Ошибка сохранения:", e);
            toast.error(`Ошибка сохранения: ${e.message || 'Неизвестная ошибка'}`);
        } finally {
            setIsSavingPost(false);
        }
    };

    // Сохранение только настроек конкурса (без создания поста)
    const handleSaveSettings = async () => {
        if (!createdContestId) {
            // Нет ID = создаём новый конкурс
            return handleSavePost();
        }
        
        setIsSavingSettings(true);
        try {
            const formData: ContestV2FormData = {
                is_active: contest.is_active,
                title: contest.title,
                description: contest.description || '',
                start_type: contest.start_type,
                existing_post_link: contest.existing_post_link || '',
                start_post_date: contest.start_post_date || '',
                start_post_time: contest.start_post_time || '',
                start_post_text: contest.start_post_text || '',
                start_post_images: contest.start_post_images || [],
            };
            
            const savedContest = await updateContestV2(createdContestId, formData);
            
            // Обновляем системные посты если есть пост
            if (savedPost) {
                await handleSystemPostUpdate([projectId]);
            }
            
            setInitialContest({ ...contest, id: savedContest.id });
            toast.success('Настройки сохранены!');
        } catch (e: any) {
            console.error("Ошибка сохранения настроек:", e);
            toast.error(`Ошибка: ${e.message || 'Неизвестная ошибка'}`);
        } finally {
            setIsSavingSettings(false);
        }
    };
    
    // Проверка изменений в настройках (название, описание, активность)
    const hasSettingsChanges = initialContest ? (
        contest.title !== initialContest.title ||
        contest.description !== initialContest.description ||
        contest.is_active !== initialContest.is_active
    ) : false;

    if (!project) return null;
    if (isLoading) return <div className="p-10 text-center">Загрузка...</div>;

    const tabs: { id: Tab; label: string }[] = [
        { id: 'settings', label: 'Настройки' },
        { id: 'post-start', label: 'Пост-старт' },
        { id: 'conditions', label: 'Условия' },
        { id: 'results', label: 'Пост итоги' },
    ];

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Конкурс 2.0: <span className="text-indigo-600">{project.name}</span></h1>
                        <p className="text-sm text-gray-500">
                            {contest.title || 'Новый конкурс'}
                        </p>
                    </div>
                    {getStatusBadge()}
                    {savedPost && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Ожидает публикации
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Кнопка сохранения настроек - показываем если есть изменения */}
                    {hasSettingsChanges && (
                        <button 
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSavingSettings ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Сохранение...
                                </>
                            ) : (
                                'Сохранить настройки'
                            )}
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                        Закрыть
                    </button>
                </div>
            </header>
            
            {/* Tabs */}
            <div className="px-6 pt-4 flex-shrink-0 flex justify-between items-start gap-4">
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg overflow-x-auto custom-scrollbar max-w-full">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content (Split) */}
            <main className="flex-grow overflow-hidden flex flex-col mt-4">
                {activeTab === 'settings' && (
                    <div className="flex flex-col lg:flex-row flex-grow overflow-hidden h-full">
                        <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-6 bg-white border-r border-gray-200">
                            <div className="space-y-8">
                                <ContestV2SettingsTab 
                                    contest={contest} 
                                    onChange={(field, val) => setContest(prev => ({ ...prev, [field]: val }))}
                                    project={project}
                                    savedPost={savedPost}
                                />
                            </div>
                        </div>
                        <ContestV2Preview contest={contest} project={project} />
                    </div>
                )}
                {activeTab === 'post-start' && (
                    <div className="flex flex-col lg:flex-row flex-grow overflow-hidden h-full">
                        <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-6 bg-white border-r border-gray-200">
                            <div className="space-y-8">
                                <ContestV2PostStartTab 
                                    contest={contest} 
                                    onChange={(field, val) => setContest(prev => ({ ...prev, [field]: val }))}
                                    project={project}
                                    onSavePost={handleSavePost}
                                    isSavingPost={isSavingPost}
                                    savedPost={savedPost}
                                />
                            </div>
                        </div>
                        <ContestV2Preview contest={contest} project={project} />
                    </div>
                )}
                {activeTab === 'conditions' && (
                    <div className="flex flex-col lg:flex-row flex-grow overflow-hidden h-full">
                        <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-6 bg-white border-r border-gray-200">
                            <div className="space-y-8">
                                <ContestV2ConditionsTab 
                                    contest={contest} 
                                    onChange={(field, val) => setContest(prev => ({ ...prev, [field]: val }))}
                                />
                            </div>
                        </div>
                        <ContestV2Preview contest={contest} project={project} />
                    </div>
                )}
                {activeTab === 'results' && (
                    <div className="flex flex-col lg:flex-row flex-grow overflow-hidden h-full">
                        <div className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-6 bg-white border-r border-gray-200">
                            <div className="space-y-8">
                                <ContestV2ResultsTab 
                                    contest={contest} 
                                    onChange={(field, val) => setContest(prev => ({ ...prev, [field]: val }))}
                                    project={project}
                                />
                            </div>
                        </div>
                        <ContestV2Preview contest={contest} project={project} />
                    </div>
                )}
            </main>
        </div>
    );
};
