/**
 * RichTemplateEditor — текстовый редактор шаблонов автоматизаций.
 * 
 * Построен по эталону CommentTextEditor из дизайн-системы.
 * Поддерживает:
 * - Аккордеон переменных (один раздел открыт одновременно): частные, глобальные, базовые, конструкции, проектные
 * - Emoji-пикер (inline, внутри контейнера)
 * - Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) через useTextUndoHistory
 * - Автозакрытие скобок и кавычек
 * - Счётчик символов
 * - Управление фокусом через React-стейт (не CSS focus-within)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, GlobalVariableDefinition } from '../../../../../../shared/types';
import { useTextUndoHistory } from '../../../../../../shared/hooks/useTextUndoHistory';
import { EmojiPicker } from '../../../../../emoji/components/EmojiPicker';
import * as api from '../../../../../../services/api';

/** Максимальная длина текста шаблона (VK API лимит для комментариев/ЛС) */
const MAX_TEMPLATE_LENGTH = 4096;

/** Пары авто-закрывающихся символов */
const AUTO_CLOSE_PAIRS: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '«': '»',
};

interface RichTemplateEditorProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    rows?: number;
    project: Project;
    specificVariables?: { name: string; value: string; description: string }[];
    helpText?: string;
    maxLength?: number;
}

