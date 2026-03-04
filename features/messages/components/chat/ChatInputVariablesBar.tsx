/**
 * Панель переменных для ChatInput:
 * - Статичная кнопка «Переменные» (не прыгает при открытии/закрытии)
 * - Аккордеон с: частные ({username}), глобальные, проектные, промо-переменные
 */

import React from 'react';
import { GlobalVariableDefinition, Project } from '../../../../shared/types';
import { VariablesSelector } from '../../../posts/components/VariablesSelector';
import { PromoVariableInfo } from '../../../../services/api/promo_lists.api';
import { MESSAGE_SPECIFIC_VARIABLES } from './chatInputConstants';

interface ChatInputVariablesBarProps {
    userName?: string;
    projectId: string | null;
    project: Project | null;
    isVariablesOpen: boolean;
    globalVariables: GlobalVariableDefinition[] | null;
    isLoadingGlobalVariables: boolean;
    projectVariables: { name: string; value: string }[] | null;
    isLoadingProjectVariables: boolean;
    /** Промо-переменные */
    promoVariables?: PromoVariableInfo[] | null;
    isLoadingPromoVariables?: boolean;
    onToggleVariables: () => void;
    onInsertAtCursor: (value: string) => void;
    onInsertVariable: (value: string) => void;
}

export const ChatInputVariablesBar: React.FC<ChatInputVariablesBarProps> = ({
    userName,
    projectId,
    project,
    isVariablesOpen,
    globalVariables,
    isLoadingGlobalVariables,
    projectVariables,
    isLoadingProjectVariables,
    onToggleVariables,
    onInsertAtCursor,
    onInsertVariable,
    promoVariables,
    isLoadingPromoVariables,
}) => {
    return (
        <>
            {/* Аккордеон переменных (keep-in-DOM), раскрывается над тулбаром */}
            <div
                className={`transition-all duration-200 ${
                    isVariablesOpen ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
            >
                {projectId && (
                    <div className="px-2.5 py-2 bg-gray-50 border-b border-gray-200 flex flex-col gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        {/* Частные переменные ({username}) */}
                        {userName && (
                            <div>
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Частные переменные
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {MESSAGE_SPECIFIC_VARIABLES.map(v => (
                                        <button
                                            key={v.value}
                                            type="button"
                                            onClick={() => onInsertAtCursor(v.value)}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                            title={v.description}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Глобальные, проектные, промо-переменные */}
                        <VariablesSelector
                            isLoading={isLoadingProjectVariables}
                            variables={projectVariables}
                            isLoadingGlobalVariables={isLoadingGlobalVariables}
                            globalVariables={globalVariables}
                            project={project}
                            onInsert={onInsertVariable}
                            onEditVariables={() => {}}
                            promoVariables={promoVariables}
                            isLoadingPromoVariables={isLoadingPromoVariables}
                        />
                    </div>
                )}
            </div>
        </>
    );
};
