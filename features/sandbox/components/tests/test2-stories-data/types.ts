/**
 * Типы для теста "Получение данных историй".
 */

// ─── Шаг цепочки (для viewers_details) ──────────────────

export interface ChainStep {
    step: number;
    name: string;
    description: string;
    success: boolean;
    request: Record<string, any> | null;
    response: Record<string, any> | null;
    http_status: number | null;
    elapsed_ms: number;
    error: Record<string, any> | null;
}
