import React, { useState } from 'react';

// =====================================================================
// AI-ПОМОЩНИК В ПОСТЕ (2.1.7.6)
// =====================================================================

// Mock: Кнопка "AI-помощник" (text-only, без иконки)
export const AIButtonDemo: React.FC = () => {
    const [isActive, setIsActive] = useState(false);

    return (
        <div className="space-y-4">
            {/* Пример в контексте панели редактирования */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Инструменты редактирования</span>
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`px-3 py-1 text-sm font-medium rounded-md border transition-colors ${
                            isActive 
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                        }`}
                    >
                        AI-помощник
                    </button>
                </div>
                
                {isActive && (
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm text-indigo-700">
                            ✨ AI-помощник активен
                        </p>
                    </div>
                )}
            </div>

            {/* Индикатор состояния */}
            <div className="text-sm text-gray-600">
                <strong>Текущее состояние:</strong> {isActive ? '🟢 Открыт' : '⚪ Закрыт'}
            </div>
        </div>
    );
};

// Mock: 6 быстрых действий с иконками
export const QuickActionsDemo: React.FC = () => {
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = (action: string) => {
        setSelectedAction(action);
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="space-y-4">
            {/* Панель быстрых действий */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Быстрые действия:</p>
                <div className="flex flex-wrap gap-2">
                    {/* 1. Рерайт (с иконкой SVG) */}
                    <button
                        onClick={() => handleAction('Рерайт')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Переписать основной текст поста, сохранив смысл"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                        </svg>
                        Рерайт
                    </button>

                    {/* 2. Исправить ошибки (с иконкой SVG) */}
                    <button
                        onClick={() => handleAction('Исправить ошибки')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Исправить орфографию и пунктуацию в основном тексте поста"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Исправить ошибки
                    </button>

                    {/* 3. Сократи (text-only) */}
                    <button
                        onClick={() => handleAction('Сократи')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Сократить текст, сохранив смысл"
                    >
                        Сократи
                    </button>

                    {/* 4. Расширь (text-only) */}
                    <button
                        onClick={() => handleAction('Расширь')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Расширить текст, добавив деталей"
                    >
                        Расширь
                    </button>

                    {/* 5. + эмоджи (text-only) */}
                    <button
                        onClick={() => handleAction('+ эмоджи')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Добавить эмоджи в текст"
                    >
                        + эмоджи
                    </button>

                    {/* 6. - эмоджи (text-only) */}
                    <button
                        onClick={() => handleAction('- эмоджи')}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        title="Убрать лишние эмоджи из текста"
                    >
                        - эмоджи
                    </button>
                </div>

                {/* Индикатор работы */}
                {isProcessing && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                            ⏳ Обработка: {selectedAction}...
                        </p>
                    </div>
                )}

                {!isProcessing && selectedAction && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700">
                            ✅ Действие "{selectedAction}" выполнено
                        </p>
                    </div>
                )}
            </div>

            {/* Подсказка */}
            <div className="text-xs text-gray-500">
                💡 Первые 2 кнопки имеют иконки, остальные 4 — только текст
            </div>
        </div>
    );
};

// Mock: Чат-диалог с AI
export const ChatDialogDemo: React.FC = () => {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
        { role: 'user', text: 'Сделай текст более официальным' },
        { role: 'ai', text: 'Уважаемые коллеги! Представляем вашему вниманию новое предложение по оптимизации рабочих процессов.' }
    ]);
    const [inputValue, setInputValue] = useState('');

    const handleSend = () => {
        if (!inputValue.trim()) return;
        
        setMessages([...messages, { role: 'user', text: inputValue }]);
        setInputValue('');

        // Имитация ответа AI
        setTimeout(() => {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: 'Вот переработанный вариант текста с учётом вашего запроса.' 
            }]);
        }, 1000);
    };

    return (
        <div className="bg-white border border-indigo-200 rounded-lg overflow-hidden">
            {/* История чата */}
            <div className="h-64 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm">Начните диалог с AI</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Поле ввода */}
            <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Напишите запрос AI..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mock: Системные инструкции (toggle + presets)
export const SystemPromptDemo: React.FC = () => {
    const [useCustom, setUseCustom] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string>('default');

    const presets = [
        { id: 'default', name: 'По умолчанию' },
        { id: 'formal', name: 'Официальный стиль' },
        { id: 'creative', name: 'Креативный' },
        { id: 'concise', name: 'Краткий' }
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Использовать свои инструкции</span>
                <button 
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                        useCustom ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                    onClick={() => setUseCustom(!useCustom)}
                >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                        useCustom ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                </button>
            </div>

            {/* Presets selector */}
            {useCustom && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Выберите пресет:</label>
                    <select
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {presets.map(preset => (
                            <option key={preset.id} value={preset.id}>
                                {preset.name}
                            </option>
                        ))}
                    </select>

                    <textarea
                        placeholder="Или введите свои инструкции..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                </div>
            )}

            {/* Индикатор */}
            <div className="text-xs text-gray-500">
                {useCustom ? '🎨 Используются кастомные инструкции' : '📋 Используются стандартные инструкции'}
            </div>
        </div>
    );
};

// Mock: Селектор контекста (товары, компания)
export const ContextSelectorDemo: React.FC = () => {
    const [contextOpen, setContextOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    const products = [
        { id: '1', name: 'iPhone 15 Pro', price: '89990 ₽' },
        { id: '2', name: 'AirPods Pro', price: '24990 ₽' },
        { id: '3', name: 'MacBook Air M2', price: '109990 ₽' }
    ];

    return (
        <div className="space-y-3">
            <button
                onClick={() => setContextOpen(!contextOpen)}
                className="w-full px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
            >
                {contextOpen ? '▼' : '▶'} Добавить контекст проекта
            </button>

            {contextOpen && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Товары:</label>
                        <div className="space-y-2">
                            {products.map(product => (
                                <label key={product.id} className="flex items-start gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedProduct === product.id}
                                        onChange={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                                        className="mt-1"
                                    />
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{product.name}</div>
                                        <div className="text-gray-500">{product.price}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-700">
                                ✅ Контекст добавлен: AI будет учитывать информацию о товаре
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Mock: Действия с сообщением (Regenerate, Copy, Add to post)
export const MessageActionsDemo: React.FC = () => {
    const [action, setAction] = useState<string | null>(null);

    const handleAction = (actionName: string) => {
        setAction(actionName);
        setTimeout(() => setAction(null), 2000);
    };

    return (
        <div className="space-y-3">
            {/* Пример AI-сообщения с кнопками */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-800 mb-3">
                    Вот переработанный текст: "Новая коллекция смартфонов уже в наличии! 📱"
                </p>

                {/* Кнопки действий */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAction('Regenerate')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        title="Сгенерировать заново"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2a9 9 0 11-2.064-5.364M20 4v5h-5" />
                        </svg>
                        Regenerate
                    </button>

                    <button
                        onClick={() => handleAction('Copy')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        title="Скопировать"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                    </button>

                    <button
                        onClick={() => handleAction('Add to post')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
                        title="Добавить в пост"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add to post
                    </button>
                </div>
            </div>

            {/* Индикатор действия */}
            {action && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                        ✅ Действие "{action}" выполнено
                    </p>
                </div>
            )}
        </div>
    );
};
