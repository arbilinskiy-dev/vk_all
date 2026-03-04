/**
 * Главная страница Песочницы (Sandbox).
 * 
 * Содержит навигацию между тестами в виде вкладок.
 * Каждый тест полностью изолирован в своей папке.
 */

import React, { useState } from 'react';
import { PhotoUploadTest } from './tests/test1-photo-upload/PhotoUploadTest';
import { StoriesDataTest } from './tests/test2-stories-data/StoriesDataTest';
import { GeminiModelsTest } from './tests/test4-gemini-models/GeminiModelsTest';
import { ImageGenerationTest } from './tests/test5-image-generation/ImageGenerationTest';
import { VideoGenerationTest } from './tests/test6-video-generation/VideoGenerationTest';
import { EmailSenderTest } from './tests/test7-email-sender/EmailSenderTest';

// ─── Конфигурация тестов ────────────────────────────────

interface SandboxTest {
    id: string;
    title: string;
    description: string;
    component: React.FC;
}

const SANDBOX_TESTS: SandboxTest[] = [
    {
        id: 'test1-story-upload',
        title: 'Тест 1: Фото + История',
        description: 'Загрузка фото (user token) + публикация истории (community token). Полная цепочка VK API.',
        component: PhotoUploadTest,
    },
    {
        id: 'test2-stories-data',
        title: 'Тест 2: Данные историй',
        description: 'Тестирование stories.get / getStats / getViewers с 3 типами токенов (user, community, service).',
        component: StoriesDataTest,
    },
    {
        id: 'test4-gemini-models',
        title: 'Тест 4: Модели Google AI',
        description: 'Проверка доступности Gemini / Imagen / Gemma моделей по API ключу.',
        component: GeminiModelsTest,
    },
    {
        id: 'test5-image-generation',
        title: 'Тест 5: Генерация изображений',
        description: 'Генерация изображений через Gemini Image и Imagen 4 по промпту.',
        component: ImageGenerationTest,
    },
    {
        id: 'test6-video-generation',
        title: 'Тест 6: Генерация видео',
        description: 'Генерация видео через модели Veo (асинхронная) по промпту.',
        component: VideoGenerationTest,
    },
    {
        id: 'test7-email-sender',
        title: 'Тест 7: Email-рассылка',
        description: 'Отправка писем с вложениями через Яндекс SMTP. Тест подключения, одиночная и массовая отправка.',
        component: EmailSenderTest,
    },
    // Новые тесты добавляются сюда:
];

// ─── Компонент страницы ──────────────────────────────────

export const SandboxPage: React.FC = () => {
    const [activeTestId, setActiveTestId] = useState(SANDBOX_TESTS[0]?.id || '');

    const activeTest = SANDBOX_TESTS.find(t => t.id === activeTestId);
    const ActiveComponent = activeTest?.component;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Шапка */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🧪</span>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Песочница</h1>
                        <p className="text-sm text-gray-500">
                            Изолированная среда для тестирования VK API и функционала
                        </p>
                    </div>
                </div>

                {/* Вкладки тестов */}
                {SANDBOX_TESTS.length > 1 && (
                    <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-[1px]">
                        {SANDBOX_TESTS.map((test) => (
                            <button
                                key={test.id}
                                onClick={() => setActiveTestId(test.id)}
                                className={`px-4 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
                                    activeTestId === test.id
                                        ? 'bg-white text-indigo-700 border-gray-200'
                                        : 'bg-gray-50 text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
                                }`}
                                title={test.description}
                            >
                                {test.title}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Содержимое теста */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {ActiveComponent ? (
                    <ActiveComponent />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Выберите тест</p>
                    </div>
                )}
            </div>
        </div>
    );
};
