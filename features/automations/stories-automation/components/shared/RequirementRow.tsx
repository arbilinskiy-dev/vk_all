import React from 'react';
import { CheckIcon, XIcon, PendingIcon } from './RequirementIcons';

// ─── Строка требования (чеклист) ──────────────────────────────────

interface RequirementRowProps {
    passed: boolean;
    label: string;
    /** Зависимость от предыдущего шага выполнена */
    dependencyMet: boolean;
    children?: React.ReactNode;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({ passed, label, dependencyMet, children }) => (
    <div className="space-y-1.5">
        <div className="flex items-center gap-2">
            {!dependencyMet ? <PendingIcon /> : passed ? <CheckIcon /> : <XIcon />}
            <span className={`text-sm font-medium ${
                !dependencyMet ? 'text-gray-400' : passed ? 'text-green-700' : 'text-red-700'
            }`}>
                {label}
                {!dependencyMet && <span className="text-xs font-normal text-gray-400 ml-1">(требуется предыдущий шаг)</span>}
                {dependencyMet && passed && <span className="text-xs font-normal text-green-500 ml-1">— подключён</span>}
                {dependencyMet && !passed && <span className="text-xs font-normal text-red-400 ml-1">— не подключён</span>}
            </span>
        </div>
        {children}
    </div>
);
