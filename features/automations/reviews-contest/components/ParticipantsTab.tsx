/**
 * @deprecated Этот компонент устарел и не используется.
 * Вместо него используется PostsTab.tsx, который работает с реальным API.
 * Файл оставлен для справки и может быть безопасно удален.
 * 
 * Для работы со списком участников конкурса отзывов используйте:
 * - PostsTab.tsx — основной компонент с реальным API
 * - useContestPosts.ts — хук для работы с данными
 */

import React from 'react';

/**
 * @deprecated Используйте PostsTab вместо этого компонента
 */
export const ParticipantsTab: React.FC = () => {
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-700 font-medium">⚠️ Этот компонент устарел</p>
            <p className="text-yellow-600 text-sm mt-2">
                Используйте вкладку "Посты" для просмотра участников конкурса.
            </p>
        </div>
    );
};
