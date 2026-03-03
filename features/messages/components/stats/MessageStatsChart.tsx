/**
 * Компонент графика пиковых нагрузок сообщений — ХАБ.
 * Адаптивная SVG-визуализация без внешних зависимостей.
 * Логика вынесена в useMessageStatsChartLogic, визуал — в подкомпоненты.
 *
 * Время на графике — серверное московское (MSK, UTC+3).
 */

import React from 'react';
import { useMessageStatsChartLogic } from '../../hooks/stats/useMessageStatsChartLogic';
import { MessageStatsChartHeader } from './MessageStatsChartHeader';
import { MessageStatsChartSVG } from './MessageStatsChartSVG';
import { ChartTooltip } from './MessageStatsChartTooltip';
import { BADGE_LINE_COLORS } from './messageStatsChartConstants';
import { MessageStatsChartProps } from './messageStatsChartTypes';

// Реэкспорт типа для обратной совместимости
export type { ChartOverlayMetric } from './messageStatsChartTypes';

export const MessageStatsChart: React.FC<MessageStatsChartProps> = ({ data, visibleLines = 'both', overlayMetrics }) => {
    const visibleLinesResolved = visibleLines as 'both' | 'incoming' | 'outgoing';
    const { state, actions } = useMessageStatsChartLogic({ data, visibleLines: visibleLinesResolved, overlayMetrics });

    // ─── Пустое состояние ─────────────────────────────────────
    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex items-center justify-center text-gray-400 opacity-0 animate-fade-in-up">
                <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <p>Нет данных за выбранный период</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full" ref={state.containerRef}>
            {/* Шапка: легенда + данные дашборда + время MSK + гранулярность */}
            <MessageStatsChartHeader
                activeMetrics={state.activeMetrics}
                overlayMetrics={overlayMetrics}
                activeOverlays={state.activeOverlays}
                toggleOverlay={actions.toggleOverlay}
                nowMSK={state.nowMSK}
                granularity={state.granularity}
                setGranularity={actions.setGranularity}
            />

            {/* SVG-график */}
            <div className="relative h-80 w-full select-none">
                <MessageStatsChartSVG
                    normalized={state.normalized}
                    activeMetrics={state.activeMetrics}
                    overlayMetrics={overlayMetrics}
                    activeOverlays={state.activeOverlays}
                    width={state.width}
                    height={state.height}
                    paddingX={state.paddingX}
                    paddingY={state.paddingY}
                    gridLines={state.gridLines}
                    xAxisLabels={state.xAxisLabels}
                    minMaxPoints={state.minMaxPoints}
                    tooltip={state.tooltip}
                    setTooltip={actions.setTooltip}
                    getCoords={actions.getCoords}
                />

                {/* Портальный тултип */}
                {state.tooltip && (
                    <ChartTooltip
                        x={state.tooltip.x}
                        y={state.tooltip.y}
                        point={state.tooltip.point}
                        visibleLines={state.activeMetrics}
                        activeOverlayItems={overlayMetrics
                            ? [...state.activeOverlays].map(idx => {
                                const om = overlayMetrics[idx];
                                return om ? { label: om.label, key: om.key, color: BADGE_LINE_COLORS[idx % BADGE_LINE_COLORS.length] } : null;
                            }).filter(Boolean) as { label: string; key: string; color: string }[]
                            : undefined
                        }
                    />
                )}
            </div>

            {/* Подпись часового пояса */}
            <p className="text-[10px] text-gray-400 text-right mt-1">Время на графике — серверное (Москва, UTC+3)</p>
        </div>
    );
};
