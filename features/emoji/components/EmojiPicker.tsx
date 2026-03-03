import React, { useState, useMemo, useCallback } from 'react';
import { emojiCategories, EmojiData } from '../data/emojiData';
import { useRecentEmojis } from '../hooks/useRecentEmojis';
import { getTwemojiUrl, getTwemojiUrlAlt } from '../utils/twemoji';

interface EmojiPickerProps {
    projectId: string;
    onSelectEmoji: (emoji: string) => void;
    /** Вариант отображения: 'floating' — выпадающее окно, 'inline' — встроенная панель */
    variant?: 'floating' | 'inline';
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ projectId, onSelectEmoji, variant = 'floating' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { recents, addRecent } = useRecentEmojis(projectId);
    const [activeCategory, setActiveCategory] = useState(recents.length > 0 ? 'Недавние' : emojiCategories[0].name);

    const handleSelect = (emoji: EmojiData) => {
        onSelectEmoji(emoji.char);
        addRecent(emoji);
    };

    const handleCategoryClick = (name: string) => {
        setActiveCategory(name);
    };

    const filteredEmojis = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return emojiCategories
            .flatMap(category => category.emojis)
            .filter(emoji => 
                emoji.name.toLowerCase().includes(lowerCaseQuery) ||
                emoji.keywords.some(kw => kw.toLowerCase().includes(lowerCaseQuery))
            );
    }, [searchQuery]);

    const displayedContent = useMemo(() => {
        if (activeCategory === 'Недавние') {
            return {
                name: 'Недавно использованные',
                emojis: recents,
            };
        }
        return emojiCategories.find(cat => cat.name === activeCategory);
    }, [activeCategory, recents]);

    /**
     * Обработчик ошибки загрузки <img> эмоджи.
     * 1-я попытка: альтернативный Twemoji URL (обратная логика fe0f)
     * 2-я попытка: нативный Unicode символ (как fallback)
     */
    const handleImgError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, emoji: string) => {
        const img = e.currentTarget;
        const altUrl = getTwemojiUrlAlt(emoji);
        // Если текущий src !== alt URL — пробуем альтернативный
        if (img.src !== altUrl) {
            img.src = altUrl;
        } else {
            // Оба URL не сработали — заменяем <img> на нативный Unicode символ
            const span = document.createElement('span');
            span.textContent = emoji;
            span.className = img.className + ' inline-flex items-center justify-center';
            span.style.fontSize = `${img.width || 28}px`;
            span.style.lineHeight = '1';
            img.replaceWith(span);
        }
    }, []);

    const CategoryButton: React.FC<{ name: string, icon: string, isActive: boolean, onClick: (name: string) => void, disabled?: boolean }> = ({ name, icon, isActive, onClick, disabled }) => (
        <button
            title={name}
            onClick={() => onClick(name)}
            disabled={disabled}
            className={`p-1.5 rounded-md transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            <img src={getTwemojiUrl(icon)} alt={name} className="w-5 h-5" loading="lazy" onError={(e) => handleImgError(e, icon)} />
        </button>
    );

    const EmojiButton: React.FC<{ emoji: EmojiData }> = ({ emoji }) => (
         <button
            key={emoji.char}
            onClick={() => handleSelect(emoji)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-200 transition-colors"
            title={emoji.name}
        >
            <img src={getTwemojiUrl(emoji.char)} alt={emoji.name} className="w-7 h-7" loading="lazy" onError={(e) => handleImgError(e, emoji.char)} />
        </button>
    );

    const isInline = variant === 'inline';

    // Количество колонок в сетке — для inline больше, т.к. панель шире
    const gridCols = isInline ? 'grid-cols-12' : 'grid-cols-8';

    return (
        <div className={isInline
            ? 'w-full bg-gray-50 flex flex-col border-t border-gray-200'
            : 'w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col animate-fade-in-up'
        }>
            {/* Поиск + категории в одну строку для inline */}
            {isInline ? (
                <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-gray-200">
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-40 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                    <div className="flex items-center gap-0.5">
                        <CategoryButton name="Недавние" icon="🕒" isActive={activeCategory === 'Недавние'} onClick={handleCategoryClick} disabled={recents.length === 0} />
                        {emojiCategories.map(cat => <CategoryButton key={cat.name} name={cat.name} icon={cat.icon} isActive={activeCategory === cat.name} onClick={handleCategoryClick} />)}
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-3 border-b">
                        <input
                            type="text"
                            placeholder="Поиск эмодзи..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="p-2 border-b grid grid-cols-7 gap-1">
                        <CategoryButton name="Недавние" icon="🕒" isActive={activeCategory === 'Недавние'} onClick={handleCategoryClick} disabled={recents.length === 0} />
                        {emojiCategories.map(cat => <CategoryButton key={cat.name} name={cat.name} icon={cat.icon} isActive={activeCategory === cat.name} onClick={handleCategoryClick} />)}
                    </div>
                </>
            )}

            <div className={`flex-grow overflow-y-auto custom-scrollbar p-2.5 ${isInline ? 'max-h-48' : ''}`}>
                {searchQuery ? (
                    filteredEmojis.length > 0 ? (
                        <div className={`grid ${gridCols} gap-1`}>
                            {filteredEmojis.map(emoji => <EmojiButton key={emoji.char} emoji={emoji} />)}
                        </div>
                    ) : (
                        <p className="text-sm text-center text-gray-500 mt-4">Эмодзи не найдены</p>
                    )
                ) : (
                    displayedContent && displayedContent.emojis.length > 0 && (
                        <div key={displayedContent.name}>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1.5">
                                {displayedContent.name}
                            </h3>
                            <div className={`grid ${gridCols} gap-1`}>
                                {displayedContent.emojis.map(emoji => <EmojiButton key={emoji.char} emoji={emoji} />)}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};