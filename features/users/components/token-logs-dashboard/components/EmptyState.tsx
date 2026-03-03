import React from 'react';

interface EmptyStateProps {
    isLoading: boolean;
    /** Режим таблицы — VK (8 столбцов с «Проект») или AI (7 столбцов) */
    activeTab?: 'vk' | 'ai';
}

/**
 * Скелетон одной строки таблицы логов.
 * Количество столбцов зависит от режима: VK — 8, AI — 7 (без «Проект»).
 */
const SkeletonRow: React.FC<{ delay: number; showProject: boolean }> = ({ delay, showProject }) => (
    <tr
        className="opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        <td className="w-10 px-4 py-4">
            <div className="w-4 h-4 bg-gray-200 animate-pulse rounded" />
        </td>
        <td className="px-6 py-4">
            <div className="h-4 w-28 bg-gray-200 animate-pulse rounded" />
        </td>
        <td className="px-6 py-4">
            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
        </td>
        <td className="px-6 py-4">
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
        </td>
        <td className="px-6 py-4">
            <div className="h-5 w-14 bg-gray-200 animate-pulse rounded-full" />
        </td>
        {showProject && (
            <td className="px-6 py-4">
                <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
            </td>
        )}
        <td className="px-6 py-4">
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
        </td>
        <td className="w-12 px-4 py-4">
            <div className="h-5 w-5 bg-gray-200 animate-pulse rounded" />
        </td>
    </tr>
);

/**
 * Пустое состояние — скелетоны при загрузке или сообщение «Логи не найдены»
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ isLoading, activeTab = 'vk' }) => {
    const showProject = activeTab === 'vk';

    if (isLoading) {
        return (
            <div className="overflow-x-auto custom-scrollbar bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-[1100px] w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="w-10 px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded" /></th>
                            <th className="px-6 py-3 w-40"><div className="h-3 w-12 bg-gray-200 rounded" /></th>
                            <th className="px-6 py-3 w-48"><div className="h-3 w-16 bg-gray-200 rounded" /></th>
                            <th className="px-6 py-3 w-32"><div className="h-3 w-12 bg-gray-200 rounded" /></th>
                            <th className="px-6 py-3 w-24"><div className="h-3 w-14 bg-gray-200 rounded" /></th>
                            {showProject && (
                                <th className="px-6 py-3 w-64"><div className="h-3 w-14 bg-gray-200 rounded" /></th>
                            )}
                            <th className="px-6 py-3"><div className="h-3 w-14 bg-gray-200 rounded" /></th>
                            <th className="w-12 px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <SkeletonRow key={i} delay={i * 30} showProject={showProject} />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-lg bg-white">
            Логи не найдены
        </div>
    );
};
