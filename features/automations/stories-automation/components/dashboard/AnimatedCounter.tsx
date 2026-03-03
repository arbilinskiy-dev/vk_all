import React from 'react';
import { useCountAnimation } from './useCountAnimation';

// ВАЖНО: Компонент вынесен за пределы StoriesDashboard чтобы не пересоздаваться при каждом рендере
export const AnimatedCounter: React.FC<{ value: number; duration?: number; suffix?: string; decimals?: number }> = 
    ({ value, duration = 1200, suffix = '', decimals = 0 }) => {
    const animatedValue = useCountAnimation(
        decimals > 0 ? Math.round(value * Math.pow(10, decimals)) : value,
        duration,
        100 // небольшая задержка для синхронизации с появлением контейнера
    );
    
    const displayValue = decimals > 0 
        ? (animatedValue / Math.pow(10, decimals)).toFixed(decimals)
        : animatedValue.toLocaleString();
    
    return <>{displayValue}{suffix}</>;
};
