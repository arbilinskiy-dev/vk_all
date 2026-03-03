// PollSection — компонент создания/редактирования опроса для прикрепления к посту.
// Позволяет задать вопрос, варианты ответов, настройки анонимности и множественного выбора.
// Данные опроса хранятся локально (не создаются в VK до момента публикации).

import React, { useState, useCallback } from 'react';
import { Attachment, PollData } from '../../../shared/types';

// Максимальные ограничения VK API
const MAX_ANSWERS = 10;
const MIN_ANSWERS = 2;
const MAX_ANSWER_LENGTH = 100;

interface PollSectionProps {
    /** Текущий массив вложений поста */
    attachments: Attachment[];
    /** Колбэк для обновления массива вложений */
    onAttachmentsChange: React.Dispatch<React.SetStateAction<Attachment[]>>;
    /** Режим отображения */
    mode: 'view' | 'edit' | 'copy';
}

/** Извлекает данные опроса из массива вложений (опрос может быть только один) */
const getPollFromAttachments = (attachments: Attachment[]): Attachment | undefined => {
    return attachments.find(a => a.type === 'poll');
};

/** Начальные данные нового опроса */
const createEmptyPollData = (): PollData => ({
    question: '',
    answers: ['', ''],
    is_anonymous: false,
    is_multiple: false,
    end_date: 0,
    disable_unvote: false,
});

export const PollSection: React.FC<PollSectionProps> = ({ attachments, onAttachmentsChange, mode }) => {
    const existingPoll = getPollFromAttachments(attachments);
    const isEditable = mode === 'edit' || mode === 'copy';
    
    // Локальный режим «показать форму» (если нет опроса, по умолчанию скрыта)
    const [isFormVisible, setIsFormVisible] = useState(!!existingPoll?.poll_data);

    // Данные формы (берём из существующего опроса или создаём пустые)
    const pollData: PollData = existingPoll?.poll_data || createEmptyPollData();

    /** Обновить poll_data в аттачментах */
    const updatePollData = useCallback((updater: (prev: PollData) => PollData) => {
        onAttachmentsChange(prev => {
            const existingIdx = prev.findIndex(a => a.type === 'poll' && a.poll_data);
            const currentData = existingIdx >= 0 ? prev[existingIdx].poll_data! : createEmptyPollData();
            const updated = updater(currentData);

            const pollAttachment: Attachment = {
                id: existingIdx >= 0 ? prev[existingIdx].id : `poll_draft_${Date.now()}`,
                type: 'poll',
                description: `Опрос: ${updated.question || '(без вопроса)'}`,
                poll_data: updated,
            };

            if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = pollAttachment;
                return next;
            }
            return [...prev, pollAttachment];
        });
    }, [onAttachmentsChange]);

    /** Удалить опрос */
    const removePoll = useCallback(() => {
        onAttachmentsChange(prev => prev.filter(a => !(a.type === 'poll' && a.poll_data)));
        setIsFormVisible(false);
    }, [onAttachmentsChange]);

    /** Добавить новый опрос (показать форму) */
    const addPoll = useCallback(() => {
        setIsFormVisible(true);
        // Создаём черновик
        updatePollData(() => createEmptyPollData());
    }, [updatePollData]);

    // Рендер для существующего опроса из VK (без poll_data — уже создан)
    if (existingPoll && !existingPoll.poll_data) {
        return (
            <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-purple-700">Опрос прикреплён</span>
                    </div>
                    {isEditable && (
                        <button
                            type="button"
                            onClick={() => onAttachmentsChange(prev => prev.filter(a => a.type !== 'poll'))}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Удалить опрос"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                <p className="text-xs text-purple-600 mt-1 truncate">{existingPoll.description}</p>
            </div>
        );
    }

    // Если нет опроса и форма скрыта — показываем кнопку добавления
    if (!isFormVisible) {
        if (!isEditable) return null;
        return (
            <button
                type="button"
                onClick={addPoll}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-purple-300 hover:border-purple-400 rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50/50 transition-all text-sm font-medium"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Прикрепить опрос
            </button>
        );
    }

    // Форма создания/редактирования опроса
    return (
        <div className="border border-purple-200 bg-purple-50/30 rounded-lg p-3 space-y-3 animate-fade-in-up">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-purple-700">Опрос</span>
                </div>
                {isEditable && (
                    <button
                        type="button"
                        onClick={removePoll}
                        className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                        title="Удалить опрос"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Поле вопроса */}
            <div>
                <input
                    type="text"
                    value={pollData.question}
                    onChange={(e) => updatePollData(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Вопрос опроса..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    disabled={!isEditable}
                    maxLength={255}
                />
            </div>

            {/* Варианты ответов */}
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Варианты ответов</label>
                {pollData.answers.map((answer, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{idx + 1}.</span>
                        <input
                            type="text"
                            value={answer}
                            onChange={(e) => {
                                const val = e.target.value;
                                updatePollData(prev => ({
                                    ...prev,
                                    answers: prev.answers.map((a, i) => i === idx ? val : a),
                                }));
                            }}
                            placeholder={`Вариант ${idx + 1}`}
                            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            disabled={!isEditable}
                            maxLength={MAX_ANSWER_LENGTH}
                        />
                        {/* Кнопка удаления варианта (если больше минимума) */}
                        {isEditable && pollData.answers.length > MIN_ANSWERS && (
                            <button
                                type="button"
                                onClick={() => updatePollData(prev => ({
                                    ...prev,
                                    answers: prev.answers.filter((_, i) => i !== idx),
                                }))}
                                className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                                title="Удалить вариант"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {/* Кнопка «Добавить вариант» */}
                {isEditable && pollData.answers.length < MAX_ANSWERS && (
                    <button
                        type="button"
                        onClick={() => updatePollData(prev => ({
                            ...prev,
                            answers: [...prev.answers, ''],
                        }))}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 font-medium mt-1 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Добавить вариант - {pollData.answers.length}/{MAX_ANSWERS}
                    </button>
                )}
            </div>

            {/* Переключатели настроек */}
            {isEditable && (
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 border-t border-purple-100">
                    {/* Анонимное голосование */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={pollData.is_anonymous || false}
                            onChange={(e) => updatePollData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        <span className="text-xs text-gray-600">Анонимное</span>
                    </label>
                    
                    {/* Множественный выбор */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={pollData.is_multiple || false}
                            onChange={(e) => updatePollData(prev => ({ ...prev, is_multiple: e.target.checked }))}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                        />
                        <span className="text-xs text-gray-600">Несколько ответов</span>
                    </label>
                </div>
            )}
        </div>
    );
};
