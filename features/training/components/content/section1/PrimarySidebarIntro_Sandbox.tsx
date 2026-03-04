import React from 'react';

// =====================================================================
// Компонент-обёртка «Песочница» для интерактивных демонстраций
// =====================================================================

/** Пропсы песочницы */
interface SandboxProps {
    title: string;
    description: string;
    children: React.ReactNode;
    instructions?: string[];
    rightPanel?: React.ReactNode;
}

/** Блок интерактивной демонстрации с инструкциями справа */
export const Sandbox: React.FC<SandboxProps> = ({ title, description, children, instructions, rightPanel }) => (
    <div className="not-prose relative p-5 border-2 border-dashed border-indigo-300 rounded-xl bg-indigo-50/50 mt-8">
        <h4 className="text-lg font-bold text-indigo-800 mb-1">{title}</h4>
        <p className="text-sm text-indigo-700 mb-4">{description}</p>
        
        <div className="flex gap-6">
            {/* Левая часть: интерактивный элемент */}
            <div className="flex-shrink-0">
                {children}
            </div>
            
            {/* Правая часть: инструкции или кастомный контент */}
            <div className="flex-1 min-w-0">
                {rightPanel ? rightPanel : (
                    instructions && instructions.length > 0 && (
                        <div className="bg-white rounded-lg border border-indigo-200 p-4 h-full">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Попробуйте:</p>
                            <ul className="space-y-2 text-sm text-gray-700">
                                {instructions.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                        <span dangerouslySetInnerHTML={{ __html: item }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                )}
            </div>
        </div>
    </div>
);
