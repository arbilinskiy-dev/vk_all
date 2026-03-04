import React from 'react';

// =====================================================================
// Секция: Часто задаваемые вопросы о сетке календаря
// =====================================================================
export const CalendarGridFAQ: React.FC = () => (
    <>
        {/* FAQ */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Часто задаваемые вопросы</h2>

        <div className="not-prose space-y-4 my-8">
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Почему я не вижу системные посты в прошлых днях?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Системные посты показываются только для будущих публикаций. 
                    После того как автоматизация отработала, системный пост исчезает из календаря 
                    (сама публикация остаётся в ВК, но в сетке её уже нет).
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Как отличить призрачный пост от обычного системного?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Призрачные посты <strong>полупрозрачные</strong> и имеют пунктирную рамку. 
                    Обычные системные посты непрозрачные (как обычные карточки), но тоже с пунктирной рамкой и цветным фоном.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Можно ли скрыть заметки, чтобы видеть только посты?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Да! В шапке календаря есть кнопка "Заметки" с выпадающим списком. 
                    Можешь выбрать: "Развёрнутые", "Свёрнутые" или "Скрыты". 
                    В режиме "Скрыты" заметок не будет видно совсем.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Почему нельзя создать пост на прошлый день?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Создание постов и заметок на прошедшие даты заблокировано намеренно. 
                    Календарь предназначен для планирования будущего контента, а не редактирования истории. 
                    Если нужно что-то исправить в прошлом — работай напрямую в ВК.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Сколько призрачных постов может показываться одновременно?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    Система генерирует максимум 100 призрачных постов на одну неделю для одной автоматизации. 
                    Это сделано для защиты от зависания — если повторение слишком частое (например, каждую минуту), 
                    ты всё равно не увидишь бесконечный список.
                </p>
            </details>

            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="font-bold text-gray-900 cursor-pointer">
                    Как изменить время поста прямо в сетке?
                </summary>
                <p className="text-sm text-gray-700 mt-2">
                    В сетке нельзя изменить время напрямую. Нужно кликнуть на карточку поста, 
                    откроется всплывающее окно редактирования — там сможешь поменять дату и время. 
                    Либо перетащи пост на другой день, а потом отредактируй время в окне подтверждения.
                </p>
            </details>
        </div>
    </>
);
