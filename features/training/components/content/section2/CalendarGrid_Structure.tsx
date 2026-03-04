import React from 'react';

// =====================================================================
// Секция: Как выглядит сетка (структура колонки дня)
// =====================================================================
export const CalendarGridStructure: React.FC = () => (
    <>
        {/* Структура сетки */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Как выглядит сетка?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Сетка представляет собой <strong>7 вертикальных колонок</strong> — по одной на каждый день недели. 
            Каждая колонка состоит из трёх частей:
        </p>

        <div className="not-prose space-y-4 my-8">
            {/* Структура колонки */}
            <div className="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50">
                <h3 className="font-bold text-blue-900 mb-2">1. Заголовок дня</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Вверху каждой колонки находится заголовок с информацией о дне:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li><strong>День недели</strong> (пн, вт, ср... в сокращении)</li>
                    <li><strong>Дата</strong> (формат: 15.01)</li>
                    <li><strong>Кнопка "+"</strong> для быстрого создания поста на этот день</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                    Сегодняшний день подсвечивается <strong>синей верхней границей</strong> — так ты всегда знаешь, где находишься во времени.
                </p>
            </div>

            <div className="border-l-4 border-purple-400 pl-4 py-3 bg-purple-50">
                <h3 className="font-bold text-purple-900 mb-2">2. Истории (если есть)</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Если в этот день были опубликованы истории, они показываются <strong>кружками</strong> 
                    в верхней части колонки, сразу под заголовком.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>Фото-истории — <strong>индиго фон</strong></li>
                    <li>Видео-истории — <strong>фиолетовый фон</strong> + <span className="text-red-500">красный значок воспроизведения</span></li>
                    <li>При клике на кружок открывается просмотрщик истории</li>
                </ul>
            </div>

            <div className="border-l-4 border-green-400 pl-4 py-3 bg-green-50">
                <h3 className="font-bold text-green-900 mb-2">3. Посты и заметки</h3>
                <p className="text-sm text-gray-700 mb-2">
                    Основное содержимое колонки — <strong>посты и заметки</strong>, отсортированные по времени 
                    (от более ранних к более поздним). Они перемешаны между собой в хронологическом порядке.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                    Например: заметка на 10:00, пост на 12:00, ещё один пост на 15:00, заметка на 16:00.
                </p>
            </div>
        </div>
    </>
);
