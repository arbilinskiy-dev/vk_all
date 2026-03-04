import React, { useState } from 'react';

// =====================================================================
// Общие механики модального окна: dirty check, lock state, валидация
// =====================================================================

// Mock: Демонстрация работы подтверждения при закрытии (dirty check)
export const DirtyCheckDemo: React.FC = () => {
    const [showModal, setShowModal] = useState(false);
    const [text, setText] = useState('');
    const [showAI, setShowAI] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [attemptedClose, setAttemptedClose] = useState(false);

    const isDirty = text.trim() !== '' || showAI;

    const handleClose = () => {
        if (isDirty) {
            setShowConfirm(true);
            setAttemptedClose(true);
        } else {
            setShowModal(false);
            setText('');
            setShowAI(false);
            setAttemptedClose(false);
        }
    };

    const confirmClose = () => {
        setShowModal(false);
        setText('');
        setShowAI(false);
        setShowConfirm(false);
        setAttemptedClose(false);
    };

    return (
        <div>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
                Открыть всплывающее окно
            </button>

            {showModal && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        {/* Modal */}
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Редактировать пост</h3>
                                <button
                                    onClick={handleClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Текст поста:</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Введите текст..."
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isDirty ? '✏️ Есть несохранённые изменения' : '✓ Нет изменений'}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <button
                                        onClick={() => setShowAI(!showAI)}
                                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm"
                                    >
                                        {showAI ? '🤖 AI-панель открыта' : 'Открыть AI-помощника'}
                                    </button>
                                    {showAI && (
                                        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-800">
                                            AI-панель активна (это тоже считается изменением!)
                                        </div>
                                    )}
                                </div>

                                {attemptedClose && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                                        ⚠️ Вы пытались закрыть окно, но есть несохранённые изменения!
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setText('');
                                        setShowAI(false);
                                        setAttemptedClose(false);
                                    }}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Modal */}
                    {showConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Несохранённые изменения</h3>
                                <p className="text-sm text-gray-600 mb-6">
                                    У вас есть несохранённые изменения. Вы уверены, что хотите закрыть окно без сохранения?
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowConfirm(false);
                                            setAttemptedClose(false);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm font-medium"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={confirmClose}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                                    >
                                        Да, закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// =====================================================================
// Mock: Демонстрация состояния блокировки (lock state)
// =====================================================================
export const LockStateDemo: React.FC = () => {
    const [isLocked, setIsLocked] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Статус поста:</span>
                <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isLocked
                            ? 'bg-orange-100 text-orange-700 border border-orange-300'
                            : 'bg-green-100 text-green-700 border border-green-300'
                    }`}
                >
                    {isLocked ? '🔒 Публикуется...' : '✓ Готов'}
                </button>
            </div>

            <div className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Кнопки в футере:</h4>
                <div className="space-y-2">
                    <button
                        disabled={isLocked}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isLocked
                                ? 'bg-red-100 text-red-400 border border-red-200 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        }`}
                    >
                        {isLocked ? '🔒 Удалить (заблокировано)' : 'Удалить'}
                    </button>
                    <button
                        disabled={isLocked}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isLocked
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-white text-green-600 border border-transparent hover:bg-green-100'
                        }`}
                    >
                        {isLocked ? '🔒 Опубликовать сейчас (заблокировано)' : 'Опубликовать сейчас'}
                    </button>
                    <button
                        disabled={isLocked}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            isLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {isLocked ? '🔒 Сохранить (заблокировано)' : 'Сохранить'}
                    </button>
                </div>
                {isLocked && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                        ⚠️ Пост в процессе публикации — все кнопки заблокированы, кроме кнопки закрытия окна
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================================
// Mock: Демонстрация валидации
// =====================================================================
export const ValidationDemo: React.FC = () => {
    const [text, setText] = useState('');
    const [hasImages, setHasImages] = useState(false);
    const [error, setError] = useState('');

    const handleSave = () => {
        if (!text.trim() && !hasImages) {
            setError('Не удалось сохранить: Текст поста не может быть пустым. Введите текст.');
        } else {
            setError('');
            alert('✓ Пост успешно сохранён!');
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Текст поста:</label>
                <textarea
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setError('');
                    }}
                    placeholder="Введите текст..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                    type="checkbox"
                    id="images"
                    checked={hasImages}
                    onChange={(e) => {
                        setHasImages(e.target.checked);
                        setError('');
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="images" className="text-sm text-gray-700">
                    Есть прикреплённые изображения
                </label>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <button
                onClick={handleSave}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
            >
                Сохранить
            </button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                💡 <strong>Правило:</strong> Пост можно сохранить только если есть текст ИЛИ хотя бы одно изображение
            </div>
        </div>
    );
};