export const RichTemplateEditor: React.FC<RichTemplateEditorProps> = ({ 
    label, value, onChange, rows = 3, project, specificVariables, helpText, maxLength = MAX_TEMPLATE_LENGTH
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [showVariables, setShowVariables] = useState(false);
    // Флаг: переменные были открыты хотя бы раз (контент остаётся в DOM для плавного закрытия)
    const [variablesEverShown, setVariablesEverShown] = useState(false);
    // Флаг: emoji-пикер был открыт хотя бы раз
    const [emojiEverShown, setEmojiEverShown] = useState(false);
    
    // Состояния для переменных проекта
    const [variables, setVariables] = useState<{ name: string; value: string }[] | null>(null);
    const [globalVariables, setGlobalVariables] = useState<GlobalVariableDefinition[] | null>(null);
    const [isLoadingVars, setIsLoadingVars] = useState(false);

    // Аккордеон: какой раздел переменных раскрыт (только один за раз)
    const [openSection, setOpenSection] = useState<string | null>(null);

    // Базовые переменные и конструкции (воспроизводят логику VariablesSelector)
    const baseVariables = project ? [
        { name: 'Ссылка на сообщество', value: project.vkLink || '' },
        { name: 'Ссылка на сообщения', value: `https://vk.me/${project.vkGroupShortName}` },
        { name: 'Название сообщества', value: project.vkGroupName || '' },
        { name: 'Упоминание сообщества', value: `@${project.vkGroupShortName} (${project.vkGroupName})` },
    ] : [];

    const baseConstructions = [
        { name: '[ | ]', value: '[ССЫЛКА|ОПИСАНИЕ]' },
        { name: '@ ()', value: '@idЦИФРЫ_АЙДИ (ТЕКСТ_ССЫЛКИ)' },
    ];

    // --- Управление фокусом контейнера ---
    // React-стейт вместо CSS focus-within (исключает чёрную вспышку и мерцание)
    const [isFocused, setIsFocused] = useState(false);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // При фокусе любого дочернего элемента — мгновенно включаем обводку
    const handleContainerFocus = useCallback(() => {
        clearTimeout(focusTimeoutRef.current);
        setIsFocused(true);
    }, []);

    // При потере фокуса — ждём микротаск, чтобы фокус успел перейти на другой элемент внутри контейнера
    const handleContainerBlur = useCallback(() => {
        focusTimeoutRef.current = setTimeout(() => {
            setIsFocused(false);
        }, 0);
    }, []);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => clearTimeout(focusTimeoutRef.current);
    }, []);

    // Undo/Redo: собственный стек истории текста
    const { undo, redo, canUndo, canRedo } = useTextUndoHistory({
        text: value,
        onTextChange: onChange,
        textareaRef,
    });

    // Вставка текста в позицию курсора с сохранением фокуса
    const handleInsert = useCallback((textToInsert: string) => {
        if (!textareaRef.current) {
            onChange(value + textToInsert);
            return;
        }
        const { selectionStart, selectionEnd } = textareaRef.current;
        const newValue = value.substring(0, selectionStart) + textToInsert + value.substring(selectionEnd);
        onChange(newValue);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = selectionStart + textToInsert.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [value, onChange]);

    // Вставка эмодзи
    const handleInsertEmoji = useCallback((emoji: string) => {
        handleInsert(emoji);
    }, [handleInsert]);

    // Оборачивание выделенного текста парными символами
    const wrapSelection = useCallback((prefix: string, suffix: string) => {
        if (!textareaRef.current) return;
        const ta = textareaRef.current;
        const { selectionStart, selectionEnd } = ta;
        const selectedText = value.substring(selectionStart, selectionEnd);

        const newValue = value.substring(0, selectionStart) + prefix + selectedText + suffix + value.substring(selectionEnd);
        onChange(newValue);

        setTimeout(() => {
            ta.focus();
            if (selectedText.length > 0) {
                ta.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
            } else {
                const cursorPos = selectionStart + prefix.length;
                ta.setSelectionRange(cursorPos, cursorPos);
            }
        }, 0);
    }, [value, onChange]);

    // Вставка ссылки @id
    const handleLink = useCallback(() => {
        wrapSelection('@id (', ')');
    }, [wrapSelection]);

    // Загрузка переменных проекта и глобальных переменных
    const handleToggleVariables = useCallback(async () => {
        const shouldOpen = !showVariables;
        setShowVariables(shouldOpen);
        if (shouldOpen) {
            setVariablesEverShown(true);
            setIsEmojiPickerOpen(false);
            if (!openSection) {
                setOpenSection(specificVariables?.length ? 'specific' : 'global');
            }
        }

        if (shouldOpen && !variables) {
            setIsLoadingVars(true);
            try {
                const [projectVars, globalDefs] = await Promise.all([
                    api.getProjectVariables(project.id),
                    api.getAllGlobalVariableDefinitions()
                ]);
                setVariables(projectVars);
                setGlobalVariables(globalDefs);
            } catch (error) {
                console.error("Ошибка загрузки переменных", error);
            } finally {
                setIsLoadingVars(false);
            }
        }
    }, [showVariables, variables, project.id, openSection, specificVariables]);

    // Автозакрытие скобок и кавычек при вводе
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const ta = textareaRef.current;
        if (!ta) return;

        const openChar = e.key;
        const closingChar = AUTO_CLOSE_PAIRS[openChar];

        if (closingChar) {
            const { selectionStart, selectionEnd } = ta;
            const selectedText = value.substring(selectionStart, selectionEnd);

            // Для кавычек — если символ после курсора тот же, просто перешагиваем
            if ((openChar === '"' || openChar === "'") && value[selectionStart] === openChar && selectionStart === selectionEnd) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }

            e.preventDefault();

            if (selectedText.length > 0) {
                const newValue = value.substring(0, selectionStart) + openChar + selectedText + closingChar + value.substring(selectionEnd);
                onChange(newValue);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionEnd + 1);
                }, 0);
            } else {
                const newValue = value.substring(0, selectionStart) + openChar + closingChar + value.substring(selectionEnd);
                onChange(newValue);
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
            }
            return;
        }

        // Перешагиваем закрывающую скобку, если она уже стоит
        const closingChars = Object.values(AUTO_CLOSE_PAIRS);
        if (closingChars.includes(openChar) && !AUTO_CLOSE_PAIRS[openChar]) {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && value[selectionStart] === openChar) {
                e.preventDefault();
                setTimeout(() => {
                    ta.setSelectionRange(selectionStart + 1, selectionStart + 1);
                }, 0);
                return;
            }
        }

        // Backspace: удаляем парную скобку/кавычку
        if (e.key === 'Backspace') {
            const { selectionStart, selectionEnd } = ta;
            if (selectionStart === selectionEnd && selectionStart > 0) {
                const charBefore = value[selectionStart - 1];
                const charAfter = value[selectionStart];
                if (AUTO_CLOSE_PAIRS[charBefore] === charAfter) {
                    e.preventDefault();
                    const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
                    onChange(newValue);
                    setTimeout(() => {
                        ta.setSelectionRange(selectionStart - 1, selectionStart - 1);
                    }, 0);
                    return;
                }
            }
        }
    }, [value, onChange]);

    // Счётчик символов
    const charCount = value.length;
    const isOverLimit = charCount > maxLength;

    // --- Аккордеон переменных: хелперы ---
    const toggleSection = (id: string) => setOpenSection(prev => prev === id ? null : id);

    const renderVarBtn = (name: string, val: string, customTitle?: string) => {
        const isEmpty = !val || val.trim() === '';
        return (
            <button
                key={name + val}
                type="button"
                onClick={() => handleInsert(val)}
                title={customTitle ?? (isEmpty ? 'Переменная не содержит значения' : `Вставить: ${val}`)}
                className={`px-3 py-1.5 text-xs font-medium border rounded-full transition-colors ${
                    isEmpty
                        ? 'border-dashed border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200'
                        : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-indigo-500'
                }`}
            >
                {name}
            </button>
        );
    };

    const renderSection = (id: string, title: string, content: React.ReactNode) => (
        <div key={id}>
            <button
                type="button"
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between py-2 hover:bg-gray-100/50 transition-colors rounded"
            >
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h4>
                <svg
                    className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 ${openSection === id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-200 ease-out ${
                openSection === id ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            }`}>
                <div className="pb-2">
                    {content}
                </div>
            </div>
        </div>
    );

    // Стили кнопок тулбара
    const toolbarBtnClass = "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors";
    const toolbarBtnDisabledClass = "p-1.5 rounded text-gray-300 cursor-default";

    return (
        <div className="group">
            {/* Единый контейнер редактора */}
            <div
                className={`border rounded-lg overflow-hidden ${
                    isFocused
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                }`}
                onFocus={handleContainerFocus}
                onBlur={handleContainerBlur}
            >
                {/* Тулбар */}
                <div className="flex flex-wrap items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-200">
                    {/* Лейбл поля */}
                    <label className="text-sm font-medium text-gray-700 shrink-0">{label}</label>

                    {/* Пружина — раздвигает лейбл и кнопки */}
                    <div className="flex-1" />

                    {/* Кнопка переменных проекта */}
                    <button 
                        type="button" 
                        onClick={handleToggleVariables}
                        className={`${toolbarBtnClass} ${showVariables ? '!bg-indigo-100 !text-indigo-600' : ''}`}
                        title="Переменные проекта"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* Разделитель */}
                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    {/* Кнопка эмодзи */}
                    <button
                        type="button"
                        onClick={() => {
                            const willOpen = !isEmojiPickerOpen;
                            setIsEmojiPickerOpen(willOpen);
                            if (willOpen) {
                                setEmojiEverShown(true);
                                setShowVariables(false);
                            }
                        }}
                        title="Эмодзи"
                        className={`${toolbarBtnClass} ${isEmojiPickerOpen ? '!bg-indigo-100 !text-indigo-600' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>

                    {/* Разделитель */}
                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    {/* Undo */}
                    <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo}
                        title="Отменить (Ctrl+Z)"
                        className={canUndo ? toolbarBtnClass : toolbarBtnDisabledClass}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                        </svg>
                    </button>

                    {/* Redo */}
                    <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo}
                        title="Повторить (Ctrl+Shift+Z)"
                        className={canRedo ? toolbarBtnClass : toolbarBtnDisabledClass}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
                        </svg>
                    </button>
                </div>

                {/* Панель переменных проекта (плавное раскрытие И сворачивание через CSS-transition) */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${
                    showVariables ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    {variablesEverShown && (
                        <div className="px-3 py-1 bg-gray-50 border-b border-gray-200 divide-y divide-gray-100">
                            {/* Частные переменные */}
                            {specificVariables && specificVariables.length > 0 && renderSection('specific', 'Частные переменные', (
                                <>
                                    <p className="text-xs text-gray-400 mb-2">Работают исключительно в этом поле. При отправке заменяются на реальные значения.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {specificVariables.map(v => (
                                            <button
                                                key={v.value}
                                                type="button"
                                                onClick={() => handleInsert(v.value)}
                                                title={v.description}
                                                className="px-3 py-1.5 text-xs font-medium border rounded-full transition-colors bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                                            >
                                                {v.name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ))}

                            {/* Глобальные переменные */}
                            {globalVariables !== null && renderSection('global', 'Глобальные переменные',
                                isLoadingVars
                                    ? <div className="flex items-center py-2"><div className="loader h-4 w-4" /></div>
                                    : globalVariables && globalVariables.length > 0
                                        ? <div className="flex flex-wrap gap-2">{globalVariables.map(gVar => renderVarBtn(gVar.name, `{global_${gVar.placeholder_key}}`, `Вставить: {global_${gVar.placeholder_key}}`))}</div>
                                        : <p className="text-xs text-gray-500">Глобальные переменные не настроены.</p>
                            )}

                            {/* Базовые переменные */}
                            {project && renderSection('base', 'Базовые переменные',
                                <div className="flex flex-wrap gap-2">
                                    {baseVariables.filter(v => v.value).map(v => renderVarBtn(v.name, v.value))}
                                </div>
                            )}

                            {/* Конструкции */}
                            {renderSection('constructions', 'Конструкции',
                                <div className="flex flex-wrap gap-2">
                                    {baseConstructions.map(c => renderVarBtn(c.name, c.value))}
                                </div>
                            )}

                            {/* Переменные проекта */}
                            {renderSection('project', 'Переменные проекта',
                                isLoadingVars
                                    ? <div className="flex items-center py-2"><div className="loader h-4 w-4" /></div>
                                    : variables
                                        ? <div className="flex flex-wrap gap-2">
                                            {variables.map(v => renderVarBtn(v.name, v.value))}
                                            <button type="button" onClick={() => {}} title="Добавить или изменить переменные проекта"
                                                className="px-3 py-1.5 text-xs font-medium border-2 border-dashed rounded-full transition-colors border-blue-400 text-blue-600 bg-white hover:bg-blue-50">
                                                + Добавить
                                            </button>
                                        </div>
                                        : <p className="text-sm text-center text-gray-500 py-1">Нажмите кнопку "Переменные" еще раз.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={isEmojiPickerOpen ? Math.max(2, rows - 1) : rows}
                    className="w-full p-2.5 text-sm text-gray-800 bg-white resize-y border-0 outline-none focus:ring-0 focus:outline-none custom-scrollbar"
                    placeholder="Введите текст шаблона..."
                />

                {/* Inline Emoji Picker (плавное раскрытие И сворачивание) */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${
                    isEmojiPickerOpen ? 'max-h-[350px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    {emojiEverShown && (
                        <EmojiPicker
                            projectId={project.id}
                            onSelectEmoji={handleInsertEmoji}
                            variant="inline"
                        />
                    )}
                </div>

                {/* Счётчик символов */}
                <div className="flex items-center justify-end px-2.5 py-1 bg-gray-50 border-t border-gray-200">
                    <span className={`text-xs tabular-nums ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {charCount}/{maxLength}
                    </span>
                </div>
            </div>

            {/* Пояснительный текст под редактором */}
            {helpText && (
                <p className="text-xs text-gray-500 mt-1.5">{helpText}</p>
            )}
        </div>
    );
};
