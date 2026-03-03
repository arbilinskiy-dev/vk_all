/**
 * Парсер TSV-данных из буфера обмена (Ctrl+V из Excel / Google Sheets).
 * 
 * Корректно обрабатывает:
 * - Ячейки с переносами строк (оборачиваются в двойные кавычки при копировании)
 * - Экранирование кавычек внутри ячеек ("" → ")
 * - Пустые ячейки
 * - Смешанные разделители строк (\r\n, \n, \r)
 */

/**
 * Парсит TSV-текст из буфера обмена в двумерный массив строк.
 * Учитывает ячейки, обёрнутые в двойные кавычки (содержащие переносы строк).
 * 
 * @param text - Сырой текст из textarea (скопированный из Excel/Google Sheets)
 * @returns Двумерный массив строк: rows × columns
 */
export function parseTSV(text: string): string[][] {
    if (!text.trim()) return [];

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];

        if (inQuotes) {
            // Внутри кавычек — ищем закрывающую кавычку
            if (char === '"') {
                // Проверяем: если следующий символ тоже кавычка — это экранирование ("" → ")
                if (i + 1 < text.length && text[i + 1] === '"') {
                    currentCell += '"';
                    i += 2; // Пропускаем обе кавычки
                    continue;
                } else {
                    // Закрывающая кавычка
                    inQuotes = false;
                    i++;
                    continue;
                }
            } else {
                // Обычный символ внутри кавычек (включая \n, \r, \t)
                currentCell += char;
                i++;
                continue;
            }
        }

        // Вне кавычек
        if (char === '"') {
            // Открывающая кавычка (должна быть в начале ячейки или после таба)
            inQuotes = true;
            i++;
            continue;
        }

        if (char === '\t') {
            // Разделитель колонок — завершаем текущую ячейку
            currentRow.push(currentCell);
            currentCell = '';
            i++;
            continue;
        }

        if (char === '\r' || char === '\n') {
            // Разделитель строк — завершаем строку
            // Обрабатываем \r\n как один перенос
            if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
                i++; // Пропускаем \n
            }

            // Завершаем текущую ячейку и строку
            currentRow.push(currentCell);
            currentCell = '';

            // Добавляем строку, если она не полностью пустая
            if (currentRow.some(cell => cell.trim() !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            i++;
            continue;
        }

        // Обычный символ
        currentCell += char;
        i++;
    }

    // Обработка последней ячейки и строки (если текст не заканчивался переносом)
    currentRow.push(currentCell);
    if (currentRow.some(cell => cell.trim() !== '')) {
        rows.push(currentRow);
    }

    // Нормализуем: все строки должны быть одной длины
    if (rows.length === 0) return [];
    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
    return rows.map(row => {
        while (row.length < maxCols) {
            row.push('');
        }
        return row;
    });
}
