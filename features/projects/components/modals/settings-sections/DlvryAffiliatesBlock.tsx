import React, { useState, useEffect, useCallback } from 'react';
import {
    DlvryAffiliate,
    fetchDlvryAffiliates,
    createDlvryAffiliate,
    deleteDlvryAffiliate,
} from '../../../../../services/api/dlvryAffiliates.api';

interface DlvryAffiliatesBlockProps {
    projectId: string;
    isSaving: boolean;
}

export const DlvryAffiliatesBlock: React.FC<DlvryAffiliatesBlockProps> = ({ projectId, isSaving }) => {
    const [affiliates, setAffiliates] = useState<DlvryAffiliate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Форма добавления
    const [newAffiliateId, setNewAffiliateId] = useState('');
    const [newAffiliateName, setNewAffiliateName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadAffiliates = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchDlvryAffiliates(projectId);
            setAffiliates(data);
        } catch (e: any) {
            setError(e.message || 'Ошибка загрузки филиалов');
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadAffiliates();
    }, [loadAffiliates]);

    const handleAdd = async () => {
        const trimmedId = newAffiliateId.trim();
        if (!trimmedId) return;
        setIsAdding(true);
        setError(null);
        try {
            await createDlvryAffiliate(projectId, {
                affiliate_id: trimmedId,
                name: newAffiliateName.trim() || undefined,
            });
            setNewAffiliateId('');
            setNewAffiliateName('');
            await loadAffiliates();
        } catch (e: any) {
            setError(e.message || 'Ошибка добавления филиала');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (recordId: string) => {
        setDeletingId(recordId);
        setError(null);
        try {
            await deleteDlvryAffiliate(recordId);
            await loadAffiliates();
        } catch (e: any) {
            setError(e.message || 'Ошибка удаления филиала');
        } finally {
            setDeletingId(null);
        }
    };

    const disabled = isSaving || isAdding;

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Филиалы DLVRY</label>

            {/* Список существующих */}
            {isLoading ? (
                <p className="text-xs text-gray-400 italic py-2">Загрузка филиалов...</p>
            ) : affiliates.length === 0 ? (
                <p className="text-sm text-center text-gray-400 py-2 italic border border-dashed border-orange-200 rounded-md">
                    Нет привязанных филиалов
                </p>
            ) : (
                <div className="space-y-2">
                    {affiliates.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 animate-fade-in-up">
                            <div className="flex-1 flex items-center gap-2 border border-orange-200 rounded px-3 py-2 bg-white">
                                <span className="text-sm font-mono text-orange-800">{a.affiliate_id}</span>
                                {a.name && (
                                    <span className="text-xs text-gray-500">— {a.name}</span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(a.id)}
                                disabled={disabled || deletingId === a.id}
                                className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                                title="Удалить филиал"
                            >
                                {deletingId === a.id ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Форма добавления */}
            <div className="flex items-end gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newAffiliateId}
                        onChange={(e) => setNewAffiliateId(e.target.value)}
                        disabled={disabled}
                        className="w-36 border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 font-mono"
                        placeholder="ID филиала"
                    />
                    <input
                        type="text"
                        value={newAffiliateName}
                        onChange={(e) => setNewAffiliateName(e.target.value)}
                        disabled={disabled}
                        className="flex-1 border rounded px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                        placeholder="Название (необязательно)"
                    />
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={disabled || !newAffiliateId.trim()}
                    className="px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isAdding ? '...' : '+ Добавить'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
};
