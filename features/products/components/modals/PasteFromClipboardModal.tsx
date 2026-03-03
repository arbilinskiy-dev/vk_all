import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';
import { NewProductRow } from '../../types';
import { MarketAlbum, MarketCategory } from '../../../../shared/types';
import * as api from '../../../../services/api';
import { parseTSV } from '../../utils/tsvParser';
import { HEADER_MAP } from '../../utils/fileParser';

interface PasteFromClipboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (rows: NewProductRow[]) => void;
    allAlbums: MarketAlbum[];
    allCategories: MarketCategory[];
    projectId: string;
    onAlbumsCreated?: (newAlbums: MarketAlbum[]) => void;
}

type ProductField = 'title' | 'description' | 'price' | 'old_price' | 'sku' | 'category' | 'album' | 'photoUrl' | 'skip';

const FIELD_OPTIONS: { value: ProductField; label: string }[] = [
    { value: 'skip', label: 'Пропустить' },
    { value: 'title', label: 'Название' },
    { value: 'description', label: 'Описание' },
    { value: 'price', label: 'Цена' },
    { value: 'old_price', label: 'Старая цена' },
    { value: 'sku', label: 'Артикул' },
    { value: 'category', label: 'Категория' },
    { value: 'album', label: 'Подборка' },
    { value: 'photoUrl', label: 'Фото (URL)' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Кастомный выпадающий список для маппинга колонок
// Рендерится через портал, чтобы корректно отображаться поверх таблицы с overflow
// ═══════════════════════════════════════════════════════════════════════════════
interface ColumnMappingDropdownProps {
    value: ProductField;
    onChange: (value: ProductField) => void;
    usedFields: Set<ProductField>;
}

const ColumnMappingDropdown: React.FC<ColumnMappingDropdownProps> = ({ value, onChange, usedFields }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Вычисляем позицию выпадающего списка
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            });
        }
    }, []);

    // Открытие/закрытие
    const toggleDropdown = useCallback(() => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(prev => !prev);
    }, [isOpen, updatePosition]);

    // Закрытие по клику вне компонента
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        // Закрытие при скроллe или ресайзе
        const handleScrollOrResize = () => setIsOpen(false);

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen]);

    const handleSelect = (fieldValue: ProductField) => {
        onChange(fieldValue);
        setIsOpen(false);
    };

    const isActive = value !== 'skip';
    const currentLabel = FIELD_OPTIONS.find(opt => opt.value === value)?.label || 'Пропустить';

    return (
        <>
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className={`w-full flex items-center justify-between p-1.5 border rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    isActive ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                }`}
            >
                <span className="truncate">{currentLabel}</span>
                <svg className={`w-3.5 h-3.5 ml-1 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[200] bg-white rounded-md shadow-xl border border-gray-200 py-1 animate-fade-in-up overflow-hidden"
                    style={{ top: position.top, left: position.left, width: Math.max(position.width, 160) }}
                >
                    {FIELD_OPTIONS.map(opt => {
                        // Каждое поле (кроме 'skip') может быть выбрано только один раз
                        const isUsedElsewhere = opt.value !== 'skip' && usedFields.has(opt.value) && value !== opt.value;
                        const isSelected = value === opt.value;

                        return (
                            <button
                                key={opt.value}
                                onClick={() => !isUsedElsewhere && handleSelect(opt.value)}
                                disabled={isUsedElsewhere}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center justify-between ${
                                    isSelected
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : isUsedElsewhere
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span>{opt.label}</span>
                                {isSelected && (
                                    <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                {isUsedElsewhere && (
                                    <span className="text-[10px] text-gray-300">занято</span>
                                )}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

export const PasteFromClipboardModal: React.FC<PasteFromClipboardModalProps> = ({
    isOpen, onClose, onImport, allAlbums, allCategories, projectId, onAlbumsCreated
}) => {
    const [rawText, setRawText] = useState('');
    const [mapping, setMapping] = useState<Record<number, ProductField>>({});
    const [isImporting, setIsImporting] = useState(false);

    // Парсим текст в двумерный массив (строки и столбцы)
    // Используем полноценный TSV-парсер, который корректно обрабатывает
    // ячейки с переносами строк (Excel/Google Sheets оборачивает их в кавычки)
    const gridData = useMemo(() => parseTSV(rawText), [rawText]);

    const maxCols = useMemo(() => {
        return gridData.reduce((max, row) => Math.max(max, row.length), 0);
    }, [gridData]);

    // Множество уже выбранных полей (кроме 'skip') — для валидации уникальности
    const usedFields = useMemo(() => {
        const used = new Set<ProductField>();
        Object.values(mapping).forEach(field => {
            if (field && field !== 'skip') used.add(field);
        });
        return used;
    }, [mapping]);

    // Инициализация маппинга при появлении данных с авто-определением по заголовкам
    React.useEffect(() => {
        if (maxCols > 0 && gridData.length > 0) {
            const initialMapping: Record<number, ProductField> = {};
            const firstRow = gridData[0];
            const alreadyMapped = new Set<ProductField>();

            // Пробуем определить поля по заголовкам первой строки
            for (let i = 0; i < maxCols; i++) {
                const cellValue = firstRow[i]?.trim().toLowerCase() || '';
                const suggestedField = HEADER_MAP[cellValue] as ProductField | undefined;

                if (suggestedField && !alreadyMapped.has(suggestedField)) {
                    initialMapping[i] = suggestedField;
                    alreadyMapped.add(suggestedField);
                } else {
                    initialMapping[i] = 'skip';
                }
            }
            setMapping(initialMapping);
        }
    }, [maxCols, gridData]);

    const handleImport = async () => {
        setIsImporting(true);
        try {
            // 1. Собираем все уникальные названия подборок из данных
            const albumColumnIdx = Object.entries(mapping).find(([_, field]) => field === 'album')?.[0];
            const uniqueAlbumNames = new Set<string>();
            if (albumColumnIdx !== undefined) {
                gridData.forEach(row => {
                    const val = row[Number(albumColumnIdx)]?.trim();
                    if (val) uniqueAlbumNames.add(val);
                });
            }

            // 2. Определяем, какие подборки нужно создать
            const albumNameToId = new Map<string, number>();
            const newlyCreatedAlbums: MarketAlbum[] = [];
            
            // Сначала заполняем из существующих
            for (const name of uniqueAlbumNames) {
                const found = allAlbums.find(a => a.title.toLowerCase() === name.toLowerCase());
                if (found) {
                    albumNameToId.set(name.toLowerCase(), found.id);
                }
            }

            // Создаём недостающие подборки
            for (const name of uniqueAlbumNames) {
                if (!albumNameToId.has(name.toLowerCase())) {
                    try {
                        const newAlbum = await api.createMarketAlbum(projectId, name);
                        albumNameToId.set(name.toLowerCase(), newAlbum.id);
                        newlyCreatedAlbums.push(newAlbum);
                    } catch (err) {
                        console.error(`Не удалось создать подборку "${name}":`, err);
                        window.showAppToast?.(`Не удалось создать подборку "${name}"`, 'warning');
                    }
                }
            }

            // 3. Уведомляем родителя о созданных подборках
            if (newlyCreatedAlbums.length > 0 && onAlbumsCreated) {
                onAlbumsCreated(newlyCreatedAlbums);
            }

            // 4. Формируем строки товаров
            const resultRows: NewProductRow[] = gridData.map(row => {
                const newRow: NewProductRow = { tempId: uuidv4(), price: '' };
                
                row.forEach((cell, idx) => {
                    const field = mapping[idx];
                    if (!field || field === 'skip') return;

                    const val = cell.trim();
                    if (!val) return;

                    if (field === 'title') newRow.title = val;
                    else if (field === 'description') newRow.description = val;
                    else if (field === 'price') newRow.price = val;
                    else if (field === 'old_price') newRow.old_price = val;
                    else if (field === 'sku') newRow.sku = val;
                    else if (field === 'photoUrl') {
                        // Ссылка на фото
                        newRow.photoUrl = val;
                        newRow.photoPreview = val;
                        newRow.useDefaultImage = false;
                    } else if (field === 'category') {
                        // Умный поиск категории: сначала по ID в скобках, потом по названию
                        const idMatch = val.match(/\((\d+)\)$/);
                        let found: MarketCategory | undefined;
                        
                        if (idMatch) {
                            const id = parseInt(idMatch[1], 10);
                            found = allCategories.find(c => c.id === id);
                        }
                        if (!found) {
                            // Пробуем по названию (без скобок с ID)
                            const cleanName = val.split('(')[0].trim().toLowerCase();
                            found = allCategories.find(c => 
                                c.name.toLowerCase() === cleanName || 
                                `${c.section_name} / ${c.name}`.toLowerCase() === cleanName
                            );
                        }
                        if (found) {
                            newRow.category = {
                                id: found.id,
                                name: found.name,
                                section_id: found.section_id,
                                section_name: found.section_name
                            };
                        }
                    } else if (field === 'album') {
                        // Поиск альбома по названию (включая только что созданные)
                        const albumId = albumNameToId.get(val.toLowerCase());
                        if (albumId) newRow.album_ids = [albumId];
                    }
                });
                return newRow;
            });

            onImport(resultRows);
        } catch (err) {
            console.error('Ошибка при импорте:', err);
            window.showAppToast?.('Произошла ошибка при импорте', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Импорт данных из буфера</h2>
                        <p className="text-xs text-gray-500 mt-1">Скопируйте таблицу в Excel/Google Sheets и вставьте в поле ниже.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="p-6 overflow-hidden flex flex-col gap-6">
                    {/* 1. Область вставки */}
                    <div className="flex-shrink-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Вставьте данные сюда (Ctrl + V)</label>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 font-mono"
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="Название	Описание	Цена...&#10;Пицца	Вкусная пицца	1000..."
                        />
                    </div>

                    {/* 2. Превью и маппинг */}
                    {gridData.length > 0 && (
                        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Настройка колонок</label>
                            <div className="flex-grow overflow-auto border border-gray-200 rounded-lg custom-scrollbar shadow-inner bg-white">
                                <table className="w-full text-sm border-collapse">
                                    <thead className="sticky top-0 z-10 bg-gray-100">
                                        <tr>
                                            {Array.from({ length: maxCols }).map((_, idx) => (
                                                <th key={idx} className="p-3 border-r border-gray-200 last:border-0 min-w-[150px]">
                                                    <ColumnMappingDropdown
                                                        value={mapping[idx] || 'skip'}
                                                        onChange={(val) => setMapping(prev => ({ ...prev, [idx]: val }))}
                                                        usedFields={usedFields}
                                                    />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {gridData.slice(0, 50).map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-gray-50">
                                                {Array.from({ length: maxCols }).map((_, cIdx) => (
                                                    <td key={cIdx} className={`p-3 border-r border-gray-100 last:border-0 truncate max-w-[200px] ${mapping[cIdx] !== 'skip' ? 'bg-indigo-50/20' : ''}`}>
                                                        {row[cIdx] || ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {gridData.length > 50 && (
                                <p className="text-[10px] text-gray-400 mt-2 italic text-right">Показаны первые 50 строк из {gridData.length}</p>
                            )}
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">Отмена</button>
                    <button
                        onClick={handleImport}
                        disabled={gridData.length === 0 || isImporting}
                        className="px-6 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-400 shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isImporting ? (
                            <>
                                <div className="loader border-white border-t-transparent h-4 w-4"></div>
                                Создание подборок...
                            </>
                        ) : (
                            `Импортировать ${gridData.length > 0 ? `(${gridData.length})` : ''}`
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};