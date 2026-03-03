/**
 * Вспомогательные UI-компоненты для страницы статистики сообщений.
 * SummaryCard, ProjectAvatar, UserAvatar.
 */
import React, { useState } from 'react';

/** Аватарка проекта со скелетоном */
export const ProjectAvatar: React.FC<{ url: string; name: string }> = ({ url, name }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div className="relative w-8 h-8 shrink-0">
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse" />
            )}
            <img
                src={url}
                alt={name}
                className={`w-8 h-8 rounded-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
};

/** Аватарка пользователя со скелетоном */
export const UserAvatar: React.FC<{ url: string; name: string }> = ({ url, name }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    return (
        <div className="relative w-7 h-7 shrink-0">
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse" />
            )}
            <img
                src={url}
                alt={name}
                className={`w-7 h-7 rounded-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
            />
        </div>
    );
};

/** Карточка сводки */
export const SummaryCard: React.FC<{
    label: string;
    value: number;
    color: 'indigo' | 'green' | 'orange' | 'purple' | 'red' | 'blue';
    active?: boolean;
    onClick?: () => void;
}> = ({ label, value, color, active, onClick }) => {
    const accent: Record<string, string> = {
        indigo: 'text-indigo-600',
        green: 'text-green-600',
        orange: 'text-orange-600',
        purple: 'text-purple-600',
        red: 'text-red-600',
        blue: 'text-blue-600',
    };
    const activeBorder: Record<string, string> = {
        indigo: 'border-indigo-400 ring-2 ring-indigo-100',
        green: 'border-green-400 ring-2 ring-green-100',
        orange: 'border-orange-400 ring-2 ring-orange-100',
        purple: 'border-purple-400 ring-2 ring-purple-100',
        red: 'border-red-400 ring-2 ring-red-100',
        blue: 'border-blue-400 ring-2 ring-blue-100',
    };
    return (
        <div
            className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
                active ? activeBorder[color] : 'border-gray-200'
            } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
            onClick={onClick}
            title={onClick ? (active ? 'Сбросить фильтр' : `Фильтровать по: ${label}`) : undefined}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                {onClick && (
                    <svg className={`w-3.5 h-3.5 transition-colors ${active ? accent[color] : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                )}
            </div>
            <p className={`text-2xl font-bold mt-1 ${accent[color]}`}>
                {value.toLocaleString()}
            </p>
        </div>
    );
};
