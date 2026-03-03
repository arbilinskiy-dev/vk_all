/**
 * Компонент: матрица результатов.
 * Таблица совместимости: Метод VK API × Тип токена.
 */

import React from 'react';
import { TOKEN_TYPE_LABELS } from './constants';

// ─── Компонент: матрица результатов ─────────────────────

export const ResultMatrix: React.FC<{ matrix: Record<string, Record<string, any>> }> = ({ matrix }) => {
    const methods = Object.keys(matrix);
    const tokenTypes = ['user', 'user_non_admin', 'community', 'service'];

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Метод</th>
                        {tokenTypes.map(t => {
                            const info = TOKEN_TYPE_LABELS[t];
                            return (
                                <th key={t} className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">
                                    {info.emoji} {info.label}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {methods.map(method => (
                        <tr key={method} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-sm font-medium text-gray-900">{method}</td>
                            {tokenTypes.map(t => {
                                const cell = matrix[method]?.[t];
                                if (!cell) {
                                    return <td key={t} className="px-4 py-3 text-center text-gray-400">—</td>;
                                }
                                return (
                                    <td key={t} className="px-4 py-3 text-center">
                                        {cell.skipped ? (
                                            <span className="text-gray-400 text-xs">⏭ Пропущен</span>
                                        ) : cell.success ? (
                                            <div>
                                                <span className="text-green-600 font-bold">✅ OK</span>
                                                <p className="text-xs text-gray-400 mt-0.5">{cell.elapsed_ms}ms</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <span className="text-red-600 font-bold">❌ Ошибка</span>
                                                {cell.error_code && (
                                                    <p className="text-xs text-red-500 mt-0.5">
                                                        Код {cell.error_code}
                                                    </p>
                                                )}
                                                {cell.error_msg && (
                                                    <p className="text-xs text-red-400 mt-0.5 max-w-[180px] truncate" title={cell.error_msg}>
                                                        {cell.error_msg}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
