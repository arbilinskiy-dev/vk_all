import React, { useState, useEffect, useRef } from 'react';

// Компонент мини-графика (Sparkline) с анимацией построения
export const Sparkline = ({ 
    data, 
    colorClass, 
    fillClass,
    animated = true,
    animationDelay = 0 
}: { 
    data: number[], 
    colorClass: string, 
    fillClass: string,
    animated?: boolean,
    animationDelay?: number
}) => {
    const [isAnimated, setIsAnimated] = useState(false);
    const hasAnimatedRef = useRef(false); // Флаг: анимация уже запускалась
    
    useEffect(() => {
        // Запускаем анимацию только один раз при первом монтировании
        if (hasAnimatedRef.current) return;
        
        if (!animated) {
            setIsAnimated(true);
            hasAnimatedRef.current = true;
            return;
        }
        
        const timer = setTimeout(() => {
            setIsAnimated(true);
            hasAnimatedRef.current = true;
        }, animationDelay);
        
        return () => clearTimeout(timer);
    }, [animated, animationDelay]);

    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = 0; // Always start from 0 for proportion
    const range = max - min || 1;
    
    // Используем viewBox с соотношением 4:1 для равномерной толщины линии
    const viewWidth = 200;
    const viewHeight = 50;
    const padding = 3;
    const chartWidth = viewWidth - padding * 2;
    const chartHeight = viewHeight - padding * 2;
    
    // Sample down if too many points to avoid SVG complexity
    const displayData = data.length > 50 ? data.filter((_, i) => i % Math.ceil(data.length / 50) === 0) : data;

    // Вычисляем точки для линии
    const pointsArray = displayData.map((val, i) => {
        const x = padding + (i / (displayData.length - 1)) * chartWidth;
        const y = padding + (1 - (val - min) / range) * chartHeight;
        return { x, y };
    });

    // Создаём path для линии
    const linePath = pointsArray.map((p, i) => 
        i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`
    ).join(' ');
    
    // Путь для заливки
    const firstPoint = pointsArray[0];
    const lastPoint = pointsArray[pointsArray.length - 1];
    const fillPath = `M${firstPoint.x},${viewHeight} L${pointsArray.map(p => `${p.x},${p.y}`).join(' L')} L${lastPoint.x},${viewHeight} Z`;

    return (
        <div className="w-full h-full relative overflow-hidden">
            <svg 
                viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
                className="w-full h-full" 
                preserveAspectRatio="none"
                style={{ overflow: 'visible' }}
            >
                {/* Заливка под графиком */}
                <path 
                    d={fillPath} 
                    className={`${fillClass} transition-opacity duration-700`}
                    style={{ opacity: isAnimated ? 0.2 : 0 }}
                    fill="currentColor" 
                />
                {/* Линия графика - используем vectorEffect для равномерной толщины */}
                <path 
                    d={linePath}
                    fill="none" 
                    vectorEffect="non-scaling-stroke"
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={colorClass} 
                    stroke="currentColor"
                    style={{
                        opacity: isAnimated ? 1 : 0,
                        transition: 'opacity 0.8s ease-out'
                    }}
                />
            </svg>
        </div>
    );
};
