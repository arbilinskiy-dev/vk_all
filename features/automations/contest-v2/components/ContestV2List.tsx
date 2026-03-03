/**
 * Список конкурсов 2.0
 * Копия структуры GeneralContestsList
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ContestV2 } from '../types';
import { ContestV2Card } from './ContestV2Card';
import { getContestsV2, deleteContestV2 } from '../../../../services/api/contestV2.api';
import { ConfirmationModal } from '../../../../shared/components/modals/ConfirmationModal';
import { useToast } from '../../../../shared/components/ToastProvider';

interface ContestV2ListProps {
    projectId: string;
    onCreate: () => void;
    onEdit: (id: string) => void;
    onDelete?: (id: string) => void;
}

export const ContestV2List: React.FC<ContestV2ListProps> = ({ projectId, onCreate, onEdit, onDelete }) => {
    const [contests, setContests] = useState<ContestV2[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contestId: string | null }>({ isOpen: false, contestId: null });
    const toast = useToast();

    // Загрузка списка конкурсов
    useEffect(() => {
        let isMounted = true;
        
        const loadContests = async () => {
            setIsLoading(true);
            try {
                const data = await getContestsV2(projectId);
                if (isMounted) {
                    setContests(data);
                }
            } catch (error) {
                console.error('Ошибка загрузки конкурсов:', error);
                if (isMounted) {
                    toast.error('Ошибка загрузки конкурсов');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        loadContests();
        
        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const handleDeleteClick = (contestId: string) => {
        setDeleteModal({ isOpen: true, contestId });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.contestId) return;
        
        try {
            await deleteContestV2(deleteModal.contestId);
            toast.success('Конкурс удален');
            // Перезагрузка списка после удаления
            const data = await getContestsV2(projectId);
            setContests(data);
        } catch (error) {
            console.error('Ошибка удаления:', error);
            toast.error('Ошибка удаления конкурса');
        } finally {
            setDeleteModal({ isOpen: false, contestId: null });
        }
    };

    if (isLoading) return <div className="p-10 flex justify-center"><div className="loader"></div></div>;

    if (contests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <div className="mb-4 text-gray-300">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Нет конкурсов</h3>
                <p className="mt-1 text-sm text-gray-500">Создайте свой первый конкурс в новой версии модуля.</p>
                <button onClick={onCreate} className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Создать конкурс</button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Конкурс 2.0</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Новая версия модуля конкурсов (в разработке)</p>
                </div>
                <button onClick={onCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium">
                    + Создать
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contests.map(contest => (
                    <ContestV2Card 
                        key={contest.id} 
                        contest={contest} 
                        onEdit={onEdit} 
                        onDelete={handleDeleteClick} 
                    />
                ))}
            </div>
            
            {/* Модальное окно подтверждения удаления */}
            {deleteModal.isOpen && (
                <ConfirmationModal
                    title="Удалить конкурс?"
                    message="Это действие нельзя отменить. Все данные конкурса будут удалены."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteModal({ isOpen: false, contestId: null })}
                    confirmText="Удалить"
                    cancelText="Отмена"
                    confirmButtonVariant="danger"
                />
            )}
        </div>
    );
};
