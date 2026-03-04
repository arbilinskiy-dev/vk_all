import React, { useState } from 'react';
import {
    MockModalHeader,
    MockContentSection,
    MockImageGrid,
    MockModalFooter,
    MockToggle,
    MockTextarea,
} from './PostModalMocks_Helpers';

// =====================================================================
// Основные mock-компоненты модального окна (просмотр, редактирование, копирование)
// =====================================================================

// Mock модального окна в режиме просмотра (view)
export const MockPostModalView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <MockModalHeader title="Просмотр поста" onClose={onClose} />

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <MockContentSection title="Дата публикации">
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
                            15 февраля 2026, 14:00
                        </div>
                    </MockContentSection>

                    <MockContentSection title="Текст поста">
                        <div className="text-sm text-gray-700 bg-gray-50 rounded-md px-4 py-3 whitespace-pre-wrap">
                            Это пример текста поста в режиме просмотра.{'\n\n'}
                            Здесь может быть несколько абзацев, эмодзи 🎉, ссылки и другие элементы форматирования.
                        </div>
                    </MockContentSection>

                    <MockContentSection title="Изображения (3)">
                        <MockImageGrid count={3} disabled={true} />
                    </MockContentSection>
                </div>

                {/* Footer */}
                <MockModalFooter
                    leftButtons={
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100 rounded-md border border-transparent">
                                Опубликовать сейчас
                            </button>
                        </>
                    }
                    rightButtons={
                        <>
                            <button className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md">
                                Редактировать
                            </button>
                        </>
                    }
                />
            </div>
        </div>
    );
};

// Mock модального окна в режиме редактирования (edit)
export const MockPostModalEdit: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [text, setText] = useState('Редактируемый текст поста...');
    const [isBulk, setIsBulk] = useState(false);
    const [isCyclic, setIsCyclic] = useState(false);
    const [isMultiProject, setIsMultiProject] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <MockModalHeader title="Редактировать пост" onClose={onClose} />

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Способ публикации */}
                    <MockContentSection title="Способ публикации">
                        <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                            <button className="flex-1 px-4 py-2 text-sm font-medium bg-white shadow text-indigo-700 rounded transition-colors">
                                Запланировать
                            </button>
                            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded transition-colors">
                                В отложку VK
                            </button>
                            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded transition-colors">
                                Опубликовать
                            </button>
                        </div>
                    </MockContentSection>

                    {/* Опции создания */}
                    <MockContentSection title="Опции создания">
                        <div className="bg-gray-50 rounded-md p-4 space-y-2">
                            <MockToggle
                                label="Создать несколько постов (до 10 дат)"
                                checked={isBulk}
                                onChange={() => setIsBulk(!isBulk)}
                                disabled={isCyclic}
                            />
                            <MockToggle
                                label="Циклическая публикация"
                                checked={isCyclic}
                                onChange={() => setIsCyclic(!isCyclic)}
                                disabled={isBulk}
                            />
                            <MockToggle
                                label="Мультипроектная публикация"
                                checked={isMultiProject}
                                onChange={() => setIsMultiProject(!isMultiProject)}
                            />
                        </div>
                    </MockContentSection>

                    {/* Дата */}
                    <MockContentSection title="Дата и время">
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                defaultValue="2026-02-15"
                            />
                            <input
                                type="time"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                defaultValue="14:00"
                            />
                        </div>
                    </MockContentSection>

                    {/* Текст */}
                    <MockContentSection title="Текст поста">
                        <div className="mb-2 flex gap-2">
                            <button className="px-3 py-1 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors">
                                AI-помощник
                            </button>
                            <button className="px-3 py-1 text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors">
                                Переменные
                            </button>
                            <button className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors" title="Emoji">
                                😊
                            </button>
                        </div>
                        <MockTextarea value={text} onChange={setText} placeholder="Введите текст поста..." />
                    </MockContentSection>

                    {/* Изображения */}
                    <MockContentSection title="Изображения">
                        <div className="mb-2 flex gap-2">
                            <button className="px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded-md">
                                Загрузить
                            </button>
                            <button className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-md">
                                Добавить из галереи
                            </button>
                        </div>
                        <MockImageGrid count={4} />
                    </MockContentSection>
                </div>

                {/* Footer */}
                <MockModalFooter
                    leftButtons={
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200">
                                Удалить
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-100 rounded-md border border-transparent">
                                Опубликовать сейчас
                            </button>
                        </>
                    }
                    rightButtons={
                        <>
                            <button className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md">
                                Сохранить
                            </button>
                        </>
                    }
                />
            </div>
        </div>
    );
};

