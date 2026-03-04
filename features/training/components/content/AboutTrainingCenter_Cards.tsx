import React from 'react';

// =====================================================================
// Карточки-компоненты для страницы «О Центре обучения»
// =====================================================================

// ---------------------------------------------------------------------
// Карточка «Что вы узнаете» — блок с иконкой, описанием и списком
// ---------------------------------------------------------------------
export const LearnCard: React.FC<{ icon: string; title: string; description: string; items: string[] }> = ({ icon, title, description, items }) => (
    <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{icon}</span>
            <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        </div>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <ul className="text-sm text-gray-600 space-y-1">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">✓</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    </div>
);

// ---------------------------------------------------------------------
// Карточка условного обозначения (легенда)
// ---------------------------------------------------------------------
export const LegendItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-3 p-3 bg-white border rounded-lg">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <h5 className="text-sm font-medium text-gray-800">{title}</h5>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    </div>
);
