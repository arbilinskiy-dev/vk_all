import React from 'react';

// =====================================================================
// MockSaveResultsModal — результаты сохранения
// =====================================================================
interface MockSaveResultsModalProps {
    successCount: number;
    errors: Array<{ product: string; error: string }>;
    onClose: () => void;
}

export const MockSaveResultsModal: React.FC<MockSaveResultsModalProps> = ({
    successCount,
    errors,
    onClose
}) => {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                {/* Заголовок */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Результат сохранения</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Контент */}
                <div className="px-6 py-4 overflow-y-auto custom-scrollbar">
                    {/* Успешно сохранено */}
                    {successCount > 0 && (
                        <div className="p-4 rounded-lg flex items-start gap-3 bg-green-50 border border-green-100 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <div>
                                <p className="font-medium text-green-900">
                                    Успешно сохранено: {successCount} {successCount === 1 ? 'товар' : 'товаров'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Ошибки */}
                    {errors.length > 0 && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                            <div className="flex items-start gap-3 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <div className="flex-1">
                                    <p className="font-medium text-red-900 mb-2">
                                        Ошибки при сохранении: {errors.length} {errors.length === 1 ? 'товар' : 'товаров'}
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        {errors.map((error, idx) => (
                                            <li key={idx} className="text-red-700">
                                                <span className="font-medium">{error.product}:</span> {error.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Кнопка закрытия */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};
