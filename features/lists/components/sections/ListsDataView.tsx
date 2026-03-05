
import React from 'react';
import { ListType } from '../../types';
import { SystemListSubscriber, SystemListPost, SystemListInteraction } from '../../../../shared/types';
import { MembersTable } from '../MembersTable';
import { PostsTable } from '../PostsTable';
import { InteractionTable } from '../InteractionTable';

interface ListsDataViewProps {
    activeList: ListType;
    isListLoaded: boolean;
    isLoadingList: boolean;
    items: SystemListSubscriber[];
    posts: SystemListPost[];
    interactions: SystemListInteraction[];
    projectId: string;
    vkGroupId: string;
    onLoadMore: () => void;
}

export const ListsDataView: React.FC<ListsDataViewProps> = React.memo(({
    activeList,
    isListLoaded,
    isLoadingList,
    items,
    posts,
    interactions,
    projectId,
    vkGroupId,
    onLoadMore
}) => {
    
    // Скелетон-загрузка при первом открытии таба (адаптивный под тип списка)
    if (!isListLoaded && items.length === 0 && posts.length === 0 && interactions.length === 0) {
        const headerWidths = activeList === 'mailing'
            ? [40, 160, 50, 50, 80, 120, 70, 30, 80, 30, 80, 80, 60]
            : activeList === 'history_timeline'
            ? [40, 160, 50, 50, 80, 120, 70, 70, 100, 60]
            : [40, 160, 50, 50, 80, 120, 70, 100, 60];
        const rowWidths = activeList === 'mailing'
            ? [140, 35, 45, 70, 110, 65, 25, 70, 25, 70, 70, 50]
            : activeList === 'history_timeline'
            ? [140, 35, 45, 70, 110, 65, 60, 80, 50]
            : [140, 35, 45, 70, 110, 65, 80];

        return (
            <div className="overflow-hidden bg-white rounded-lg shadow border border-gray-200 animate-pulse">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-6">
                    {headerWidths.map((w, i) => (
                        <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: w }} />
                    ))}
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" style={{ animationDelay: `${i * 60}ms` }} />
                        <div className="flex-1 flex gap-6">
                            {rowWidths.map((w, j) => (
                                <div key={j} className="h-3 bg-gray-100 rounded" style={{ width: w, animationDelay: `${i * 60 + j * 30}ms` }} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="pb-4">
            {activeList === 'posts' || activeList === 'reviews_posts' ? (
                <PostsTable 
                    items={posts} 
                    isLoading={false} 
                    onLoadMore={onLoadMore}
                    isFetchingMore={isLoadingList}
                />
            ) : ['likes', 'comments', 'reposts'].includes(activeList) ? (
                <InteractionTable 
                    items={interactions} 
                    isLoading={false} 
                    projectId={projectId} 
                    vkGroupId={vkGroupId}
                    listType={activeList as any} 
                    onLoadMore={onLoadMore}
                    isFetchingMore={isLoadingList}
                />
            ) : (
                <MembersTable 
                    items={items} 
                    isLoading={false} 
                    listType={activeList} 
                    onLoadMore={onLoadMore}
                    isFetchingMore={isLoadingList}
                />
            )}
        </div>
    );
});
