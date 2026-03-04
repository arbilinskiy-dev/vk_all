import React from 'react';

// =====================================================================
// Секция «Что это за таблица?» — сравнение «раньше/сейчас» + отличия
// =====================================================================

/** Блок 1 страницы «Просмотр взаимодействий» */
export const WhatIsTableSection: React.FC = () => (
    <>
        {/* ============================================== */}
        {/* 1. ЧТО ЭТО ЗА ТАБЛИЦА? */}
        {/* ============================================== */}
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900">Что это за таблица?</h2>

        <p className="!text-base !leading-relaxed !text-gray-700">
            Таблица взаимодействий показывает <strong>людей, которые активно реагировали на посты сообщества</strong> — ставили лайки, оставляли комментарии или делали репосты. Это история активности пользователей за выбранный период времени.
        </p>

        <div className="not-prose grid grid-cols-2 gap-6 my-8">
            {/* Раньше */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                    <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <h3 className="text-lg font-bold text-red-900">Раньше</h3>
                </div>
                <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex gap-2">
                        <span className="text-red-600">•</span>
                        <span>Открывали каждый пост в браузере и смотрели кто лайкнул</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-600">•</span>
                        <span>ВКонтакте показывает только первые 100 пользователей</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-600">•</span>
                        <span>Не было информации о профилях (возраст, город, активность)</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-600">•</span>
                        <span>Невозможно найти самых активных пользователей за период</span>
                    </li>
                </ul>
            </div>

            {/* Сейчас */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-5">
                <div className="flex items-start gap-3 mb-3">
                    <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <h3 className="text-lg font-bold text-green-900">Сейчас</h3>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>Все взаимодействия за период собираются автоматически</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>Видно полный профиль каждого пользователя (пол, город, возраст, статус)</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>Счётчик показывает общее количество активности каждого человека</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-green-600">•</span>
                        <span>Можно раскрыть строку и увидеть с какими постами взаимодействовал пользователь</span>
                    </li>
                </ul>
            </div>
        </div>

        <div className="not-prose bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg my-6">
            <h4 className="font-bold text-blue-900 mb-2">Чем отличается от других таблиц?</h4>
            <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Участники</strong> — кто подписан на сообщество (статичная база подписчиков)</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Посты</strong> — что опубликовано в сообществе (контент)</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span><strong>Взаимодействия</strong> — кто активно реагирует на контент (динамическая активность)</span>
                </li>
            </ul>
        </div>
    </>
);
