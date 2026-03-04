import React from 'react';

// =====================================================================
// Inline mock-компоненты для страницы "Футер и кнопка сохранения"
// =====================================================================

/**
 * Мок: интерактивная демонстрация состояний футера
 * (обычное, пустое поле, идёт сохранение)
 */
export const MockFooterStatesInline: React.FC = () => {
    const [state, setState] = React.useState<'normal' | 'empty' | 'saving'>('normal');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-2">
                <button
                    onClick={() => setState('normal')}
                    className={`px-4 py-2 rounded ${
                        state === 'normal'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Обычное состояние
                </button>
                <button
                    onClick={() => setState('empty')}
                    className={`px-4 py-2 rounded ${
                        state === 'empty'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Поле пустое
                </button>
                <button
                    onClick={() => setState('saving')}
                    className={`px-4 py-2 rounded ${
                        state === 'saving'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Идёт сохранение
                </button>
            </div>

            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="p-4 border-b">
                    <input
                        type="text"
                        placeholder="Название альбома"
                        value={state === 'empty' ? '' : 'Мой альбом'}
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                        readOnly
                    />
                </div>

                <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50 flex-shrink-0">
                    <button
                        disabled={state === 'saving'}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Отмена
                    </button>
                    <button
                        disabled={state === 'empty' || state === 'saving'}
                        className={`w-28 px-4 py-2 rounded flex justify-center items-center ${
                            state === 'empty' || state === 'saving'
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {state === 'saving' ? (
                            <div className="loader border-white border-t-transparent h-4 w-4" style={{
                                borderRadius: '50%',
                                border: '2px solid',
                                animation: 'spin 0.6s linear infinite'
                            }}></div>
                        ) : (
                            'Сохранить'
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

/**
 * Мок: варианты расположения кнопок в футере
 * (стандартный, justify-between, одна кнопка)
 */
export const MockFooterVariantsInline: React.FC = () => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                    Стандартный футер (justify-end)
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                        <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
                            Отмена
                        </button>
                        <button className="w-28 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                            Сохранить
                        </button>
                    </footer>
                </div>
            </div>

            <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                    Футер поста (justify-between)
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <footer className="p-4 border-t flex justify-between items-center bg-gray-50">
                        <button className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
                            Удалить
                        </button>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">
                                Отмена
                            </button>
                            <button className="w-28 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                                Сохранить
                            </button>
                        </div>
                    </footer>
                </div>
            </div>

            <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">
                    Футер с одной кнопкой
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <footer className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                        <button className="w-28 px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
                            Готово
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
};
