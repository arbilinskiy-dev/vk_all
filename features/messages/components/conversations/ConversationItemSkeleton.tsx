import React from 'react';

/**
 * Скелетон одного элемента списка диалогов.
 * Повторяет layout ConversationItem с точностью до пикселя:
 * - Контейнер: px-3 py-3 flex items-start gap-3 border-b border-gray-50
 * - Аватар: w-11 h-11 в обёртке relative flex-shrink-0
 * - Имя: text-sm → line-height 20px (h-5 строка, h-3.5 бар)
 * - Время: text-[11px] → ~16px line-height
 * - Превью: text-xs line-clamp-2 → mt-0.5 + 2 строки по 16px
 */
const ConversationItemSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => (
    <div
        className="w-full px-3 py-3 flex items-start gap-3 border-b border-gray-50 animate-pulse"
        style={{ animationDelay: `${index * 60}ms` }}
    >
        {/* Аватар — обёртка relative flex-shrink-0, как в ConversationItem */}
        <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0">
            {/* Верхняя строка: h-5 (20px) совпадает с line-height text-sm реального имени */}
            <div className="flex items-center justify-between gap-2 h-5">
                <div className="h-3.5 bg-gray-200 rounded" style={{ width: `${70 + (index % 3) * 20}px` }} />
                <div className="h-2.5 w-8 bg-gray-200 rounded flex-shrink-0" />
            </div>
            {/* Превью: mt-0.5 (2px) как в реальном + 2 строки с межстрочным ~4px ≈ text-xs line-clamp-2 */}
            <div className="mt-0.5 space-y-1">
                <div className="h-3 bg-gray-200 rounded" style={{ width: `${160 + (index % 4) * 15}px`, maxWidth: '100%' }} />
                <div className="h-3 bg-gray-200 rounded" style={{ width: `${80 + (index % 3) * 25}px` }} />
            </div>
        </div>
    </div>
);

/**
 * Группа скелетонов для первичной загрузки списка диалогов.
 * Показывает count элементов с каскадной анимацией.
 */
export const ConversationListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
    <div className="flex flex-col">
        {Array.from({ length: count }, (_, i) => (
            <ConversationItemSkeleton key={i} index={i} />
        ))}
    </div>
);

export { ConversationItemSkeleton };
