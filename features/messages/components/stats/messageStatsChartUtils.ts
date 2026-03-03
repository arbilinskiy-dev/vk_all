/**
 * Утилиты для компонента MessageStatsChart.
 * Конвертация UTC→MSK, заполнение пробелов нулями.
 */

import { MessageStatsChartPoint } from '../../../../services/api/messages_stats.api';
import { MSK_OFFSET_MS } from './messageStatsChartConstants';
import { ChartGranularity, NormalizedPoint } from './messageStatsChartTypes';

/** Преобразовать Date в «московское» время без сдвига на локальный TZ */
export function toMSK(date: Date): Date {
    // getTime() — UTC-миллисекунды. Добавляем MSK-смещение, затем работаем через UTC-методы.
    return new Date(date.getTime() + MSK_OFFSET_MS);
}

// ─── Заполнение пробелов (UTC → MSK конвертация) ───────────────────────

export function fillGaps(data: MessageStatsChartPoint[], granularity: ChartGranularity): NormalizedPoint[] {
    if (data.length === 0) return [];

    // hour_slot приходит из бэкенда в UTC. Конвертируем в MSK (UTC+3) перед агрегацией.
    type BucketEntry = { incoming: number; outgoing: number; total: number; unique_users: number;
        incoming_payload: number; incoming_text: number; outgoing_system: number; outgoing_bot: number;
        incoming_dialogs: number; unique_text_users: number; unique_payload_users: number; outgoing_recipients: number };
    const ZERO_BUCKET: BucketEntry = { incoming: 0, outgoing: 0, total: 0, unique_users: 0,
        incoming_payload: 0, incoming_text: 0, outgoing_system: 0, outgoing_bot: 0,
        incoming_dialogs: 0, unique_text_users: 0, unique_payload_users: 0, outgoing_recipients: 0 };
    const bucket = new Map<string, BucketEntry>();

    for (const d of data) {
        // Парсим hour_slot как UTC → конвертируем в MSK
        const [datePart, hourPart] = d.hour_slot.split('T');
        const [y, m, day] = datePart.split('-').map(Number);
        const utcMs = Date.UTC(y, m - 1, day, parseInt(hourPart || '0', 10));
        const mskMs = utcMs + MSK_OFFSET_MS;
        const mskDt = new Date(mskMs);

        // Формируем ключ уже в MSK
        let key: string;
        if (granularity === 'days') {
            key = `${mskDt.getUTCFullYear()}-${String(mskDt.getUTCMonth() + 1).padStart(2, '0')}-${String(mskDt.getUTCDate()).padStart(2, '0')}`;
        } else {
            key = `${mskDt.getUTCFullYear()}-${String(mskDt.getUTCMonth() + 1).padStart(2, '0')}-${String(mskDt.getUTCDate()).padStart(2, '0')}T${String(mskDt.getUTCHours()).padStart(2, '0')}`;
        }

        const prev = bucket.get(key) || { ...ZERO_BUCKET };
        prev.incoming += d.incoming;
        prev.outgoing += d.outgoing;
        prev.total += d.total;
        prev.unique_users += d.unique_users;
        prev.incoming_payload += d.incoming_payload ?? 0;
        prev.incoming_text += d.incoming_text ?? 0;
        prev.outgoing_system += d.outgoing_system ?? 0;
        prev.outgoing_bot += d.outgoing_bot ?? 0;
        prev.incoming_dialogs += d.incoming_dialogs ?? 0;
        prev.unique_text_users += d.unique_text_users ?? 0;
        prev.unique_payload_users += d.unique_payload_users ?? 0;
        prev.outgoing_recipients += d.outgoing_recipients ?? 0;
        bucket.set(key, prev);
    }

    // Ключи теперь в MSK
    const sortedKeys = [...bucket.keys()].sort();
    const minKey = sortedKeys[0];
    const maxKey = sortedKeys[sortedKeys.length - 1];

    const result: NormalizedPoint[] = [];

    if (granularity === 'hours') {
        // Ключи MSK формата "YYYY-MM-DDTHH"
        const parseMsk = (s: string) => {
            const [dp, hp] = s.split('T');
            const [y, m, d] = dp.split('-').map(Number);
            return Date.UTC(y, m - 1, d, parseInt(hp || '0', 10));
        };
        const fmtMsk = (ms: number) => {
            const dt = new Date(ms);
            return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}T${String(dt.getUTCHours()).padStart(2, '0')}`;
        };

        let cur = parseMsk(minKey);
        const end = parseMsk(maxKey);
        while (cur <= end) {
            const key = fmtMsk(cur);
            const val = bucket.get(key) || { ...ZERO_BUCKET };
            const dt = new Date(cur);
            result.push({
                slot: key,
                ...val,
                labelDate: `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}`,
                labelTime: `${String(dt.getUTCHours()).padStart(2, '0')}:00`,
            });
            cur += 3600_000;
        }
    } else {
        // По дням (ключи MSK "YYYY-MM-DD")
        const parseMsk = (s: string) => {
            const [y, m, d] = s.split('-').map(Number);
            return Date.UTC(y, m - 1, d);
        };
        const fmtMsk = (ms: number) => {
            const dt = new Date(ms);
            return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
        };

        let cur = parseMsk(minKey);
        const end = parseMsk(maxKey);
        while (cur <= end) {
            const key = fmtMsk(cur);
            const val = bucket.get(key) || { ...ZERO_BUCKET };
            const dt = new Date(cur);
            result.push({
                slot: key,
                ...val,
                labelDate: `${String(dt.getUTCDate()).padStart(2, '0')}.${String(dt.getUTCMonth() + 1).padStart(2, '0')}`,
                labelTime: '',
            });
            cur += 86400_000;
        }
    }

    return result;
}
