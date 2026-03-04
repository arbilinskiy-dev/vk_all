import React, { useState } from 'react';

// =====================================================================
// TEXT EDITING: Mock-компоненты для страницы "Работа с текстом"
// =====================================================================

// Mock-компонент: Текстовый редактор с кнопками управления
export const TextEditorDemo: React.FC = () => {
    const [text, setText] = useState('Привет! 👋 Это пример текста в редакторе.\n\nВы можете использовать переменные, AI-помощника и эмодзи.');
    const [showVariables, setShowVariables] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);

    return (
        <div className="bg-white rounded-lg border border-gray-300 p-4">
            {/* Панель инструментов */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <button
                    onClick={() => setShowVariables(!showVariables)}
                    className={`px-3 py-1 text-sm font-medium rounded-md border transition-colors ${
                        showVariables 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                            : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                >
                    Переменные
                </button>
                <button
                    onClick={() => setShowAI(!showAI)}
                    className={`px-3 py-1 text-sm font-medium rounded-md border transition-colors ${
                        showAI 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                            : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                >
                    AI-помощник
                </button>
                <span className="text-gray-300">|</span>
                <button
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Обновить переменные"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 3.938 9m0 0H9m4 11v-5h-.582M12.062 15a8.001 8.001 0 0 0 11.52-6.938" />
                    </svg>
                </button>
                <button
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Настроить переменные"
                >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                </button>
            </div>

            {/* Textarea с кнопкой эмодзи */}
            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full min-h-[120px] p-3 pr-10 text-sm text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none custom-scrollbar"
                    placeholder="Введите текст поста..."
                />
                <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Добавить эмодзи"
                >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                        <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14s1.5 2 4 2 4-2 4-2" />
                    </svg>
                </button>
            </div>

            {/* Счетчик символов (фейковый - в реале его нет) */}
            <div className="mt-2 text-xs text-gray-500">
                Символов: {text.length}
            </div>
        </div>
    );
};

// Mock-компонент: Панель выбора переменных
export const VariablesSelectorDemo: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'global' | 'project' | 'vk'>('global');
    const [searchQuery, setSearchQuery] = useState('');

    const globalVars = [
        { name: 'Благодарность автору', value: '{global_AUTHOR_THANKS}' },
        { name: 'Хештег проекта', value: '{global_PROJECT_HASHTAG}' },
        { name: 'Призыв к подписке', value: '{global_SUBSCRIBE_CTA}' },
    ];

    const projectVars = [
        { name: 'Ссылка на сообщество', value: 'https://vk.com/mygroup' },
        { name: 'Ссылка на сообщения', value: 'https://vk.me/mygroup' },
        { name: 'Название сообщества', value: 'Моё сообщество' },
        { name: 'Упоминание сообщества', value: '@mygroup (Моё сообщество)' },
    ];

    const vkConstructs = [
        { name: '[ссылка|текст]', value: '[https://vk.com|Текст ссылки]' },
        { name: '@упоминание', value: '@mygroup (название)' },
    ];

    const getCurrentVars = () => {
        if (activeTab === 'global') return globalVars;
        if (activeTab === 'project') return projectVars;
        return vkConstructs;
    };

    const filteredVars = getCurrentVars().filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {[
                    { key: 'global' as const, label: 'Глобальные' },
                    { key: 'project' as const, label: 'Проектные' },
                    { key: 'vk' as const, label: 'Конструкции VK' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.key
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Поиск */}
            <div className="p-3 border-b border-gray-200">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск переменных..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Список переменных */}
            <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 gap-2">
                    {filteredVars.map((variable, idx) => (
                        <button
                            key={idx}
                            className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-md transition-colors"
                        >
                            <div className="font-medium text-gray-900">{variable.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 font-mono">{variable.value}</div>
                        </button>
                    ))}
                </div>
                {filteredVars.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">Переменные не найдены</p>
                )}
            </div>
        </div>
    );
};

// Mock-компонент: Быстрые действия AI
export const AIQuickActionsDemo: React.FC = () => {
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const actions = [
        { 
            id: 'rewrite', 
            label: 'Рерайт', 
            hasIcon: true,
            description: 'Переписать текст, сохранив смысл' 
        },
        { 
            id: 'fix', 
            label: 'Исправить ошибки', 
            hasIcon: true,
            description: 'Исправить орфографию и пунктуацию' 
        },
        { 
            id: 'shorten', 
            label: 'Сократи', 
            hasIcon: false,
            description: 'Сократить текст' 
        },
        { 
            id: 'expand', 
            label: 'Расширь', 
            hasIcon: false,
            description: 'Добавить деталей' 
        },
        { 
            id: 'add-emoji', 
            label: '+ эмоджи', 
            hasIcon: false,
            description: 'Добавить эмодзи' 
        },
        { 
            id: 'remove-emoji', 
            label: '- эмоджи', 
            hasIcon: false,
            description: 'Убрать лишние эмодзи' 
        },
    ];

    const handleAction = (id: string) => {
        setSelectedAction(id);
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setSelectedAction(null);
        }, 1500);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-300 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Быстрые действия</h4>
            <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                    <button
                        key={action.id}
                        onClick={() => handleAction(action.id)}
                        disabled={isProcessing}
                        title={action.description}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                        {action.hasIcon && action.id === 'rewrite' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 3.938 9m0 0H9m4 11v-5h-.582M12.062 15a8.001 8.001 0 0 0 11.52-6.938" />
                            </svg>
                        )}
                        {action.hasIcon && action.id === 'fix' && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                        )}
                        <span>{selectedAction === action.id && isProcessing ? 'Обработка...' : action.label}</span>
                    </button>
                ))}
            </div>
            {selectedAction && isProcessing && (
                <div className="mt-3 p-2 bg-indigo-50 rounded-md border border-indigo-200">
                    <p className="text-xs text-indigo-700">⏳ AI обрабатывает ваш запрос...</p>
                </div>
            )}
        </div>
    );
};

