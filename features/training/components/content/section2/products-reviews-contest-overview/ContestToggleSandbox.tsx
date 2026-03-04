import React from 'react';
import { Sandbox } from '../../shared';
import { ToggleSwitch } from '../ReviewsContestMocks';

// =====================================================================
// Sandbox: интерактивный переключатель активности конкурса
// =====================================================================

interface ContestToggleSandboxProps {
    /** Активен ли конкурс */
    contestActive: boolean;
    /** Переключить состояние конкурса */
    onToggle: () => void;
}

export const ContestToggleSandbox: React.FC<ContestToggleSandboxProps> = ({
    contestActive,
    onToggle,
}) => (
    <Sandbox
        title="🎮 Попробуйте включить конкурс"
        description="Переключатель контролирует активность конкурса. В выключенном состоянии система не будет искать новых участников."
        instructions={[
            'Нажмите на переключатель, чтобы включить или выключить конкурс',
            'Когда конкурс активен, переключатель становится синим'
        ]}
    >
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Конкурс отзывов активен</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {contestActive 
                            ? 'Система активно ищет новых участников по заданным ключевым словам' 
                            : 'Конкурс приостановлен, новые участники не собираются'}
                    </p>
                </div>
                <ToggleSwitch 
                    enabled={contestActive} 
                    onChange={onToggle} 
                />
            </div>
        </div>
    </Sandbox>
);