// Mock модального окна в режиме копирования (copy)
export const MockPostModalCopy: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [text, setText] = useState('Копия поста с новой датой и возможностью изменений...');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <MockModalHeader title="Копирование поста" onClose={onClose} />

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Уведомление о копировании */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                        <p className="text-sm text-blue-800">
                            <strong>Режим копирования:</strong> Дата автоматически сдвинута на +1 день. 
                            Вы можете изменить все поля перед сохранением.
                        </p>
                    </div>

                    {/* Способ публикации */}
                    <MockContentSection title="Способ публикации">
                        <div className="flex rounded-md p-1 bg-gray-200 gap-1">
                            <button className="flex-1 px-4 py-2 text-sm font-medium bg-white shadow text-indigo-700 rounded transition-colors">
                                Запланировать
                            </button>
                            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded transition-colors">
                                В отложку VK
                            </button>
                            <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded transition-colors">
                                Опубликовать
                            </button>
                        </div>
                    </MockContentSection>

                    {/* Дата (сдвинута) */}
                    <MockContentSection title="Дата и время">
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                defaultValue="2026-02-16"
                            />
                            <input
                                type="time"
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                defaultValue="14:00"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Дата изменена с 15.02 на 16.02</p>
                    </MockContentSection>

                    {/* Текст */}
                    <MockContentSection title="Текст поста">
                        <MockTextarea value={text} onChange={setText} placeholder="Введите текст поста..." />
                    </MockContentSection>

                    {/* Изображения */}
                    <MockContentSection title="Изображения (скопированы)">
                        <MockImageGrid count={3} />
                    </MockContentSection>
                </div>

                {/* Footer */}
                <MockModalFooter
                    rightButtons={
                        <>
                            <button className="px-4 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 rounded-md">
                                Запланировать
                            </button>
                        </>
                    }
                />
            </div>
        </div>
    );
};

// =====================================================================
// Демо-компонент с переключением режимов
// =====================================================================
export const PostModalModesDemo: React.FC = () => {
    const [activeMode, setActiveMode] = useState<'view' | 'edit' | 'copy' | null>(null);

    return (
        <>
            <div className="flex gap-3">
                <button
                    onClick={() => setActiveMode('view')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-200 rounded-lg transition-all font-medium text-blue-900"
                >
                    Режим просмотра
                </button>
                <button
                    onClick={() => setActiveMode('edit')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 rounded-lg transition-all font-medium text-purple-900"
                >
                    Режим редактирования
                </button>
                <button
                    onClick={() => setActiveMode('copy')}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200 rounded-lg transition-all font-medium text-green-900"
                >
                    Режим копирования
                </button>
            </div>

            {activeMode === 'view' && <MockPostModalView onClose={() => setActiveMode(null)} />}
            {activeMode === 'edit' && <MockPostModalEdit onClose={() => setActiveMode(null)} />}
            {activeMode === 'copy' && <MockPostModalCopy onClose={() => setActiveMode(null)} />}
        </>
    );
};

// =====================================================================
// Сравнение структуры модалок
// =====================================================================
export const ModalStructureComparison: React.FC = () => {
    return (
        <div className="grid grid-cols-3 gap-4">
            {/* View */}
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50/30">
                <h5 className="font-bold text-blue-900 mb-3 text-center">Просмотр</h5>
                <div className="space-y-2 text-xs text-blue-800">
                    <div className="bg-white p-2 rounded border border-blue-200">Шапка: "Просмотр поста"</div>
                    <div className="bg-white p-2 rounded border border-blue-200">📅 Дата (только чтение)</div>
                    <div className="bg-white p-2 rounded border border-blue-200">📝 Текст (только чтение)</div>
                    <div className="bg-white p-2 rounded border border-blue-200">🖼 Изображения (без удаления)</div>
                    <div className="bg-blue-100 p-2 rounded border border-blue-300 font-medium">
                        Футер: "Опубликовать" + "Редактировать"
                    </div>
                </div>
            </div>

            {/* Edit */}
            <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50/30">
                <h5 className="font-bold text-purple-900 mb-3 text-center">Редактирование</h5>
                <div className="space-y-2 text-xs text-purple-800">
                    <div className="bg-white p-2 rounded border border-purple-200">Шапка: "Редактировать пост"</div>
                    <div className="bg-white p-2 rounded border border-purple-200">🔀 Способ публикации (3 кнопки)</div>
                    <div className="bg-white p-2 rounded border border-purple-200">⚙️ Опции (Toggles)</div>
                    <div className="bg-white p-2 rounded border border-purple-200">📅 Дата (редактируется)</div>
                    <div className="bg-white p-2 rounded border border-purple-200">📝 Текст + Панель инструментов</div>
                    <div className="bg-white p-2 rounded border border-purple-200">🖼 Изображения + Загрузка</div>
                    <div className="bg-purple-100 p-2 rounded border border-purple-300 font-medium">
                        Футер: "Удалить" + "Опубликовать" + "Сохранить"
                    </div>
                </div>
            </div>

            {/* Copy */}
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50/30">
                <h5 className="font-bold text-green-900 mb-3 text-center">Копирование</h5>
                <div className="space-y-2 text-xs text-green-800">
                    <div className="bg-white p-2 rounded border border-green-200">Шапка: "Копирование поста"</div>
                    <div className="bg-green-100 p-2 rounded border border-green-300">💡 Уведомление (дата +1)</div>
                    <div className="bg-white p-2 rounded border border-green-200">🔀 Способ публикации</div>
                    <div className="bg-white p-2 rounded border border-green-200">📅 Дата (сдвинута на +1 день)</div>
                    <div className="bg-white p-2 rounded border border-green-200">📝 Текст (редактируется)</div>
                    <div className="bg-white p-2 rounded border border-green-200">🖼 Изображения (скопированы)</div>
                    <div className="bg-green-100 p-2 rounded border border-green-300 font-medium">
                        Футер: "Отмена" + "Запланировать"
                    </div>
                </div>
            </div>
        </div>
    );
};
