/**
 * Раздел 13 страницы «Просмотр постов»
 * Сравнение таблицы постов и календаря + резюме по использованию.
 */
import React from 'react';

export const ComparisonSection: React.FC = () => (
    <>
        {/* ============================================ */}
        {/* РАЗДЕЛ 13: ОТЛИЧИЕ ОТ КАЛЕНДАРЯ */}
        {/* ============================================ */}
        <h2>13. Отличие от календаря постов</h2>
        <p>
            Важно понимать разницу между <strong>таблицей постов</strong> и <strong>календарём постов</strong>:
        </p>

        <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-bold text-purple-900">Таблица постов</span>
                </div>
                <p className="text-sm text-purple-800 mb-2"><strong>Назначение:</strong></p>
                <ul className="text-sm text-purple-800 mb-0 space-y-1 list-disc list-inside">
                    <li>Анализ уже опубликованных постов</li>
                    <li>Просмотр статистики (лайки, репосты, просмотры)</li>
                    <li>Поиск и фильтрация постов по тексту</li>
                    <li>История публикаций</li>
                </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-bold text-green-900">Календарь постов</span>
                </div>
                <p className="text-sm text-green-800 mb-2"><strong>Назначение:</strong></p>
                <ul className="text-sm text-green-800 mb-0 space-y-1 list-disc list-inside">
                    <li>Создание новых постов</li>
                    <li>Планирование будущих публикаций</li>
                    <li>Редактирование черновиков</li>
                    <li>Отложенный постинг по расписанию</li>
                </ul>
            </div>
        </div>

        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-300 rounded-lg p-6 my-8">
            <h3 className="text-lg font-bold text-gray-800 mt-0 mb-3">Резюме: когда использовать таблицу постов</h3>
            <ul className="text-gray-700 space-y-2 mb-0">
                <li>✅ Хотите проанализировать, какие посты получили больше всего лайков</li>
                <li>✅ Нужно найти пост по фрагменту текста</li>
                <li>✅ Проверяете, когда последний раз обновлялась статистика</li>
                <li>✅ Хотите быстро открыть пост в ВК для редактирования</li>
                <li>❌ Хотите создать новый пост — идите в <strong>Календарь</strong></li>
                <li>❌ Хотите отредактировать запланированный пост — идите в <strong>Календарь</strong></li>
            </ul>
        </div>
    </>
);
