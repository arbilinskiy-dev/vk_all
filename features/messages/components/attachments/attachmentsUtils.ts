/**
 * Утилиты для вкладки «Вложения».
 * Форматирование дат, размеров, длительности, скачивание и копирование.
 */

/** Форматирование даты вложения */
export function formatAttachmentDate(isoDate: string): string {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** Форматирование размера файла */
export function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

/** Форматирование длительности (секунды → мм:сс) */
export function formatDuration(seconds?: number): string {
    if (!seconds) return '';
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

/** Скачивание фото через fetch → blob → download */
export function downloadPhoto(url: string, filename?: string) {
    fetch(url)
        .then(res => res.blob())
        .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename || `photo_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        })
        .catch(() => {
            // Если fetch не сработал (CORS) — открываем в новой вкладке
            window.open(url, '_blank');
        });
}

/** Копирование текста в буфер обмена */
export function copyToClipboard(text: string, setCopiedId: (id: string | null) => void, id: string) {
    navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 1500);
    }).catch(() => {});
}
