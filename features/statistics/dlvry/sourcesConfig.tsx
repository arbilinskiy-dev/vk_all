/**
 * Конфигурация источников заказов DLVRY.
 * SVG-иконки + Tailwind-классы для каждого источника.
 */

import React from 'react';
import type { SourceDef } from './sourcesTypes';

export const SOURCES: SourceDef[] = [
    {
        key: 'vkapp',
        label: 'VK Mini App',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.587-1.496c.598-.188 1.368 1.259 2.183 1.815.616.42 1.084.328 1.084.328l2.175-.03s1.138-.07.598-.964c-.044-.073-.314-.661-1.618-1.869-1.366-1.265-1.183-1.06.462-3.248.998-1.33 1.398-2.143 1.273-2.49-.119-.332-.852-.244-.852-.244l-2.449.015s-.182-.025-.316.056c-.131.079-.215.263-.215.263s-.386 1.029-.9 1.904c-1.086 1.846-1.52 1.943-1.697 1.828-.413-.268-.31-1.075-.31-1.649 0-1.793.272-2.54-.529-2.735-.266-.065-.462-.107-1.141-.114-.872-.01-1.61.003-2.028.208-.278.136-.492.44-.362.457.161.022.527.099.72.363.25.341.24 1.11.24 1.11s.143 2.11-.334 2.372c-.327.18-.776-.187-1.74-1.868-.494-.86-.866-1.81-.866-1.81s-.072-.176-.2-.27c-.155-.114-.373-.15-.373-.15l-2.328.016s-.35.01-.478.162c-.114.135-.009.414-.009.414s1.815 4.244 3.87 6.383c1.883 1.962 4.023 1.834 4.023 1.834z"/>
            </svg>
        ),
        color: '#4C75A3',
        numberClass: 'text-blue-700',
        iconClass: 'text-blue-600',
        iconBgClass: 'bg-blue-50',
        hoverBorderClass: 'hover:border-blue-300',
        barClass: 'bg-blue-500',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        dotClass: 'bg-blue-500',
    },
    {
        key: 'site',
        label: 'Сайт',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
        color: '#6366F1',
        numberClass: 'text-indigo-700',
        iconClass: 'text-indigo-600',
        iconBgClass: 'bg-indigo-50',
        hoverBorderClass: 'hover:border-indigo-300',
        barClass: 'bg-indigo-500',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-700',
        dotClass: 'bg-indigo-500',
    },
    {
        key: 'ios',
        label: 'iOS',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
        ),
        color: '#374151',
        numberClass: 'text-gray-900',
        iconClass: 'text-gray-700',
        iconBgClass: 'bg-gray-100',
        hoverBorderClass: 'hover:border-gray-400',
        barClass: 'bg-gray-600',
        badgeBg: 'bg-gray-200',
        badgeText: 'text-gray-700',
        dotClass: 'bg-gray-600',
    },
    {
        key: 'android',
        label: 'Android',
        icon: (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.44-.65-3.06-1.01-4.76-1.01-1.7 0-3.32.36-4.76 1.01L5.08 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86l1.84 3.18C2.86 11.3.86 14.43.86 18h22.28c0-3.57-2-6.7-4.94-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
            </svg>
        ),
        color: '#16A34A',
        numberClass: 'text-green-700',
        iconClass: 'text-green-600',
        iconBgClass: 'bg-green-50',
        hoverBorderClass: 'hover:border-green-300',
        barClass: 'bg-green-500',
        badgeBg: 'bg-green-100',
        badgeText: 'text-green-700',
        dotClass: 'bg-green-500',
    },
];
