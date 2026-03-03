/**
 * Вкладка "Подведение итогов" для редактора Конкурс 2.0
 * Содержит настройки времени итогов и пост итогов
 * Копия дизайна из general-contests/SettingsTab
 */

import React from 'react';
import { ContestV2 } from '../types';
import { Project } from '../../../../shared/types';
import { PostMediaSection } from '../../../posts/components/modals/PostMediaSection';
import { RichTemplateEditor } from '../../reviews-contest/components/settings/controls/RichTemplateEditor';
import { CustomDatePicker, CustomTimePicker } from '../../../posts/components/modals/PostDateTimePicker';

interface ContestV2ResultsTabProps {
    contest: ContestV2;
    onChange: (field: keyof ContestV2, value: any) => void;
    project: Project;
}

export const ContestV2ResultsTab: React.FC<ContestV2ResultsTabProps> = ({
    contest,
    onChange,
    project,
}) => {
    return (
        <div className="space-y-8">
            {/* Секция: Подведение итогов */}
            <div className="space-y-6 pb-6 last:pb-0">
                <h3 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">Подведение итогов</h3>
                
                <div className="grid grid-cols-1 gap-4 items-start">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Когда?</label>
                            <div className="flex bg-gray-200 p-1 rounded-lg gap-1 w-full">
                                {[
                                    { id: 'duration', label: 'Через время' },
                                    { id: 'date', label: 'В точную дату' },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => onChange('finish_type', opt.id)}
                                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-200 ${
                                            contest.finish_type === opt.id
                                                ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                        type="button"
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {contest.finish_type === 'duration' ? (
                            <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[120px]">
                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Через</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                min={0}
                                                value={contest.finish_duration_days ?? 0}
                                                onChange={e => onChange('finish_duration_days', Math.max(0, Number(e.target.value)))}
                                                className="w-20 border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <span className="text-sm text-gray-600">дней</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">+ Часы</span>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                min={0}
                                                value={contest.finish_duration_hours ?? 0}
                                                onChange={e => onChange('finish_duration_hours', Math.max(0, Number(e.target.value)))}
                                                className="w-20 border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <span className="text-sm text-gray-600">часов</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">Пример: 7 дней и 0 часов → итоги через 7 дней после старта.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-[120px]">
                                <div className="flex flex-wrap gap-3 items-center">
                                    <CustomDatePicker value={contest.finish_date || ''} onChange={v => onChange('finish_date', v)} />
                                    <CustomTimePicker value={contest.finish_time || '12:00'} onChange={v => onChange('finish_time', v)} className="w-28" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Секция: Пост итогов */}
            <div className="space-y-6 pb-6 last:pb-0">
                <h3 className="text-lg font-bold text-gray-800 pb-2 border-b border-gray-200">Пост итогов</h3>
                <RichTemplateEditor 
                    label="Текст поста итогов" 
                    value={contest.template_result_post || 'Поздравляем победителей!\n\n{winners_list}'}
                    onChange={(val) => onChange('template_result_post', val)}
                    project={project}
                    rows={6}
                    specificVariables={[{ name: 'Победители', value: '{winners_list}', description: 'Список победителей' }]}
                />
                
                <PostMediaSection 
                    mode="edit"
                    projectId={project.id}
                    editedImages={contest.result_post_images || []}
                    onImagesChange={(imgs) => onChange('result_post_images', typeof imgs === 'function' ? imgs(contest.result_post_images || []) : imgs)}
                    onUploadStateChange={() => {}}
                    postAttachments={[]}
                    editedAttachments={[]}
                    onAttachmentsChange={() => {}}
                    collapsible={true}
                />
            </div>
        </div>
    );
};