// Mock-компонент: Emoji Picker
export const EmojiPickerDemo: React.FC = () => {
    const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

    const emojiCategories = {
        'Смайлики': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘'],
        'Жесты': ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾'],
        'Символы': ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗'],
    };

    return (
        <div className="bg-white rounded-lg border border-gray-300 p-4 max-w-md">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Выберите эмодзи</h4>
                <button className="text-xs text-gray-500 hover:text-gray-700">Закрыть</button>
            </div>

            {/* Поиск */}
            <input
                type="text"
                placeholder="Поиск эмодзи..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-3"
            />

            {/* Категории и эмодзи */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <div key={category}>
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">{category}</h5>
                        <div className="grid grid-cols-8 gap-2">
                            {emojis.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedEmoji(emoji)}
                                    className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-indigo-50 rounded transition-colors ${
                                        selectedEmoji === emoji ? 'bg-indigo-100' : ''
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {selectedEmoji && (
                <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-200">
                    <p className="text-xs text-green-700">✅ Эмодзи {selectedEmoji} вставлен в текст</p>
                </div>
            )}
        </div>
    );
};

// Mock-компонент: Демонстрация валидации
export const TextValidationDemo: React.FC = () => {
    const [text, setText] = useState('');
    const [hasMedia, setHasMedia] = useState(false);
    const [showError, setShowError] = useState(false);

    const handleSave = () => {
        if (!text.trim() && !hasMedia) {
            setShowError(true);
        } else {
            setShowError(false);
            alert('✅ Пост сохранен!');
        }
    };

    const canSave = text.trim() || hasMedia;

    return (
        <div className="bg-white rounded-lg border border-gray-300 p-4">
            <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Текст поста</label>
                <textarea
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setShowError(false);
                    }}
                    className="w-full min-h-[80px] p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Введите текст..."
                />
            </div>

            <div className="mb-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={hasMedia}
                        onChange={(e) => {
                            setHasMedia(e.target.checked);
                            setShowError(false);
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Есть изображения или медиа</span>
                </label>
            </div>

            {showError && (
                <div className="mb-3 p-3 bg-red-50 rounded-md border border-red-200">
                    <p className="text-sm text-red-700">❌ Текст поста не может быть пустым. Введите текст.</p>
                </div>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        canSave
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Сохранить
                </button>
                <p className="text-xs text-gray-500">
                    {canSave 
                        ? '✅ Можно сохранить' 
                        : '⚠️ Нужен текст или медиа'
                    }
                </p>
            </div>
        </div>
    );
};
