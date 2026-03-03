/**
 * Главная страница раздела "Конкурс 2.0"
 * Копия структуры GeneralContestsPage
 */

import React, { useState, useEffect, useRef } from 'react';
import { ContestV2List } from './components/ContestV2List';
import { ContestV2EditorPage } from './components/ContestV2EditorPage';

interface ContestV2PageProps {
    projectId: string;
    setNavigationBlocker?: React.Dispatch<React.SetStateAction<(() => boolean) | null>>;
    initialContestId?: string;
    onClearParams?: () => void;
}

export const ContestV2Page: React.FC<ContestV2PageProps> = ({ 
    projectId, 
    setNavigationBlocker,
    initialContestId,
    onClearParams
}) => {
    // State
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [editingContestId, setEditingContestId] = useState<string | null>(null);

    // Initial Load Effect (for deep linking)
    useEffect(() => {
        if (initialContestId) {
            setEditingContestId(initialContestId);
            setViewMode('create');
            if (onClearParams) onClearParams();
        }
    }, [initialContestId]);

    // Ref to track project changes
    const prevProjectIdRef = useRef(projectId);

    // Effect: Handle Project Switching
    useEffect(() => {
        if (prevProjectIdRef.current !== projectId) {
            setViewMode('list');
            setEditingContestId(null);
            prevProjectIdRef.current = projectId;
        }
    }, [projectId]);

    // Effect: Manage Navigation Blocker
    useEffect(() => {
        if (setNavigationBlocker) {
            if (viewMode === 'create') {
                setNavigationBlocker(() => () => true);
            } else {
                setNavigationBlocker(null);
            }
        }
        return () => {
            if (setNavigationBlocker) setNavigationBlocker(null);
        };
    }, [viewMode, setNavigationBlocker]);

    const handleCreate = () => {
        setEditingContestId(null);
        setViewMode('create');
    };

    const handleEdit = (contestId: string) => {
        setEditingContestId(contestId);
        setViewMode('create');
    };

    const handleCloseEditor = () => {
        setViewMode('list');
        setEditingContestId(null);
    };

    // Render
    if (viewMode === 'create') {
        return (
            <ContestV2EditorPage 
                projectId={projectId}
                contestId={editingContestId || undefined}
                onClose={handleCloseEditor}
            />
        );
    }

    return (
        <ContestV2List 
            projectId={projectId}
            onCreate={handleCreate}
            onEdit={handleEdit}
        />
    );
};
