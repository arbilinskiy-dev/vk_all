import { v4 as uuidv4 } from 'uuid';
import { NewProductRow } from '../types';
import { MarketAlbum, MarketCategory } from '../../../shared/types';
import { getOriginalPhotoUrl } from './photoUrlHelper';

// Объявляем глобальную переменную XLSX
declare var XLSX: any;

// Карта для автоматического сопоставления заголовков (в нижнем регистре)
export const HEADER_MAP: Record<string, string> = {
    'vk id': 'vk_id',
    'vk link': 'vk_link',
    'название': 'title',
    'описание': 'description',
    'цена': 'price',
    'старая цена': 'old_price',
    'артикул': 'sku',
    'фото (url)': 'photoUrl',
    'подборка': 'album',
    'категория': 'category',
};

/**
 * Парсит файл и возвращает очищенную прямоугольную сетку данных.
 * Гарантирует отсутствие смещения колонок даже при пустых ячейках A1 или пустых первых строках.
 * Для CSV файлов корректно обрабатывает UTF-8 кодировку (Google Sheets, Excel).
 */
export const parseFileToGrid = async (file: File): Promise<string[][]> => {
    // Определяем формат файла по расширению, MIME-типу и magic bytes
    const isBinaryExcel = await isBinaryExcelFile(file);
    
    console.log('[parseFileToGrid] Файл:', file.name, 'Тип:', file.type, 'Бинарный Excel:', isBinaryExcel);
    
    if (isBinaryExcel) {
        // XLSX/XLS: бинарный формат — читаем через XLSX библиотеку
        console.log('[parseFileToGrid] → Парсим как XLSX');
        return parseXLSXFile(file);
    } else {
        // CSV/TSV/текстовый формат — читаем как UTF-8 текст
        console.log('[parseFileToGrid] → Парсим как CSV (UTF-8)');
        return parseCSVFile(file);
    }
};

/**
 * Проверяет, является ли файл бинарным Excel (XLSX/XLS) по magic bytes.
 * XLSX = ZIP-архив (начинается с PK, байты 0x50 0x4B)
 * XLS = OLE2 Compound Document (начинается с 0xD0 0xCF 0x11 0xE0)
 */
const isBinaryExcelFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer);
            if (arr.length < 4) {
                resolve(false);
                return;
            }
            // XLSX (ZIP): PK\x03\x04
            const isZip = arr[0] === 0x50 && arr[1] === 0x4B && arr[2] === 0x03 && arr[3] === 0x04;
            // XLS (OLE2): 0xD0 0xCF 0x11 0xE0
            const isOle2 = arr[0] === 0xD0 && arr[1] === 0xCF && arr[2] === 0x11 && arr[3] === 0xE0;
            resolve(isZip || isOle2);
        };
        reader.onerror = () => resolve(false); // Если ошибка — считаем текстовым
        // Читаем только первые 4 байта для определения типа
        reader.readAsArrayBuffer(file.slice(0, 4));
    });
};

/**
 * Парсит CSV файл с корректной обработкой UTF-8 кодировки.
 * Поддерживает ячейки с переносами строк (в кавычках), разделители: запятая, точка с запятой, табуляция.
 */
const parseCSVFile = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let text = e.target?.result as string;
                if (!text || !text.trim()) {
                    resolve([]);
                    return;
                }

                // Убираем BOM (Byte Order Mark) если есть
                if (text.charCodeAt(0) === 0xFEFF) {
                    text = text.slice(1);
                }

                // Определяем разделитель (запятая, точка с запятой или табуляция)
                const delimiter = detectCSVDelimiter(text);
                
                // Парсим CSV с учётом кавычек и переносов строк
                const rawRows = parseCSVText(text, delimiter);
                
                // Нормализуем в прямоугольную сетку
                const grid = normalizeGrid(rawRows);
                resolve(grid);
            } catch (error) {
                console.error("CSV parse error:", error);
                reject(new Error("Не удалось прочитать CSV файл. Проверьте формат и кодировку."));
            }
        };
        reader.onerror = () => reject(new Error("Ошибка чтения файла."));
        // Читаем как текст в UTF-8 — ключевое отличие от XLSX
        reader.readAsText(file, 'UTF-8');
    });
};

/**
 * Определяет разделитель CSV: запятая, точка с запятой или табуляция.
 * Анализирует первую строку файла.
 */
const detectCSVDelimiter = (text: string): string => {
    // Берём первую строку (без учёта кавычек)
    const firstLine = text.split('\n')[0] || '';
    
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    // Приоритет: табуляция > точка с запятой > запятая
    if (tabCount > 0 && tabCount >= semicolonCount && tabCount >= commaCount) return '\t';
    if (semicolonCount > commaCount) return ';';
    return ',';
};

/**
 * Парсит CSV текст с полной поддержкой RFC 4180:
 * - Ячейки в кавычках (переносы строк внутри)
 * - Экранирование кавычек ("" → ")
 */
