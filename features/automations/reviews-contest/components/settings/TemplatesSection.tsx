
import React from 'react';
import { ContestSettings } from '../../types';
import { RichTemplateEditor } from './controls/RichTemplateEditor';
import { Project } from '../../../../../shared/types';
import { PostMediaSection } from '../../../../posts/components/modals/PostMediaSection';

interface TemplatesSectionProps {
    settings: ContestSettings;
    onChange: (field: keyof ContestSettings, value: any) => void;
    project: Project;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ settings, onChange, project }) => {
    
    // Формирование пояснения для условий публикации
    const getFinishConditionText = () => {
        const mode = settings.targetCountMode || 'exact';
        const modeLabel = mode === 'exact' ? 'ровно' : mode === 'minimum' ? 'минимум' : 'максимум';
        
        if (settings.finishCondition === 'count') return `автоматически, при ${modeLabel} ${settings.targetCount} участниках`;
        if (settings.finishCondition === 'date') return `в указанный день недели (${settings.finishDayOfWeek}-й) в ${settings.finishTime}`;
        return `при выполнении условий (День недели + ${modeLabel} ${settings.targetCount} участников)`;
    };

    return (
        <div className="space-y-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
             <div>
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Шаблоны сообщений</h3>
                <div className="space-y-5">
                    <RichTemplateEditor 
                        label="Шаблон комментария (Регистрация)" 
                        value={settings.templateComment}
                        onChange={(val) => onChange('templateComment', val)}
                        project={project}
                        specificVariables={[{ name: 'Номер', value: '{number}', description: 'Порядковый номер участника' }]}
                        rows={3}
                        helpText={`Это комментарий, который будет автоматически отправлен под публикацией пользователя, содержащей ключевое вхождение «${settings.keywords || '...'}».`}
                    />
                    
                    <RichTemplateEditor 
                        label="Сообщение победителю (ЛС)" 
                        value={settings.templateDm}
                        onChange={(val) => onChange('templateDm', val)}
                        project={project}
                        specificVariables={[
                            { name: 'Промокод', value: '{promo_code}', description: 'Выигрышный промокод' },
                            { name: 'Приз', value: '{description}', description: 'Описание приза из базы промокодов' },
                            { name: 'Имя', value: '{user_name}', description: 'Имя победителя' }
                        ]}
                        rows={5}
                        helpText="Это сообщение будет отправлено пользователю через личные сообщения сообщества от лица группы. Переменная {description} подставит описание, привязанное к выданному промокоду."
                    />
                    
                    <RichTemplateEditor 
                        label="Ошибка отправки (Комментарий)" 
                        value={settings.templateErrorComment}
                        onChange={(val) => onChange('templateErrorComment', val)}
                        project={project}
                        specificVariables={[{ name: 'Имя', value: '{user_name}', description: 'Имя победителя для упоминания' }]}
                        rows={3}
                        helpText="Это комментарий, который будет оставлен под публикацией победителя (под его отзывом), если мы не смогли отправить ему сообщение с призом в ЛС."
                    />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Настройка поста с итогами</h3>
                <div className="space-y-4">
                    <RichTemplateEditor 
                        label="Текст поста" 
                        value={settings.templateWinnerPost}
                        onChange={(val) => onChange('templateWinnerPost', val)}
                        project={project}
                        specificVariables={[{ name: 'Список', value: '{winners_list}', description: 'Список победителей (Имя + Номер)' }]}
                        rows={8}
                        helpText={`Этот пост будет опубликован на стене сообщества ${getFinishConditionText()}.`}
                    />
                    
                    {/* Изображение-доказательство розыгрыша */}
                    <div className="border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white p-4 space-y-3">
                        {/* Основной тумблер - генерировать изображение */}
                        <div className="flex-1 min-w-0">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                {/* Тумблер */}
                                <div className="relative shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={settings.useProofImage ?? true}
                                        onChange={(e) => {
                                            onChange('useProofImage', e.target.checked);
                                            // Если выключаем основной тумблер, выключаем и дополнительный
                                            if (!e.target.checked) {
                                                onChange('attachAdditionalMedia', false);
                                            }
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                    🎲 Генерировать изображение-доказательство
                                </span>
                            </label>
                            
                            {/* Описание - появляется при включении */}
                            <div className={`overflow-hidden transition-all duration-300 ${(settings.useProofImage ?? true) ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                                <div className="pl-14 text-xs text-gray-500">
                                    <p>
                                        Автоматически создаётся картинка с номером победителя, аватарками участников 
                                        и датой розыгрыша — как доказательство честности.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Второй тумблер - прикрепить дополнительные медиа (только при включённом первом) */}
                        <div className={`overflow-hidden transition-all duration-300 ${(settings.useProofImage ?? true) ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="pl-14 border-t border-gray-100 pt-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={settings.attachAdditionalMedia ?? false}
                                            onChange={(e) => onChange('attachAdditionalMedia', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </div>
                                    <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors">
                                        📎 Прикрепить дополнительные медиа
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Медиавложения - показываются если: НЕТ изображения-доказательства ИЛИ включён режим дополнительных медиа */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        (!(settings.useProofImage ?? true) || (settings.attachAdditionalMedia ?? false)) 
                            ? 'max-h-[500px] opacity-100' 
                            : 'max-h-0 opacity-0'
                    }`}>
                        <div className="border border-gray-300 rounded-md bg-white p-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {(settings.useProofImage ?? true) ? 'Дополнительные медиавложения' : 'Медиавложения'}
                            </label>
                            <PostMediaSection 
                                mode="edit"
                                projectId={project.id}
                                editedImages={settings.winnerPostImages}
                                onImagesChange={(newImages) => {
                                    // PostMediaSection может вернуть callback, нам нужно обработать значение
                                    if (typeof newImages === 'function') {
                                        onChange('winnerPostImages', newImages(settings.winnerPostImages));
                                    } else {
                                        onChange('winnerPostImages', newImages);
                                    }
                                }}
                                onUploadStateChange={() => {}} // TODO: Handle loading state
                                postAttachments={[]}
                                editedAttachments={[]}
                                onAttachmentsChange={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};