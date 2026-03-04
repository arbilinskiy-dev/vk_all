/**
 * Тест 7: Массовая отправка email с вложениями через Яндекс SMTP.
 *
 * Три режима:
 * 1. Проверка подключения к SMTP
 * 2. Одиночная отправка (тест)
 * 3. Массовая отправка из CSV
 */

import React, { useEffect, useState } from 'react';
import {
    useEmailSenderTest,
    SendResult,
    Contractor,
} from './useEmailSenderTest';

// ─── Вспомогательные компоненты ─────────────────────────

/** Индикатор статуса */
const StatusBadge: React.FC<{ success: boolean; label?: string }> = ({ success, label }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
        {success ? '✓' : '✗'} {label || (success ? 'Успешно' : 'Ошибка')}
    </span>
);

/** Карточка результата отправки */
const SendResultCard: React.FC<{ result: SendResult }> = ({ result }) => (
    <div className={`border rounded-lg p-3 ${
        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`}>
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
                {result.contractor && (
                    <span className="font-medium text-sm text-gray-900">
                        {result.index}. {result.contractor}
                    </span>
                )}
                <StatusBadge success={result.success} />
            </div>
            <span className="text-xs text-gray-400">{result.elapsed_ms}ms</span>
        </div>
        {result.success ? (
            <div className="text-xs text-gray-600 space-y-0.5">
                <p>Адресаты: {result.recipients?.join(', ')}</p>
                {result.has_attachment && <p>Вложение: {result.attachment_name}</p>}
            </div>
        ) : (
            <p className="text-xs text-red-600">{result.error}</p>
        )}
    </div>
);

