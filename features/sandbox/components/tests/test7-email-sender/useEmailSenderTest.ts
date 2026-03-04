/**
 * Хук логики для Теста 7: Массовая отправка email через Яндекс SMTP.
 *
 * Полностью изолирован от основной логики приложения.
 * Тестирует отправку писем с вложениями через SMTP Яндекса.
 */

import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../../../../../shared/config';

// ─── Типы ───────────────────────────────────────────────

/** Результат проверки подключения */
export interface ConnectionResult {
    success: boolean;
    server?: string;
    port?: number;
    ssl?: boolean;
    elapsed_ms: number;
    message?: string;
    error?: string;
    hint?: string;
}

/** Результат отправки одного письма */
export interface SendResult {
    success: boolean;
    recipients?: string[];
    recipients_count?: number;
    subject?: string;
    has_attachment?: boolean;
    attachment_name?: string;
    elapsed_ms: number;
    error?: string;
    contractor?: string;
    index?: number;
}

/** Контрагент из CSV */
export interface Contractor {
    index: number;
    contractor: string;
    emails: string[];
    emails_count: number;
    subject: string;
}

/** Результат парсинга CSV */
export interface ParseCsvResult {
    success: boolean;
    contractors: Contractor[];
    total_contractors?: number;
    total_recipients?: number;
    errors: string[];
}

/** Результат массовой отправки */
export interface MassSendResult {
    results: SendResult[];
    summary: {
        total: number;
        success: number;
        failed: number;
        total_recipients: number;
        total_elapsed_ms: number;
        delay_between_emails: number;
    };
}

/** Информация о SMTP */
export interface SmtpInfo {
    smtp: {
        server: string;
        port_ssl: number;
        port_starttls: number;
        max_recipients_per_email: number;
        max_attachment_size_mb: number;
    };
    limits: Record<string, string | number>;
    setup_steps: string[];
}

// ─── Хук ────────────────────────────────────────────────

