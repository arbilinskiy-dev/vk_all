
import React from 'react';
import { ContestSettings, FinishConditionType, TargetCountMode } from '../../types';
import { CustomTimePicker } from '../../../../../shared/components/pickers/CustomTimePicker';
import { DaySelector } from './controls/FormControls';

interface FinishConditionsProps {
    settings: ContestSettings;
    onChange: (field: keyof ContestSettings, value: any) => void;
}

/** Переключатель режима интерпретации количества участников */
const CountModeSelector: React.FC<{
    value: TargetCountMode;
    onChange: (mode: TargetCountMode) => void;
}> = ({ value, onChange }) => {
    const modes: { id: TargetCountMode; label: string; icon: string }[] = [
        { id: 'exact', label: 'Ровно =', icon: '' },
        { id: 'minimum', label: 'Минимум ≥', icon: '' },
        { id: 'maximum', label: 'Максимум ≤', icon: '' },
    ];

    return (
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-md">
            {modes.map(mode => (
                <button
                    key={mode.id}
                    type="button"
                    onClick={() => onChange(mode.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-all focus:outline-none ${
                        value === mode.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    {mode.label}
                </button>
            ))}
        </div>
    );
};

/** Подсказка под настройками — зависит от finishCondition + targetCountMode */
const getHintText = (condition: FinishConditionType, mode: TargetCountMode): string => {
    if (condition === 'count') {
        switch (mode) {
            case 'exact':
                return '🎉 Итоги подведутся автоматически, как только наберётся ровно указанное кол-во участников. Лишние перейдут в следующий цикл.';
            case 'minimum':
                return '🎉 Итоги подведутся автоматически, как только наберётся указанное кол-во участников или больше. Участвуют ВСЕ, кто накопился.';
            case 'maximum':
                return '🎉 Итоги подведутся автоматически при достижении указанного кол-ва. Если участников меньше — розыгрыш все равно состоится. Лишние перейдут в следующий цикл.';
        }
    }
    if (condition === 'mixed') {
        switch (mode) {
            case 'exact':
                return '⚖️ В указанный день участвуют ровно столько человек. Если меньше — перенос на следующую неделю. Если больше — лишние в следующий цикл.';
            case 'minimum':
                return '⚖️ В указанный день розыгрыш только при N+ участниках. Если набралось — участвуют ВСЕ. Если меньше — перенос.';
            case 'maximum':
                return '⚖️ В указанный день розыгрыш состоится в любом случае (даже если меньше N). Но не более N участников — лишние в следующий цикл.';
        }
    }
    return '';
};

export const FinishConditions: React.FC<FinishConditionsProps> = ({ settings, onChange }) => {
    const finishOptions: { id: FinishConditionType; label: string }[] = [
        { id: 'count', label: 'По количеству' },
        { id: 'date', label: 'В определенный день' },
        { id: 'mixed', label: 'День + Количество' },
    ];

    const currentMode = settings.targetCountMode || 'exact';

    return (
        <div className="space-y-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Условия подведения итогов</h3>
            
            <div className="bg-gray-200 p-1 rounded-lg flex flex-wrap gap-1">
                {finishOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => onChange('finishCondition', option.id)}
                        className={`flex-1 min-w-[120px] px-3 py-2 text-sm font-medium rounded-md transition-all text-center leading-tight focus:outline-none ${
                            settings.finishCondition === option.id
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* Используем min-h вместо фиксированной h для адаптации к контенту */}
            <div className="min-h-[12rem] relative border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col justify-center transition-all duration-300">
                {settings.finishCondition === 'count' && (
                    <div className="animate-fade-in-up space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-medium text-gray-700">Кол-во участников:</span>
                                <input
                                    type="number"
                                    value={settings.targetCount}
                                    onChange={(e) => onChange('targetCount', Number(e.target.value))}
                                    className="w-24 border border-gray-300 rounded-md px-3 py-2 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 no-spinners transition-shadow"
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Режим подсчёта</span>
                                <CountModeSelector 
                                    value={currentMode} 
                                    onChange={(mode) => onChange('targetCountMode', mode)} 
                                />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                            <p>{getHintText('count', currentMode)}</p>
                        </div>
                    </div>
                )}

                {settings.finishCondition === 'date' && (
                    <div className="animate-fade-in-up space-y-4">
                            <div className="space-y-3">
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">День недели</span>
                                <div className="mt-1">
                                        <DaySelector value={settings.finishDayOfWeek || 1} onChange={(val) => onChange('finishDayOfWeek', val)} />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">Время подведения:</span>
                                <CustomTimePicker 
                                    value={settings.finishTime || '12:00'}
                                    onChange={(val) => onChange('finishTime', val)}
                                    className="w-32"
                                />
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                            <p>📅 Итоги подведутся в этот день и время, <strong>независимо от количества постов</strong> (если есть хотя бы один участник).</p>
                        </div>
                    </div>
                )}

                {settings.finishCondition === 'mixed' && (
                    <div className="animate-fade-in-up space-y-3">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">День недели</span>
                                <DaySelector value={settings.finishDayOfWeek || 1} onChange={(val) => onChange('finishDayOfWeek', val)} />
                            </div>
                            <div className="w-32">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Время</span>
                                <CustomTimePicker 
                                    value={settings.finishTime || '12:00'}
                                    onChange={(val) => onChange('finishTime', val)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Кол-во участников:</span>
                            <input
                                type="number"
                                value={settings.targetCount}
                                onChange={(e) => onChange('targetCount', Number(e.target.value))}
                                className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 no-spinners transition-shadow"
                                placeholder="50"
                            />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Режим подсчёта</span>
                            <CountModeSelector 
                                value={currentMode} 
                                onChange={(mode) => onChange('targetCountMode', mode)} 
                            />
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                            <p>{getHintText('mixed', currentMode)}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
