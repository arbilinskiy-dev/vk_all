/**
 * Хук для загрузки данных АМ-аналитики.
 * Обёртка над API getAmAnalysisDashboard с управлением состоянием.
 */

import { useState, useEffect, useCallback } from 'react';
import { getAmAnalysisDashboard, AmAnalysisResponse } from '../../../../services/api/am_analysis.api';

interface UseAmAnalysisReturn {
    data: AmAnalysisResponse | null;
    isLoading: boolean;
    error: string | null;
    periodDays: number;
    setPeriodDays: (days: number) => void;
    refresh: () => void;
}

export const useAmAnalysis = (): UseAmAnalysisReturn => {
    const [data, setData] = useState<AmAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [periodDays, setPeriodDays] = useState(30);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await getAmAnalysisDashboard({ period_days: periodDays });
            setData(result);
        } catch (err: any) {
            setError(err?.message || 'Ошибка загрузки АМ-аналитики');
        } finally {
            setIsLoading(false);
        }
    }, [periodDays]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        data,
        isLoading,
        error,
        periodDays,
        setPeriodDays,
        refresh: load,
    };
};