export function useEmailSenderTest() {
    // Настройки SMTP
    const [login, setLogin] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [useSsl, setUseSsl] = useState(true);

    // Состояние подключения
    const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    // Одиночная отправка
    const [toEmails, setToEmails] = useState('');
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState(
        '<p>Добрый день!</p>\n<p>Направляем вам документ.</p>\n<p>Файл во вложении.</p>\n<br>\n<p>С уважением,<br>Ваша компания</p>'
    );
    const [attachment, setAttachment] = useState<File | null>(null);
    const [sendResult, setSendResult] = useState<SendResult | null>(null);
    const [isSending, setIsSending] = useState(false);

    // Массовая отправка
    const [csvContent, setCsvContent] = useState('');
    const [bodyTemplate, setBodyTemplate] = useState(
        '<p>Добрый день!</p>\n<p>Направляем вам: <b>{subject}</b></p>\n<p>Файл во вложении.</p>\n<br>\n<p>С уважением,<br>Ваша компания</p>'
    );
    const [massAttachment, setMassAttachment] = useState<File | null>(null);
    const [delaySeconds, setDelaySeconds] = useState(7);
    const [parsedCsv, setParsedCsv] = useState<ParseCsvResult | null>(null);
    const [massSendResult, setMassSendResult] = useState<MassSendResult | null>(null);
    const [isMassSending, setIsMassSending] = useState(false);

    // Информация
    const [smtpInfo, setSmtpInfo] = useState<SmtpInfo | null>(null);

    // Общая ошибка
    const [error, setError] = useState<string | null>(null);

    /** Загрузить информацию о SMTP */
    const loadSmtpInfo = useCallback(async () => {
        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test7/info`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setSmtpInfo(data);
        } catch (err: any) {
            setError(`Не удалось загрузить информацию: ${err.message}`);
        }
    }, []);

    /** Проверить подключение к SMTP */
    const testConnection = useCallback(async () => {
        if (!login.trim() || !appPassword.trim()) {
            setError('Введите логин и пароль приложения');
            return;
        }

        setIsTestingConnection(true);
        setConnectionResult(null);
        setError(null);

        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test7/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    login: login.trim(),
                    app_password: appPassword.trim(),
                    use_ssl: useSsl,
                }),
            });
            const data: ConnectionResult = await resp.json();
            setConnectionResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsTestingConnection(false);
        }
    }, [login, appPassword, useSsl]);

    /** Отправить одно письмо */
    const sendEmail = useCallback(async () => {
        if (!login.trim() || !appPassword.trim()) {
            setError('Введите логин и пароль приложения');
            return;
        }
        if (!toEmails.trim()) {
            setError('Введите адресатов');
            return;
        }
        if (!subject.trim()) {
            setError('Введите тему письма');
            return;
        }

        setIsSending(true);
        setSendResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('login', login.trim());
            formData.append('app_password', appPassword.trim());
            formData.append('to_emails', toEmails.trim());
            formData.append('subject', subject.trim());
            formData.append('body_html', bodyHtml);
            formData.append('use_ssl', String(useSsl));

            if (attachment) {
                formData.append('attachment', attachment);
            }

            const resp = await fetch(`${API_BASE_URL}/sandbox/test7/send`, {
                method: 'POST',
                body: formData,
            });
            const data: SendResult = await resp.json();
            setSendResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSending(false);
        }
    }, [login, appPassword, toEmails, subject, bodyHtml, attachment, useSsl]);

    /** Парсить CSV */
    const parseCsv = useCallback(async () => {
        if (!csvContent.trim()) {
            setError('Вставьте содержимое CSV');
            return;
        }

        setError(null);

        try {
            const resp = await fetch(`${API_BASE_URL}/sandbox/test7/parse-csv`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ csv_content: csvContent.trim() }),
            });
            const data: ParseCsvResult = await resp.json();
            setParsedCsv(data);
        } catch (err: any) {
            setError(err.message);
        }
    }, [csvContent]);

    /** Массовая отправка */
    const massSend = useCallback(async () => {
        if (!login.trim() || !appPassword.trim()) {
            setError('Введите логин и пароль приложения');
            return;
        }
        if (!csvContent.trim()) {
            setError('Вставьте CSV с контрагентами');
            return;
        }

        setIsMassSending(true);
        setMassSendResult(null);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('login', login.trim());
            formData.append('app_password', appPassword.trim());
            formData.append('csv_content', csvContent.trim());
            formData.append('body_template', bodyTemplate);
            formData.append('delay_seconds', String(delaySeconds));
            formData.append('use_ssl', String(useSsl));

            if (massAttachment) {
                formData.append('attachment', massAttachment);
            }

            const resp = await fetch(`${API_BASE_URL}/sandbox/test7/mass-send`, {
                method: 'POST',
                body: formData,
            });
            const data: MassSendResult = await resp.json();
            setMassSendResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsMassSending(false);
        }
    }, [login, appPassword, csvContent, bodyTemplate, massAttachment, delaySeconds, useSsl]);

    return {
        // Настройки SMTP
        login, setLogin,
        appPassword, setAppPassword,
        useSsl, setUseSsl,

        // Подключение
        connectionResult, isTestingConnection, testConnection,

        // Одиночная отправка
        toEmails, setToEmails,
        subject, setSubject,
        bodyHtml, setBodyHtml,
        attachment, setAttachment,
        sendResult, isSending, sendEmail,

        // Массовая отправка
        csvContent, setCsvContent,
        bodyTemplate, setBodyTemplate,
        massAttachment, setMassAttachment,
        delaySeconds, setDelaySeconds,
        parsedCsv, parseCsv,
        massSendResult, isMassSending, massSend,

        // Инфо
        smtpInfo, loadSmtpInfo,

        // Общее
        error, setError,
    };
}
