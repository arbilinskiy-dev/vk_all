import React, { useState } from 'react';

// =====================================================================
// Демо: Статусы промокодов (Свободен / Выдан)
// =====================================================================
export const StatusesDemo: React.FC = () => {
    const [selectedStatus, setSelectedStatus] = useState<'free' | 'issued'>('free');

    return (
        <div className="flex flex-col gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Выберите статус:</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setSelectedStatus('free')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            selectedStatus === 'free'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Свободен
                    </button>
                    <button
                        onClick={() => setSelectedStatus('issued')}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            selectedStatus === 'issued'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        Выдан
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Отображение в таблице:</p>
                {selectedStatus === 'free' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        Свободен
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        Выдан
                    </span>
                )}
                <div className="mt-3 text-sm text-gray-700">
                    {selectedStatus === 'free' ? (
                        <>
                            <p className="font-semibold text-green-700">✓ Промокод в запасе</p>
                            <p className="text-xs text-gray-500 mt-1">Этот код еще не выдан победителю. Его можно редактировать, удалить или он будет автоматически использован при следующем розыгрыше.</p>
                            <p className="text-xs text-gray-500 mt-2"><strong>Доступные действия:</strong> редактирование описания, удаление, выделение чекбоксом для массового удаления.</p>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-gray-700">✓ Промокод вручен победителю</p>
                            <p className="text-xs text-gray-500 mt-1">Этот код уже использован в розыгрыше. Показывает кому выдан, когда и можно открыть диалог с победителем.</p>
                            <p className="text-xs text-gray-500 mt-2"><strong>Доступные действия:</strong> просмотр информации о победителе, переход в диалог ВК. Редактирование и удаление недоступны.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
