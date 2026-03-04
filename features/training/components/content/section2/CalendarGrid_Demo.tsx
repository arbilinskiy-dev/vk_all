import React, { useState } from 'react';
import { useCalendar } from '../../../hooks/useCalendar';
import { DEMO_WEEK_CONTENT } from './CalendarGridMocks';

// =====================================================================
// Секция: Интерактивная демонстрация сетки календаря
// =====================================================================
export const CalendarGridDemo: React.FC = () => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    // Используем хук для генерации недели
    const { weekDates } = useCalendar(new Date(2026, 1, 10)); // 10 февраля 2026
    const today = new Date(2026, 1, 12); // Среда для демонстрации (12 февраля)

    // Используем импортированные демо-данные
    const demoContent = DEMO_WEEK_CONTENT;

    return (
        <>
            {/* Интерактивная демонстрация */}
            <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Попробуй сам</h2>

            <p className="!text-base !leading-relaxed !text-gray-700 mb-6">
                Ниже показана <strong>интерактивная демонстрация</strong> сетки календаря. 
                Наведи на колонку дня, чтобы увидеть подробности содержимого:
            </p>

            <div className="not-prose bg-gray-50 border border-gray-300 rounded-lg p-6 my-8">
                {/* Демонстрация сетки */}
                <div className="grid grid-cols-7 gap-3">
                    {weekDates.map((date, index) => {
                        const isToday = date.date.toDateString() === today.toDateString();
                        const dayContent = demoContent[index as keyof typeof demoContent] || { stories: 0, posts: [], notes: [] };
                        const isSelected = selectedDay === index;

                        return (
                            <div 
                                key={index}
                                onMouseEnter={() => setSelectedDay(index)}
                                onMouseLeave={() => setSelectedDay(null)}
                                className={`
                                    border rounded-lg transition-all duration-200
                                    ${isToday ? 'border-t-4 border-t-indigo-500' : 'border-gray-200'}
                                    ${isSelected ? 'bg-indigo-50 shadow-lg scale-105' : 'bg-white'}
                                `}
                            >
                                {/* Заголовок дня */}
                                <div className="text-center p-2 border-b border-gray-200">
                                    <p className={`font-bold text-xs ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        {date.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
                                    </p>
                                    <p className="text-gray-500 text-[10px]">
                                        {date.date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                    </p>
                                    {/* Кнопка + */}
                                    <button
                                        className="w-full mt-1 p-1 border border-dashed border-gray-300 rounded text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
                                        title="Создать пост"
                                        aria-label={`Создать пост на ${date.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`}
                                        tabIndex={0}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Содержимое дня */}
                                <div className="p-2 space-y-2 min-h-[200px]">
                                    {/* Истории */}
                                    {dayContent.stories > 0 && (
                                        <div className="flex -space-x-1 pb-2">
                                            {Array.from({ length: dayContent.stories }).map((_, i) => (
                                                <div 
                                                    key={i}
                                                    className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center cursor-pointer hover:z-10 hover:scale-110 transition-transform"
                                                    title="История"
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-label={`Посмотреть историю ${i + 1}`}
                                                >
                                                    <span className="text-[8px] text-indigo-600" aria-hidden="true">S</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Заметки и посты */}
                                    {[...dayContent.notes, ...dayContent.posts]
                                        .sort((a, b) => a.time.localeCompare(b.time))
                                        .map((item, i) => {
                                            if ('color' in item) {
                                                // Это заметка
                                                return (
                                                    <div 
                                                        key={`note-${i}`}
                                                        className={`p-2 rounded border text-[10px] cursor-pointer ${item.color}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-label={`Заметка: ${item.title} в ${item.time}`}
                                                    >
                                                        <p className="font-bold text-gray-800">{item.time}</p>
                                                        <p className="text-gray-700 truncate">{item.title}</p>
                                                    </div>
                                                );
                                            } else {
                                                // Это пост
                                                let bgColor = 'bg-white';
                                                let borderStyle = 'border-gray-200';
                                                let opacityClass = '';

                                                if (item.type === 'published') {
                                                    borderStyle = 'border-gray-300';
                                                } else if (item.type === 'system') {
                                                    // AI-лента — индиго фон
                                                    bgColor = 'bg-indigo-50';
                                                    borderStyle = 'border-indigo-200 border-dashed';
                                                    if (item.isGhost) {
                                                        opacityClass = 'opacity-70';
                                                    }
                                                }

                                                return (
                                                    <div 
                                                        key={`post-${i}`}
                                                        className={`p-2 rounded border ${bgColor} ${borderStyle} ${opacityClass} text-[10px] cursor-pointer`}
                                                    >
                                                        <p className="font-bold text-gray-800">{item.time}</p>
                                                        <p className="text-gray-700 truncate">{item.text}</p>
                                                        {item.type === 'published' && (
                                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-medium">
                                                                Опубликовано
                                                            </span>
                                                        )}
                                                        {item.type === 'system' && (
                                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[8px] font-medium">
                                                                {item.isGhost ? 'Призрак' : 'Автопост'}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Подсказка */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-sm text-blue-800">
                        {selectedDay !== null ? (
                            <>
                                <strong>Выбран день:</strong> {weekDates[selectedDay].date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </>
                        ) : (
                            <>
                                <strong>Подсказка:</strong> Наведи курсор на любую колонку, чтобы подсветить её
                            </>
                        )}
                    </p>
                </div>
            </div>
        </>
    );
};
