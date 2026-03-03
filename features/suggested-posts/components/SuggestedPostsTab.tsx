import React from 'react';
import { Project, SuggestedPost } from '../../../shared/types';
import { useSuggestedPostsManager } from '../hooks/useSuggestedPostsManager';
import { PostCardSkeleton } from './PostCardSkeleton';
import { EmptyState } from './EmptyState';
import { SuggestedPostsLayout } from './SuggestedPostsLayout';
import { ConfirmationModal } from '../../../shared/components/modals/ConfirmationModal';

interface SuggestedPostsTabProps {
    project: Project;
    cachedPosts: SuggestedPost[] | undefined;
    onPostsLoaded: (posts: SuggestedPost[]) => void;
    permissionErrorMessage?: string | null;
    emptySuggestedMessage?: string | null;
}

export const SuggestedPostsTab: React.FC<SuggestedPostsTabProps> = ({
    project,
    cachedPosts,
    onPostsLoaded,
    permissionErrorMessage,
    emptySuggestedMessage
}) => {
    const { state, actions } = useSuggestedPostsManager({
        project,
        cachedPosts,
        onPostsLoaded,
    });

    const {
        posts,
        isLoading,
        error,
        selectedPost,
        correctedText,
        isCorrecting,
        confirmation,
        bulkResults,
        isBulkCorrecting,
    } = state;

    const {
        handleRefresh,
        handleSelectPost,
        handleCopyToClipboard,
        handleCancelConfirmation,
        handleBulkCorrection,
        handleUpdateBulkText,
    } = actions;

    const renderContent = () => {
        if (isLoading && posts.length === 0 && !permissionErrorMessage && !emptySuggestedMessage) {
            return (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <PostCardSkeleton key={i} />
                    ))}
                </div>
            );
        }

        if (error && !permissionErrorMessage) {
            return (
                <EmptyState
                    icon="error"
                    title="Ошибка загрузки"
                    message={error}
                />
            );
        }

        if (posts.length === 0 && !isLoading && !permissionErrorMessage && !emptySuggestedMessage) {
            return (
                <EmptyState
                    icon="empty"
                    title="Нет предложенных постов"
                    message="В этом проекте нет постов для модерации. Попробуйте обновить данные или проверьте настройки."
                />
            );
        }
        
        return (
            <SuggestedPostsLayout
                posts={posts}
                project={project}
                selectedPostId={selectedPost?.id || null}
                correctedText={correctedText}
                isCorrecting={isCorrecting}
                onSelectPost={handleSelectPost}
                onCopyToClipboard={handleCopyToClipboard}
                bulkResults={bulkResults}
                isBulkCorrecting={isBulkCorrecting}
                onUpdateBulkText={handleUpdateBulkText}
            />
        );
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            <header className="flex-shrink-0 bg-white shadow-sm z-10">
                 <div className="p-4 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-800">Предложенные посты</h1>
                    <p className="text-sm text-gray-500">Посты, предложенные пользователями в сообществе "{project.name}"</p>
                </div>
                 <div className="p-4 border-b border-gray-200">
                     <div className="flex items-center gap-x-4">
                         <button
                            onClick={() => handleRefresh()}
                            disabled={isLoading || isBulkCorrecting}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait transition-colors shadow-sm"
                        >
                            {isLoading ? <div className="loader h-4 w-4 mr-2"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" /></svg>}
                            <span>Обновить</span>
                        </button>
                        {posts.length > 0 && !permissionErrorMessage && (
                            <button
                                onClick={handleBulkCorrection}
                                disabled={isBulkCorrecting || isCorrecting || isLoading}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-wait transition-colors shadow-sm"
                            >
                                {isBulkCorrecting ? (
                                    <div className="loader h-4 w-4 mr-2" style={{ borderTopColor: '#fff' }}></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                )}
                                <span>{isBulkCorrecting ? 'Редактирование...' : `Отредактировать все (${posts.length})`}</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <main className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                {permissionErrorMessage && (
                    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-800 p-4 mb-4 rounded-r-lg shadow" role="alert">
                        <div className="flex">
                            <div className="py-1">
                                <svg className="h-6 w-6 text-amber-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold">Нет авторизованных аккаунтов</p>
                                <p className="text-sm">Для загрузки и публикации постов необходимо добавить хотя бы одну страницу ВКонтакте, которая является администратором в этом сообществе. После добавления нажмите «Обновить».</p>
                                <details className="mt-3">
                                    <summary className="text-sm font-semibold cursor-pointer hover:text-amber-900 select-none">Подробнее — как это исправить</summary>
                                    <div className="mt-2 text-sm space-y-2 bg-amber-50 rounded-md p-3 border border-amber-200">
                                        <p className="font-semibold">Шаг 1: Откройте настройки</p>
                                        <p>Перейдите в раздел <strong>⚙️ Настройки</strong> (иконка шестерёнки в левом меню), затем откройте вкладку <strong>«Системные страницы»</strong>.</p>
                                        
                                        <p className="font-semibold">Шаг 2: Добавьте страницу</p>
                                        <p>Нажмите кнопку <strong>«Добавить»</strong>. В открывшемся окне вставьте ссылку на профиль ВКонтакте (например, <code className="bg-amber-200 px-1 rounded text-xs">https://vk.com/id12345</code> или <code className="bg-amber-200 px-1 rounded text-xs">https://vk.ru/id12345</code>), который является <strong>администратором</strong> нужного сообщества. Можно добавить несколько ссылок — по одной на каждой строке.</p>
                                        
                                        <p className="font-semibold">Шаг 3: Авторизуйте страницу</p>
                                        <p>После добавления найдите нужный аккаунт в таблице и нажмите на иконку <strong>🔑 (ключ)</strong> справа в строке аккаунта.</p>
                                        <p>В открывшемся окне авторизации:</p>
                                        <ol className="list-decimal list-inside ml-2 space-y-1">
                                            <li><strong>Выберите приложение</strong> — по умолчанию подходит «Android (Офиц.)», но можно выбрать другое или указать своё.</li>
                                            <li>Нажмите <strong>«Получить токен (открыть VK)»</strong> — откроется новая вкладка ВКонтакте.</li>
                                            <li><strong>Важно:</strong> убедитесь, что в браузере вы авторизованы именно под той страницей, которую добавляете.</li>
                                            <li>Разрешите доступ приложению. После этого вы увидите страницу с предупреждением «Пожалуйста, не копируйте данные…».</li>
                                            <li>Скопируйте <strong>всю ссылку</strong> из адресной строки браузера и вставьте её в поле «Вставьте ссылку» в модальном окне.</li>
                                            <li>Нажмите <strong>«Сохранить»</strong>.</li>
                                        </ol>
                                        
                                        <p className="font-semibold">Шаг 4: Проверьте и обновите</p>
                                        <p>После авторизации статус аккаунта должен измениться на <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Активен</span>. Вернитесь сюда и нажмите <strong>«Обновить»</strong>.</p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                )}
                
                {emptySuggestedMessage && (
                     <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-4 rounded-r-lg shadow" role="status">
                        <div className="flex">
                            <div className="py-1">
                                 <svg className="h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold">Информация</p>
                                <p className="text-sm">{emptySuggestedMessage}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {renderContent()}
                </div>
            </main>
             {confirmation && (
                <ConfirmationModal
                    title={confirmation.title}
                    message={confirmation.message}
                    onConfirm={confirmation.onConfirm}
                    onCancel={handleCancelConfirmation}
                    isConfirming={isCorrecting || isBulkCorrecting}
                />
            )}
        </div>
    );
};