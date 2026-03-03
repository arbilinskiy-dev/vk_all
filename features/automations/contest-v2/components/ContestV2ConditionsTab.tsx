/**
 * Вкладка "Условия" для редактора Конкурс 2.0
 * Содержит конструктор условий участия
 * Копия дизайна из general-contests/SettingsTab
 */

import React from 'react';
import { ContestV2 } from '../types';
import { ConditionsBuilder } from '../../general-contests/components/ConditionsBuilder';
import { ConditionGroup } from '../../general-contests/types';

interface ContestV2ConditionsTabProps {
    contest: ContestV2;
    onChange: (field: keyof ContestV2, value: any) => void;
}

export const ContestV2ConditionsTab: React.FC<ContestV2ConditionsTabProps> = ({
    contest,
    onChange,
}) => {
    return (
        <div className="space-y-8">
            {/* Секция: Условия участия */}
            <div className="space-y-6 pb-6 last:pb-0">
                <h3 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">Условия участия</h3>
                <ConditionsBuilder 
                    groups={contest.conditions_schema || []} 
                    onChange={(groups: ConditionGroup[]) => onChange('conditions_schema', groups)} 
                />
            </div>

            {/* Секция: Победители */}
            <div className="w-full bg-white border border-gray-200 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Победители</div>
                <div className="space-y-2">
                    <label className="block text-sm text-gray-700">Кол-во</label>
                    <input 
                        type="number" 
                        min={1}
                        value={contest.winners_count || 1}
                        onChange={e => onChange('winners_count', Math.max(1, Number(e.target.value)))}
                        className="w-24 border rounded p-2 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={contest.unique_winner || false} 
                        onChange={e => onChange('unique_winner', e.target.checked)}
                        className="rounded text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                    />
                    <span className="text-sm text-gray-600">1 приз в 1 руки</span>
                </label>
            </div>
        </div>
    );
};
