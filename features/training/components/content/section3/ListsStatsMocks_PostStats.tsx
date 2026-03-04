import React from 'react';

// =====================================================================
// Mock-компоненты статистики постов
// =====================================================================

// Блок метрики (Просмотры, Лайки и т.д.)
export const MockMetricBlock: React.FC<{
    icon: React.ReactNode;
    title: string;
    total: number;
    avg: number;
    color: string;
}> = ({ icon, title, total, avg, color }) => (
    <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white`}>
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Среднее: {avg.toFixed(1)}</div>
        </div>
    </div>
);

// Карточка топового поста (с поддержкой metric)
export const MockTopPostCard: React.FC<{
    metric: 'views' | 'likes' | 'comments' | 'reposts';
}> = ({ metric }) => {
    const data = {
        views: { 
            title: 'Лучший пост по просмотрам', 
            postId: '-12345_11111', 
            value: 12456, 
            badgeColor: 'bg-gray-600', 
            badgeLabel: 'Просмотры' 
        },
        likes: { 
            title: 'Лучший пост по лайкам', 
            postId: '-12345_22222', 
            value: 856, 
            badgeColor: 'bg-pink-600', 
            badgeLabel: 'Лайки' 
        },
        comments: { 
            title: 'Лучший пост по комментариям', 
            postId: '-12345_33333', 
            value: 234, 
            badgeColor: 'bg-blue-600', 
            badgeLabel: 'Комментарии' 
        },
        reposts: { 
            title: 'Лучший пост по репостам', 
            postId: '-12345_44444', 
            value: 123, 
            badgeColor: 'bg-purple-600', 
            badgeLabel: 'Репосты' 
        }
    };
    
    const post = data[metric];
    
    return (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-xs font-medium text-gray-700 mb-2">{post.title}</div>
            <a 
                href={`https://vk.com/wall${post.postId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline mb-2 block"
            >
                vk.com/wall{post.postId}
            </a>
            <span className={`inline-block px-2 py-1 ${post.badgeColor} text-white text-xs rounded`}>
                {post.badgeLabel}: {post.value.toLocaleString()}
            </span>
        </div>
    );
};

// =====================================================================
// Иконки для метрик (inline SVG)
// =====================================================================

export const ViewsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

export const LikesIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

export const CommentsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const RepostsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);
