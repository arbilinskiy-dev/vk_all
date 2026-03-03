/**
 * Превью конкурса 2.0
 * Копия структуры GeneralContestPreview
 */

import React, { useMemo } from 'react';
import { ContestV2 } from '../types';
import { Project } from '../../../../shared/types';
import { VK_COLORS, VkPost, VkComment, VkMessage } from '../../reviews-contest/components/preview/VkUiKit';

interface ContestV2PreviewProps {
    contest: ContestV2;
    project: Project;
}

export const ContestV2Preview: React.FC<ContestV2PreviewProps> = ({ contest, project }) => {
    const startImages = useMemo(() => {
        return (contest.start_post_images || []).map(img => ({ url: img.url }));
    }, [contest.start_post_images]);

    const startPostText = contest.start_post_text || 'Текст стартового поста...';

    const startDateLabel = contest.start_post_date ? contest.start_post_date : 'дата не выбрана';
    const startTimeLabel = contest.start_post_time || '12:00';

    return (
        <div 
            className="w-full lg:w-1/2 overflow-y-auto custom-scrollbar p-6 border-l border-gray-200" 
            style={{ backgroundColor: VK_COLORS.bg, minHeight: '100%' }}
        >
            <div className="max-w-[550px] w-full mx-auto space-y-8 mt-4 flex-grow">
                
                {/* Стартовый пост */}
                <div>
                    <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">1. Старт конкурса</div>
                    {contest.start_type === 'existing_post' ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                            <div className="text-gray-500 text-sm mb-2">Будет использован существующий пост</div>
                            {contest.existing_post_link && (
                                <a 
                                    href={contest.existing_post_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline text-sm break-all"
                                >
                                    {contest.existing_post_link}
                                </a>
                            )}
                        </div>
                    ) : (
                        <VkPost
                            isGroup
                            authorName={project.name}
                            authorAvatar={project.avatar_url}
                            date={`${startDateLabel} в ${startTimeLabel}`}
                            highlightWord=""
                            text={startPostText}
                            likes={36}
                            comments={12}
                            reposts={4}
                            views={1.8}
                            images={startImages}
                            blurredExtras={true}
                        />
                    )}
                </div>

                {/* Итоги (заглушка) */}
                <div className="opacity-50">
                    <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">2. Объявление итогов</div>
                    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                        <div className="text-gray-400 text-sm">Будет доступно на следующем этапе</div>
                    </div>
                </div>

                {/* Вручение приза (заглушка) */}
                <div className="opacity-50">
                    <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">3. Вручение приза</div>
                    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                        <div className="text-gray-400 text-sm">Будет доступно на следующем этапе</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
