/**
 * Клавиатура бота — рендеринг кнопок, прикреплённых к сообщению.
 */
import React from 'react';
import { MessageKeyboard, VkKeyboardButtonData } from '../../types';

/** Цвета кнопок VK → Tailwind-классы (непрозрачные, как в VK) */
const VK_BUTTON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-[#5181b8]', text: 'text-white', border: 'border-[#5181b8]' },
    secondary: { bg: 'bg-white', text: 'text-[#55677d]', border: 'border-gray-200' },
    positive: { bg: 'bg-[#4bb34b]', text: 'text-white', border: 'border-[#4bb34b]' },
    negative: { bg: 'bg-[#e64646]', text: 'text-white', border: 'border-[#e64646]' },
};

/** Одна кнопка клавиатуры */
const KeyboardButton: React.FC<{ button: VkKeyboardButtonData }> = ({ button }) => {
    const { action, color = 'secondary' } = button;
    const colors = VK_BUTTON_COLORS[color] || VK_BUTTON_COLORS.secondary;

    // Иконка для кнопки-ссылки
    const isLink = action.type === 'open_link';

    const handleClick = () => {
        if (isLink && action.link) {
            window.open(action.link, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <button
            onClick={isLink ? handleClick : undefined}
            className={`
                w-full px-3 py-2 rounded-lg text-[13px] font-medium border transition-all duration-150
                ${colors.bg} ${colors.text} ${colors.border}
                ${isLink ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                flex items-center justify-center gap-1
            `}
            title={action.label || ''}
        >
            <span className="truncate">{action.label || ''}</span>
            {isLink && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            )}
        </button>
    );
};

/** Клавиатура бота — набор кнопок, прикреплённых к сообщению */
export const KeyboardButtons: React.FC<{ keyboard: MessageKeyboard; isOutgoing: boolean }> = ({ keyboard }) => {
    if (!keyboard.buttons || keyboard.buttons.length === 0) return null;

    return (
        <div className="mt-2 space-y-1.5">
            {keyboard.buttons.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-1.5">
                    {row.map((btn, btnIdx) => (
                        <div key={btnIdx} className="flex-1 min-w-0">
                            <KeyboardButton button={btn} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
