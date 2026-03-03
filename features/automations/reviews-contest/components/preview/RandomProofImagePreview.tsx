/**
 * RandomProofImagePreview.tsx
 * 
 * Компонент-превью для изображения-доказательства розыгрыша.
 * Показывает макет того, как будет выглядеть автоматически 
 * сгенерированное изображение при подведении итогов конкурса.
 * 
 * Дизайн повторяет стиль VK Dark Theme:
 * - Тёмный фон
 * - Синие акценты (VK Blue #2688eb)
 * - Аватарки участников
 */

import React from 'react';

// Цвета VK Dark Theme
const VK_DARK = {
    bg: '#19191a',
    card: '#232325',
    accent: '#2688eb',
    textPrimary: '#ffffff',
    textSecondary: '#8e8e91',
    divider: '#323234',
};

// Моковые аватарки для превью
const MOCK_AVATARS = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
];

interface RandomProofImagePreviewProps {
    winnerNumber?: number;
    winnerName?: string;
    totalParticipants?: number;
    groupName?: string;
    contestName?: string;
    /** Размер превью: 'small' для секции настроек, 'large' для правой панели */
    size?: 'small' | 'large';
}

export const RandomProofImagePreview: React.FC<RandomProofImagePreviewProps> = ({
    winnerNumber = 5,
    winnerName = 'Мария Смирнова',
    totalParticipants = 16,
    groupName = 'Название сообщества',
    contestName = 'Конкурс отзывов',
    size = 'small',
}) => {
    const isLarge = size === 'large';
    // Текущая дата для превью
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });

    // Количество видимых мини-аватарок
    const visibleAvatars = Math.min(6, totalParticipants);
    const extraCount = totalParticipants > 6 ? totalParticipants - 6 : 0;

    return (
        <div 
            className={`overflow-hidden shadow-xl ${isLarge ? 'rounded-none' : 'rounded-xl'}`}
            style={{ 
                backgroundColor: VK_DARK.bg,
                aspectRatio: '1 / 1',
                maxWidth: isLarge ? '100%' : '280px',
                width: isLarge ? '100%' : undefined,
            }}
        >
            <div className={`h-full flex flex-col items-center justify-center ${isLarge ? 'p-6' : 'p-3'}`}>
                {/* Заголовок */}
                <div className={`text-center ${isLarge ? 'mb-4' : 'mb-2'}`}>
                    <div className={`font-bold ${isLarge ? 'text-xl' : 'text-sm'}`} style={{ color: VK_DARK.textPrimary }}>
                        🎉 Итоги розыгрыша
                    </div>
                    <div className={`${isLarge ? 'text-sm mt-1' : 'text-[10px] mt-0.5'}`} style={{ color: VK_DARK.textSecondary }}>
                        {contestName}
                    </div>
                </div>

                {/* Аватарка победителя */}
                <div className={`relative ${isLarge ? 'my-6' : 'my-2'}`}>
                    {/* Свечение */}
                    <div 
                        className={`absolute inset-0 rounded-full opacity-40 ${isLarge ? 'blur-2xl' : 'blur-lg'}`}
                        style={{ 
                            backgroundColor: VK_DARK.accent,
                            transform: 'scale(1.3)',
                        }}
                    />
                    
                    {/* Корона */}
                    <div 
                        className={`absolute left-1/2 -translate-x-1/2 z-10 ${isLarge ? 'text-3xl -top-8' : 'text-lg -top-4'}`}
                    >
                        👑
                    </div>
                    
                    {/* Аватарка */}
                    <div 
                        className={`relative rounded-full overflow-hidden border-2 ${isLarge ? 'w-28 h-28' : 'w-16 h-16'}`}
                        style={{ borderColor: VK_DARK.accent }}
                    >
                        <img 
                            src={MOCK_AVATARS[0]} 
                            alt="Winner" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Номер и имя */}
                <div className={`text-center ${isLarge ? 'mb-4' : 'mb-2'}`}>
                    <div 
                        className={`font-medium ${isLarge ? 'text-base' : 'text-xs'}`}
                        style={{ color: VK_DARK.accent }}
                    >
                        Отзыв №{winnerNumber}
                    </div>
                    <div 
                        className={`font-bold ${isLarge ? 'text-lg mt-1' : 'text-sm mt-0.5'}`}
                        style={{ color: VK_DARK.textPrimary }}
                    >
                        {winnerName}
                    </div>
                </div>

                {/* Разделитель */}
                <div 
                    className={`w-4/5 h-px ${isLarge ? 'my-4' : 'my-2'}`}
                    style={{ backgroundColor: VK_DARK.divider }}
                />

                {/* Статистика */}
                <div 
                    className={`${isLarge ? 'text-sm mb-4' : 'text-[10px] mb-2'}`}
                    style={{ color: VK_DARK.textSecondary }}
                >
                    Всего участников: {totalParticipants}
                </div>

                {/* Мини-аватарки */}
                <div className={`flex items-center ${isLarge ? 'gap-1 mb-4' : 'gap-0.5 mb-2'}`}>
                    {MOCK_AVATARS.slice(0, visibleAvatars).map((avatar, idx) => (
                        <div 
                            key={idx}
                            className={`rounded-full overflow-hidden border ${idx === 0 ? 'border-2' : 'border'} ${isLarge ? 'w-8 h-8' : 'w-5 h-5'}`}
                            style={{ 
                                borderColor: idx === 0 ? VK_DARK.accent : VK_DARK.divider,
                            }}
                        >
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                    
                    {/* +N */}
                    {extraCount > 0 && (
                        <div 
                            className={`rounded-full flex items-center justify-center ${isLarge ? 'w-8 h-8 text-xs' : 'w-5 h-5 text-[8px]'}`}
                            style={{ 
                                backgroundColor: VK_DARK.card,
                                color: VK_DARK.textSecondary,
                            }}
                        >
                            +{extraCount}
                        </div>
                    )}
                </div>

                {/* Дата и время */}
                <div 
                    className={`text-center px-2 w-full ${isLarge ? 'text-xs' : 'text-[9px]'}`}
                    style={{ color: VK_DARK.textSecondary }}
                >
                    <div>{dateStr} в {timeStr}</div>
                    <div 
                        className="mt-0.5 line-clamp-2 break-words"
                        title={`Организатор: ${groupName}`}
                    >
                        Организатор: {groupName}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RandomProofImagePreview;
