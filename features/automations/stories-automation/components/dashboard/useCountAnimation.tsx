import { useState, useEffect, useRef } from 'react';

/**
 * Хук для анимации счётчика от текущего значения к новому target.
 * При изменении target анимирует от предыдущего значения к новому, а не с нуля.
 * Использует easeOutExpo для плавного замедления в конце.
 */
export const useCountAnimation = (target: number, duration: number = 1200, delay: number = 0): number => {
    // Используем useRef для хранения текущего отображаемого значения между рендерами
    const displayedValueRef = useRef<number | null>(null);
    const [count, setCount] = useState(() => {
        // Инициализация: если это первый рендер компонента, начинаем с 0
        // displayedValueRef.current будет null только при первом создании хука
        return displayedValueRef.current ?? 0;
    });
    
    const startValueRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const frameRef = useRef<number>();
    const prevTargetRef = useRef<number | null>(null);

    useEffect(() => {
        // Определяем стартовое значение для анимации
        if (prevTargetRef.current === null) {
            // Первый вызов effect - анимируем с 0
            startValueRef.current = 0;
        } else if (prevTargetRef.current !== target) {
            // Target изменился - анимируем от текущего отображаемого значения
            startValueRef.current = displayedValueRef.current ?? 0;
        } else {
            // Target не изменился - ничего не делаем
            return;
        }
        
        // ВАЖНО: НЕ обновляем prevTargetRef здесь!
        // prevTargetRef обновляется только ВНУТРИ setTimeout (после delay)
        // или синхронно если анимация не нужна (target === startValue).
        // Это делает хук совместимым с React StrictMode:
        // StrictMode cleanup отменяет setTimeout → ref НЕ обновлён →
        // повторный запуск эффекта корректно обнаруживает "новый" target
        // и перезапускает анимацию.
        startTimeRef.current = null;
        
        // Если уже на нужном значении - не анимируем
        if (target === startValueRef.current) {
            setCount(target);
            displayedValueRef.current = target;
            prevTargetRef.current = target; // Безопасно: нет отложенной работы
            return;
        }

        const delayTimeout = setTimeout(() => {
            // Фиксируем target как "принятый" — анимация начинается
            prevTargetRef.current = target;
            
            const animate = (timestamp: number) => {
                if (!startTimeRef.current) {
                    startTimeRef.current = timestamp;
                }

                const elapsed = timestamp - startTimeRef.current;
                const progress = Math.min(elapsed / duration, 1);
                
                // easeOutExpo - быстрый старт, плавное замедление
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                
                // Анимируем от startValue к target
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
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [target, duration, delay]);

    return count;
};

/**
 * Компонент-обёртка для анимированного числа
 */
export const AnimatedNumber: React.FC<{
    value: number;
    duration?: number;
    delay?: number;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    className?: string;
}> = ({ value, duration = 1200, delay = 0, suffix = '', prefix = '', decimals = 0, className }) => {
    const animatedValue = useCountAnimation(
        decimals > 0 ? Math.round(value * Math.pow(10, decimals)) : value,
        duration,
        delay
    );
    
    const displayValue = decimals > 0 
        ? (animatedValue / Math.pow(10, decimals)).toFixed(decimals)
        : animatedValue.toLocaleString();
    
    return <span className={className}>{prefix}{displayValue}{suffix}</span>;
};
