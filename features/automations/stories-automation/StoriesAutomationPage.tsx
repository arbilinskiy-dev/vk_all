import React from 'react';
import { useStoriesAutomation } from './hooks/useStoriesAutomation';
import { StoriesSettingsView } from './components/StoriesSettingsView';
import { StoriesStatsView } from './components/StoriesStatsView';
import { StoryCreatorView } from './components/StoryCreatorView';
import { StoriesAutomationPageProps } from './types';

export const StoriesAutomationPage: React.FC<StoriesAutomationPageProps> = ({ 
    projectId, 
    activeTab, 
    setActiveTab 
}) => {
    const {
        stories,
        isLoadingStories,
        loadStories,
        isSaving,
        updatingStatsId,
        isActive, setIsActive,
        keywords, setKeywords,
        isLoading, // Add isLoading
        posts,
        visibleCount, setVisibleCount,
        isPublishing,
        scrollContainerRef,
        handleSave,
        handleUpdateStats,
        handleUpdateViewers,
        handleUpdateAll,
        handleManualPublish,
        handleScroll,
        getPostStatus,
        getFirstImage,
        getCount,
        // Пагинация и серверная статистика дашборда
        totalStories,
        isLoadingMore,
        loadMoreStories,
        hasMore,
        dashboardStats,
        isLoadingDashboard,
        loadDashboardStats
    } = useStoriesAutomation(projectId, activeTab);

    if (!projectId) {
        return (
            <div className="max-w-4xl mx-auto p-6 flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="bg-indigo-50 p-4 rounded-full mb-4">
                     <p>Выберите проект</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header section */}
            <div className="bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            Автоматизация историй
                            {isActive ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200 animate-pulse">Активен</span>
                            ) : (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">Остановлен</span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Автоматический репост подходящих записей в истории сообщества</p>
                    </div>
                    <div className="flex gap-3">
                        {activeTab !== 'create' && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ${
                                    isSaving 
                                        ? 'bg-green-400 text-white cursor-not-allowed' 
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex px-6 gap-4">
                    <button 
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'create' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('create')}
                    >
                        Создать историю
                    </button>
                    <button 
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Настройки и История
                    </button>
                    <button 
                        className={`py-2 px-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Статистика
                    </button>
                </div>
            </div>

            <div 
                className="flex-grow p-6 overflow-hidden flex flex-col"
            >
                {isLoading ? (
                    <div className="flex-1 flex flex-col gap-4 p-2">
                        {/* Скелетон: имитация блоков настроек */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-48"></div>
                            <div className="h-4 bg-gray-200 rounded w-full max-w-md"></div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-40"></div>
                                    <div className="h-3 bg-gray-200 rounded w-72"></div>
                                </div>
                                <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-56"></div>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-3">
                                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    </div>
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pr-2">
                        {activeTab === 'create' ? (
                            <StoryCreatorView projectId={projectId!} />
                        ) : activeTab === 'settings' ? (
                            <StoriesSettingsView 
                                projectId={projectId}
                                isActive={isActive}
                                setIsActive={setIsActive}
                                keywords={keywords}
                                setKeywords={setKeywords}
                                posts={posts}
                                visibleCount={visibleCount}
                                setVisibleCount={setVisibleCount}
                                // Ref passed to settings view for internal scrolling
                                scrollContainerRef={scrollContainerRef} 
                                handleScroll={handleScroll} 
                                isSaving={isSaving}
                                getPostStatus={getPostStatus}
                                getFirstImage={getFirstImage}
                                handleManualPublish={handleManualPublish}
                                isPublishing={isPublishing}
                            />
                        ) : (
                            <StoriesStatsView 
                                handleUpdateStats={handleUpdateStats}
                                handleUpdateViewers={handleUpdateViewers}
                                handleUpdateAll={handleUpdateAll}
                                updatingStatsId={updatingStatsId}
                                loadStories={loadStories}
                                isLoadingStories={isLoadingStories}
                                stories={stories}
                                hasMore={hasMore}
                                isLoadingMore={isLoadingMore}
                                loadMoreStories={loadMoreStories}
                                totalStories={totalStories}
                                dashboardStats={dashboardStats}
                                isLoadingDashboard={isLoadingDashboard}
                                loadDashboardStats={loadDashboardStats}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
