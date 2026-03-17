/**
 * Типы для инфографики источников заказов DLVRY.
 */

import React from 'react';

// ─── Входные данные (из SalesTabContent) ─────────────────────────────────────

export interface SourceTotals {
    source_site: number;
    sum_source_site: number;
    source_vkapp: number;
    sum_source_vkapp: number;
    source_ios: number;
    sum_source_ios: number;
    source_android: number;
    sum_source_android: number;
    orders: number;
    revenue: number;
}

export interface SourcesInfographicProps {
    /** Агрегированные итоги по источникам (из totals в SalesTabContent) */
    totals: SourceTotals | null;
    /** Загрузка данных */
    isLoading: boolean;
}

// ─── Конфигурация одного источника ───────────────────────────────────────────

export interface SourceDef {
    key: string;
    label: string;
    icon: React.ReactNode;
    /** Цвет сегмента stacked bar */
    color: string;
    /** Tailwind-класс для крупного числа */
    numberClass: string;
    /** Tailwind-класс для иконки */
    iconClass: string;
    /** Tailwind-класс для фона иконки */
    iconBgClass: string;
    /** Tailwind-класс для hover-бордера */
    hoverBorderClass: string;
    /** Tailwind-класс для прогресс-бара */
    barClass: string;
    /** Tailwind-класс для бейджа */
    badgeBg: string;
    badgeText: string;
    /** Tailwind-класс для цветной точки */
    dotClass: string;
}

// ─── Обогащённый источник (после подсчёта) ───────────────────────────────────

export interface SourceData extends SourceDef {
    orders: number;
    revenue: number;
    avgCheck: number;
}
