import React from 'react';
import { Project } from '../../../../../shared/types';
import { AccordionSection } from './AccordionSection';
import { AccordionSectionKey } from '../ProjectSettingsModal';

// Иконка копирования в буфер обмена
const CopyIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

// Иконка «скопировано» (галочка)
const CheckIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

// Кнопка копирования с анимацией
const CopyButton: React.FC<{ value: string | undefined }> = ({ value }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title="Скопировать"
            className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
        >
            {copied ? <CheckIcon className="h-5 w-5 text-green-500" /> : <CopyIcon />}
        </button>
    );
};

interface InfoSectionProps {
    formData: Project;
    activeAccordion: AccordionSectionKey | null;
    handleAccordionToggle: (key: AccordionSectionKey) => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
    formData,
    activeAccordion,
    handleAccordionToggle
}) => {
    // Ссылка по VK ID (формат https://vk.com/public<id>)
    const vkIdLink = formData.vkProjectId ? `https://vk.com/public${formData.vkProjectId}` : '';

    return (
        <AccordionSection title="Информация VK" sectionKey="info" activeSection={activeAccordion} onToggle={handleAccordionToggle}>
            <p className="text-sm text-gray-500 mb-4">Эти данные не редактируются и загружаются из базы.</p>
            <div className="space-y-4">
                {/* Название группы VK */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Название группы VK</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" value={formData.vkGroupName} readOnly className="flex-1 w-full min-w-0 rounded-l-md px-3 py-2 text-sm bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"/>
                        <CopyButton value={formData.vkGroupName} />
                    </div>
                </div>

                {/* VK ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">VK ID</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" value={formData.vkProjectId ?? ''} readOnly className="flex-1 w-full min-w-0 rounded-l-md px-3 py-2 text-sm bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"/>
                        <CopyButton value={formData.vkProjectId?.toString()} />
                    </div>
                </div>

                {/* Ссылка на проект (shortname) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Ссылка на проект</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <input type="text" value={formData.vkLink} readOnly className="flex-1 w-full min-w-0 rounded-l-md px-3 py-2 text-sm bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"/>
                        <CopyButton value={formData.vkLink} />
                        <a href={formData.vkLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                </div>

                {/* Ссылка по VK ID */}
                {vkIdLink && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ссылка по VK ID</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <input type="text" value={vkIdLink} readOnly className="flex-1 w-full min-w-0 rounded-l-md px-3 py-2 text-sm bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"/>
                            <CopyButton value={vkIdLink} />
                            <a href={vkIdLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </AccordionSection>
    );
};