const parseCSVText = (text: string, delimiter: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    // Экранированная кавычка "" → "
                    currentCell += '"';
                    i += 2;
                    continue;
                } else {
                    // Закрывающая кавычка
                    inQuotes = false;
                    i++;
                    continue;
                }
            } else {
                currentCell += char;
                i++;
                continue;
            }
        }

        // Вне кавычек
        if (char === '"') {
            inQuotes = true;
            i++;
            continue;
        }

        if (char === delimiter) {
            currentRow.push(currentCell.trim());
            currentCell = '';
            i++;
            continue;
        }

        if (char === '\r' || char === '\n') {
            if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
                i++; // Пропускаем \n в \r\n
            }
            currentRow.push(currentCell.trim());
            currentCell = '';
            if (currentRow.some(cell => cell !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            i++;
            continue;
        }

        currentCell += char;
        i++;
    }

    // Последняя строка
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
    }

    return rows;
};

/**
 * Нормализует двумерный массив в прямоугольную сетку:
 * - Все строки одной длины
 * - Убирает пустые строки в начале и конце
 */
const normalizeGrid = (rawRows: string[][]): string[][] => {
    if (rawRows.length === 0) return [];

    // Находим первую строку с данными
    const firstContentRowIndex = rawRows.findIndex(row => 
        row.some(cell => cell.trim() !== '')
    );
    if (firstContentRowIndex === -1) return [];

    const contentRows = rawRows.slice(firstContentRowIndex);
    const maxCols = contentRows.reduce((max, row) => Math.max(max, row.length), 0);

    // Формируем прямоугольную сетку
    const grid: string[][] = contentRows.map(row => {
        const normalizedRow = Array(maxCols).fill("");
        row.forEach((cell, i) => {
            normalizedRow[i] = cell;
        });
        return normalizedRow;
    });

    // Убираем пустые строки в конце
    let lastNonEmptyRow = grid.length - 1;
    while (lastNonEmptyRow >= 0 && !grid[lastNonEmptyRow].some(cell => cell !== "")) {
        lastNonEmptyRow--;
    }

    return lastNonEmptyRow >= 0 ? grid.slice(0, lastNonEmptyRow + 1) : [];
};

/**
 * Парсит XLSX/XLS файл через библиотеку SheetJS (XLSX).
 */
const parseXLSXFile = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                
                if (!worksheet) {
                    resolve([]);
                    return;
                }

                // 1. Принудительно определяем диапазон начиная с A1
                const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
                range.s.r = 0;
                range.s.c = 0;
                const forcedRange = XLSX.utils.encode_range(range);

                // 2. Получаем данные в виде 2D массива
                const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1, 
                    defval: "",
                    range: forcedRange,
                    blankrows: true 
                });

                if (!rawRows || rawRows.length === 0) {
                    resolve([]);
                    return;
                }

                // Нормализуем через общую функцию
                const stringRows = rawRows.map(row => 
                    (Array.isArray(row) ? row : []).map(cell => 
                        (cell !== null && cell !== undefined) ? String(cell).trim() : ""
                    )
                );
                
                resolve(normalizeGrid(stringRows));
            } catch (error) {
                console.error("XLSX parse error:", error);
                reject(new Error("Не удалось прочитать файл. Убедитесь, что он в формате CSV или XLSX."));
            }
        };
        reader.onerror = () => reject(new Error("Ошибка чтения файла."));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Парсит файл и сразу конвертирует его в массив объектов NewProductRow.
 * Используется в упрощенном режиме загрузки "Создать новые".
 */
export const parseProductFile = async (
    file: File, 
    allAlbums: MarketAlbum[], 
    allCategories: MarketCategory[]
): Promise<NewProductRow[]> => {
    const grid = await parseFileToGrid(file);
    if (grid.length < 2) return [];

    const headers = grid[0].map(h => h.toLowerCase().trim());
    const dataRows = grid.slice(1);

    const albumMap = new Map(allAlbums.map(a => [a.title.toLowerCase(), a]));
    const categoryNameMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c]));
    const categoryIdMap = new Map(allCategories.map(c => [c.id, c]));

    return dataRows.map(row => {
        const newRow: any = { tempId: uuidv4(), price: '' };
        headers.forEach((header, index) => {
            const fieldKey = HEADER_MAP[header];
            if (!fieldKey) return;

            const value = row[index];
            if (!value) return;

            if (fieldKey === 'album') {
                const albumName = value.split('(')[0].trim().toLowerCase();
                const album = albumMap.get(albumName);
                if (album) newRow.album_ids = [album.id];
            } else if (fieldKey === 'category') {
                const valStr = String(value);
                const idMatch = valStr.match(/\((\d+)\)$/);
                let category: MarketCategory | undefined;
                if (idMatch) category = categoryIdMap.get(parseInt(idMatch[1], 10));
                if (!category) category = categoryNameMap.get(valStr.split('(')[0].trim().toLowerCase());
                if (category) newRow.category = { id: category.id, name: category.name, section_id: category.section_id, section_name: category.section_name };
            } else if (fieldKey === 'photoUrl') {
                // Очищаем VK CDN URL от crop/size параметров для получения оригинала
                const cleanUrl = getOriginalPhotoUrl(value);
                newRow.photoUrl = cleanUrl;
                newRow.photoPreview = cleanUrl;
            } else {
                newRow[fieldKey] = value;
            }
        });
        return newRow as NewProductRow;
    });
};