import React, { useState, useEffect, useRef } from 'react';

/**
 * Хук для анимации счётчика от текущего значения к новому target.
 * При изменении target анимирует от предыдущего значения к новому, а не с нуля.
 * Использует easeOutExpo для плавного замедления в конце.
 */
export const useCountAnimation = (target: number, duration: number = 1500, delay: number = 0): number => {
    const displayedValueRef = useRef<number | null>(null);
    const [count, setCount] = useState(() => displayedValueRef.current ?? 0);
    
    const startValueRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const frameRef = useRef<number>();
    const prevTargetRef = useRef<number | null>(null);

    useEffect(() => {
        if (prevTargetRef.current === null) {
            startValueRef.current = 0;
        } else if (prevTargetRef.current !== target) {
            startValueRef.current = displayedValueRef.current ?? 0;
        } else {
            return;
        }
        
        startTimeRef.current = null;
        
        if (target === startValueRef.current) {
            setCount(target);
            displayedValueRef.current = target;
            prevTargetRef.current = target;
            return;
        }

        const delayTimeout = setTimeout(() => {
            prevTargetRef.current = target;
            
            const animate = (timestamp: number) => {
                if (!startTimeRef.current) startTimeRef.current = timestamp;

                const elapsed = timestamp - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                
                const diff = target - startValueRef.current;
                const currentValue = Math.floor(startValueRef.current + easeProgress * diff);
                
                setCount(currentValue);
                displayedValueRef.current = currentValue;

                if (progress < 1) {
                    frameRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(target);
                    displayedValueRef.current = target;
                }
            };

            frameRef.current = requestAnimationFrame(animate);
        }, delay);

        return () => {
            clearTimeout(delayTimeout);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [target, duration, delay]);

    return count;
};

/**
 * Компонент-обёртка для анимированного числа.
 * Плавно анимирует переход от старого значения к новому.
 */
export const AnimatedNumber: React.FC<{
    value: number;
    duration?: number;
    delay?: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    className?: string;
    format?: boolean;
}> = ({ value, duration = 1500, delay = 0, suffix = '', prefix = '', decimals = 0, className, format = false }) => {
    const animatedValue = useCountAnimation(
        decimals > 0 ? Math.round(value * Math.pow(10, decimals)) : value,
        duration,
        delay
    );
    
    const displayValue = decimals > 0 
        ? (animatedValue / Math.pow(10, decimals)).toFixed(decimals)
        : format 
            ? animatedValue.toLocaleString('ru-RU')
            : String(animatedValue);
    
    return <span className={className}>{prefix}{displayValue}{suffix}</span>;
};
