// =====================================================================
// Типы для mock-компонентов страницы логов конкурса отзывов
// =====================================================================

/** Уровни логирования */
export type LogLevel = 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING';

/** Статусы доставки призов */
export type DeliveryStatus = 'sent' | 'error';

/** Запись системного лога (терминал) */
export interface SystemLogEntry {
    time: string;
    level: LogLevel;
    message: string;
}

/** Запись журнала отправки призов */
export interface DeliveryLogEntry {
    id: string;
    userName: string;
    userVkId: number;
    promoCode: string;
    prizeDescription: string;
    status: DeliveryStatus;
    createdAt: string;
}
