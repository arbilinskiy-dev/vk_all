import React, { useState } from 'react';

// =====================================================================
// Демо: Иконки действий с промокодами
// =====================================================================

/** Данные иконки действия */
interface ActionIcon {
    id: string;
    name: string;
    color: string;
    description: string;
    svg: React.ReactNode;
}

/** Набор иконок для демонстрации */
const icons: ActionIcon[] = [
    {
        id: 'edit',
        name: 'Редактировать',
        color: 'text-gray-400 hover:text-indigo-600',
        description: 'Изменить описание приза. Появляется при наведении курсора на свободный промокод.',
        svg: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
    },
    {
        id: 'save',
        name: 'Сохранить',
        color: 'text-green-600 hover:text-green-800',
        description: 'Подтвердить изменение описания. Также можно нажать Enter в поле ввода.',
        svg: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
    },
    {
        id: 'cancel',
        name: 'Отмена',
        color: 'text-red-500 hover:text-red-700',
        description: 'Отменить редактирование. Также можно нажать Escape.',
        svg: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
    },
    {
        id: 'chat',
        name: 'Диалог',
        color: 'text-gray-400 hover:text-indigo-600',
        description: 'Открыть переписку с победителем в ВК. Доступно только для выданных промокодов.',
        svg: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
    },
    {
        id: 'delete',
        name: 'Удалить',
        color: 'text-gray-400 hover:text-red-600',
        description: 'Удалить промокод из базы. Доступно только для свободных (не выданных) промокодов.',
        svg: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    }
];

export const ActionIconsDemo: React.FC = () => {
    const [activeIcon, setActiveIcon] = useState<string | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Наведите курсор на иконку:</p>
                <div className="flex gap-4 flex-wrap">
                    {icons.map(icon => (
                        <button
                            key={icon.id}
                            onMouseEnter={() => setActiveIcon(icon.id)}
                            onMouseLeave={() => setActiveIcon(null)}
                            className={`p-2 rounded transition-colors ${icon.color}`}
                            title={icon.name}
                        >
                            {icon.svg}
                        </button>
                    ))}
                </div>
            </div>

            {activeIcon && (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-sm text-indigo-900">
                    <p><strong>{icons.find(i => i.id === activeIcon)?.name}:</strong> {icons.find(i => i.id === activeIcon)?.description}</p>
                </div>
            )}
        </div>
    );
};