/** Таблица контрагентов (превью CSV) */
const ContractorsPreview: React.FC<{ contractors: Contractor[] }> = ({ contractors }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-gray-50">
                <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">#</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Контрагент</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Email-ы</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Тема</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {contractors.map((c) => (
                    <tr key={c.index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-400">{c.index}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{c.contractor}</td>
                        <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                                {c.emails.map((e) => (
                                    <span key={e} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                        {e}
                                    </span>
                                ))}
                            </div>
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{c.subject}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ─── Главный компонент ──────────────────────────────────

type Tab = 'connection' | 'single' | 'mass';

export const EmailSenderTest: React.FC = () => {
    const {
        login, setLogin,
        appPassword, setAppPassword,
        useSsl, setUseSsl,
        connectionResult, isTestingConnection, testConnection,
        toEmails, setToEmails,
        subject, setSubject,
        bodyHtml, setBodyHtml,
        attachment, setAttachment,
        sendResult, isSending, sendEmail,
        csvContent, setCsvContent,
        bodyTemplate, setBodyTemplate,
        massAttachment, setMassAttachment,
        delaySeconds, setDelaySeconds,
        parsedCsv, parseCsv,
        massSendResult, isMassSending, massSend,
        smtpInfo, loadSmtpInfo,
        error, setError,
    } = useEmailSenderTest();

    const [activeTab, setActiveTab] = useState<Tab>('connection');

    // Загружаем инфо при монтировании
    useEffect(() => {
        if (!smtpInfo) loadSmtpInfo();
    }, [smtpInfo, loadSmtpInfo]);

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'connection', label: 'Подключение', icon: '🔌' },
        { id: 'single', label: 'Одиночная отправка', icon: '✉️' },
        { id: 'mass', label: 'Массовая отправка', icon: '📨' },
    ];

    const hasCredentials = login.trim() && appPassword.trim();

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Заголовок */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        📧 Тест 7: Email-рассылка (Яндекс SMTP)
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Отправка писем с вложениями через SMTP Яндекс Почты. Тест подключения → одиночное письмо → массовая рассылка.
                    </p>
                </div>

                {/* Блок настроек SMTP (всегда виден) */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-700">🔑 Настройки SMTP</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Логин (email) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={login}
                                onChange={e => setLogin(e.target.value)}
                                placeholder="your_login@yandex.ru"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Пароль приложения <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={appPassword}
                                onChange={e => setAppPassword(e.target.value)}
                                placeholder="Пароль из id.yandex.ru/security/app-passwords"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useSsl}
                                onChange={e => setUseSsl(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            SSL (порт 465)
                        </label>
                        <span className="text-xs text-gray-400">
                            {useSsl ? 'smtp.yandex.ru:465 (SSL)' : 'smtp.yandex.ru:587 (STARTTLS)'}
                        </span>
                    </div>

                    {/* Подсказка по настройке */}
                    {smtpInfo && (
                        <details className="text-xs text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">📋 Как настроить</summary>
                            <ol className="mt-2 space-y-1 list-decimal list-inside">
                                {smtpInfo.setup_steps.map((step, i) => (
                                    <li key={i}>{step.replace(/^\d+\.\s*/, '')}</li>
                                ))}
                            </ol>
                        </details>
                    )}
                </div>

                {/* Вкладки */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(null); }}
                            className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 font-medium shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Ошибка */}
                {error && (
                    <div className="bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
                        <span><span className="font-bold">Ошибка:</span> {error}</span>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                )}

                {/* ═══ Вкладка 1: Подключение ═══ */}
                {activeTab === 'connection' && (
                    <div className="space-y-4">
                        <button
                            onClick={testConnection}
                            disabled={isTestingConnection || !hasCredentials}
                            className={`w-full py-3 rounded-lg text-white font-bold text-sm transition-all ${
                                isTestingConnection || !hasCredentials
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isTestingConnection ? '🔄 Проверяю подключение...' : '🔌 Проверить подключение к SMTP'}
                        </button>

                        {connectionResult && (
                            <div className={`border-2 rounded-xl p-5 ${
                                connectionResult.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                            }`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">{connectionResult.success ? '✅' : '❌'}</span>
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            {connectionResult.success ? 'Подключение успешно!' : 'Ошибка подключения'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {connectionResult.server}:{connectionResult.port} • {connectionResult.elapsed_ms}ms
                                        </p>
                                    </div>
                                </div>
                                {connectionResult.message && (
                                    <p className="text-sm text-green-800">{connectionResult.message}</p>
                                )}
                                {connectionResult.error && (
                                    <p className="text-sm text-red-800">{connectionResult.error}</p>
                                )}
                                {connectionResult.hint && (
                                    <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 rounded p-2">
                                        💡 {connectionResult.hint}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Лимиты */}
                        {smtpInfo && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-3">📊 Лимиты Яндекс SMTP</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xl font-bold text-gray-900">300</p>
                                        <p className="text-xs text-gray-500">Получателей на письмо (SMTP)</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xl font-bold text-gray-900">25 МБ</p>
                                        <p className="text-xs text-gray-500">Макс. размер вложения</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xl font-bold text-gray-900">~500</p>
                                        <p className="text-xs text-gray-500">Получателей в день (безопасно)</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-3">
                                        <p className="text-xl font-bold text-yellow-700">⚠️</p>
                                        <p className="text-xs text-yellow-600">Однотипные письма — блокировка</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ Вкладка 2: Одиночная отправка ═══ */}
                {activeTab === 'single' && (
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                            <h3 className="text-sm font-bold text-gray-700">Параметры письма</h3>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Кому (через запятую) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={toEmails}
                                    onChange={e => setToEmails(e.target.value)}
                                    placeholder="ivan@company.ru, buh@company.ru"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Тема <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Акт сверки за февраль 2026"
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Тело письма (HTML)</label>
                                <textarea
                                    value={bodyHtml}
                                    onChange={e => setBodyHtml(e.target.value)}
                                    rows={5}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Вложение (опционально)</label>
                                <input
                                    type="file"
                                    onChange={e => setAttachment(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {attachment && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        📎 {attachment.name} ({(attachment.size / 1024).toFixed(1)} КБ)
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={sendEmail}
                                disabled={isSending || !hasCredentials || !toEmails.trim() || !subject.trim()}
                                className={`w-full py-3 rounded-lg text-white font-bold text-sm transition-all ${
                                    isSending || !hasCredentials || !toEmails.trim() || !subject.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                                }`}
                            >
                                {isSending ? '📤 Отправка...' : '✉️ Отправить письмо'}
                            </button>
                        </div>

                        {sendResult && <SendResultCard result={sendResult} />}
                    </div>
                )}

                {/* ═══ Вкладка 3: Массовая отправка ═══ */}
                {activeTab === 'mass' && (
                    <div className="space-y-4">
                        {/* CSV ввод */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                            <h3 className="text-sm font-bold text-gray-700">📋 CSV с контрагентами</h3>
                            <p className="text-xs text-gray-500">
                                Формат: <code className="bg-gray-100 px-1 py-0.5 rounded">contractor;emails;subject</code>
                                <br />Email-ы через запятую. Каждая строка — один контрагент.
                            </p>
                            <textarea
                                value={csvContent}
                                onChange={e => setCsvContent(e.target.value)}
                                rows={8}
                                placeholder={`contractor;emails;subject\nООО Ромашка;ivan@romashka.ru,buh@romashka.ru;Акт сверки за февраль 2026\nООО Василёк;dir@vasilek.ru,office@vasilek.ru;Счёт-фактура №123`}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-none"
                            />
                            <button
                                onClick={parseCsv}
                                disabled={!csvContent.trim()}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    !csvContent.trim()
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                👁 Предпросмотр CSV
                            </button>
                        </div>

                        {/* Предпросмотр CSV */}
                        {parsedCsv && (
                            <div className="space-y-2">
                                {parsedCsv.success && parsedCsv.contractors.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-3 text-sm">
                                            <span className="font-medium text-gray-700">
                                                {parsedCsv.total_contractors} контрагентов • {parsedCsv.total_recipients} получателей
                                            </span>
                                            <StatusBadge success={true} label="CSV корректен" />
                                        </div>
                                        <ContractorsPreview contractors={parsedCsv.contractors} />
                                    </>
                                )}
                                {parsedCsv.errors.length > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                        <p className="text-xs font-medium text-yellow-700 mb-1">Предупреждения:</p>
                                        {parsedCsv.errors.map((e, i) => (
                                            <p key={i} className="text-xs text-yellow-600">• {e}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Шаблон и настройки */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                            <h3 className="text-sm font-bold text-gray-700">📝 Шаблон письма</h3>
                            <p className="text-xs text-gray-500">
                                Плейсхолдеры: <code className="bg-gray-100 px-1 py-0.5 rounded">{'{contractor}'}</code> — имя контрагента,{' '}
                                <code className="bg-gray-100 px-1 py-0.5 rounded">{'{subject}'}</code> — тема из CSV.
                            </p>
                            <textarea
                                value={bodyTemplate}
                                onChange={e => setBodyTemplate(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono resize-none"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Вложение (один файл для всех)</label>
                                    <input
                                        type="file"
                                        onChange={e => setMassAttachment(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {massAttachment && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            📎 {massAttachment.name} ({(massAttachment.size / 1024).toFixed(1)} КБ)
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Задержка между письмами (сек)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={60}
                                        value={delaySeconds}
                                        onChange={e => setDelaySeconds(Number(e.target.value))}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Рекомендация: 5-10 сек для защиты от антиспама
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={massSend}
                                disabled={isMassSending || !hasCredentials || !csvContent.trim()}
                                className={`w-full py-3 rounded-lg text-white font-bold text-sm transition-all ${
                                    isMassSending || !hasCredentials || !csvContent.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg'
                                }`}
                            >
                                {isMassSending
                                    ? '📨 Отправка писем... (не закрывайте страницу)'
                                    : `📨 Запустить массовую отправку`
                                }
                            </button>
                        </div>

                        {/* Результаты массовой отправки */}
                        {massSendResult && (
                            <div className="space-y-4">
                                {/* Сводка */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">📊 Итоги отправки</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {massSendResult.summary.total}
                                            </p>
                                            <p className="text-xs text-gray-500">Писем</p>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-green-700">
                                                {massSendResult.summary.success}
                                            </p>
                                            <p className="text-xs text-green-600">Отправлено ✓</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-red-700">
                                                {massSendResult.summary.failed}
                                            </p>
                                            <p className="text-xs text-red-600">Ошибок ✗</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-blue-700">
                                                {(massSendResult.summary.total_elapsed_ms / 1000).toFixed(1)}с
                                            </p>
                                            <p className="text-xs text-blue-600">Общее время</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Детали по каждому контрагенту */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-700">Детали по контрагентам</h3>
                                    {massSendResult.results.map((r, i) => (
                                        <SendResultCard key={i} result={r} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
