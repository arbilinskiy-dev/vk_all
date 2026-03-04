"""
Тест 7: Массовая отправка email с вложениями через Яндекс SMTP.

Полностью изолированный сервис песочницы.
Отправляет письма контрагентам — каждому свой файл на несколько адресов.
Поддерживает:
- Одиночная отправка (тест подключения)
- Массовая отправка из CSV
- Вложения (до 25 МБ)
- Задержка между письмами (антиспам)
"""

import smtplib
import imaplib
import time
import csv
import io
import logging
import base64
import mimetypes
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.application import MIMEApplication
from email import encoders
from email.header import Header
from email.utils import formatdate, make_msgid
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Конфигурация SMTP ─────────────────────────────────────────

SMTP_CONFIG = {
    "server": "smtp.yandex.ru",
    "port_ssl": 465,
    "port_starttls": 587,
    "max_recipients_per_email": 300,  # Лимит Яндекса по SMTP
    "max_attachment_size_mb": 25,     # Свыше — автоматически на Яндекс Диск
}


# ─── Тест подключения ──────────────────────────────────────────

def test_smtp_connection(
    login: str,
    app_password: str,
    use_ssl: bool = True,
) -> dict:
    """
    Проверяет подключение к SMTP-серверу Яндекса.
    Возвращает результат тестирования.
    """
    start = time.time()
    port = SMTP_CONFIG["port_ssl"] if use_ssl else SMTP_CONFIG["port_starttls"]

    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(SMTP_CONFIG["server"], port, timeout=15)
        else:
            server = smtplib.SMTP(SMTP_CONFIG["server"], port, timeout=15)
            server.starttls()

        server.login(login, app_password)
        server.quit()

        elapsed = int((time.time() - start) * 1000)
        logger.info(f"[Test7] SMTP подключение ОК ({elapsed}ms)")

        return {
            "success": True,
            "server": SMTP_CONFIG["server"],
            "port": port,
            "ssl": use_ssl,
            "elapsed_ms": elapsed,
            "message": f"Подключение к {SMTP_CONFIG['server']}:{port} успешно. Авторизация пройдена.",
        }

    except smtplib.SMTPAuthenticationError as e:
        elapsed = int((time.time() - start) * 1000)
        logger.error(f"[Test7] Ошибка авторизации SMTP: {e}")
        return {
            "success": False,
            "server": SMTP_CONFIG["server"],
            "port": port,
            "ssl": use_ssl,
            "elapsed_ms": elapsed,
            "error": f"Ошибка авторизации: {e.smtp_error.decode('utf-8', errors='replace') if isinstance(e.smtp_error, bytes) else str(e.smtp_error)}",
            "hint": "Проверьте: 1) используете пароль приложения (не основной), "
                    "2) включён IMAP в настройках ящика, "
                    "3) логин без @yandex.ru если ящик на yandex.ru",
        }

    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        logger.error(f"[Test7] Ошибка подключения SMTP: {e}")
        return {
            "success": False,
            "server": SMTP_CONFIG["server"],
            "port": port,
            "ssl": use_ssl,
            "elapsed_ms": elapsed,
            "error": str(e),
        }


# ─── Отправка одного письма ────────────────────────────────────

def send_single_email(
    login: str,
    app_password: str,
    to_emails: list[str],
    subject: str,
    body_html: str,
    attachment_data: Optional[bytes] = None,
    attachment_filename: Optional[str] = None,
    use_ssl: bool = True,
) -> dict:
    """
    Отправляет одно письмо на список адресов с опциональным вложением.
    attachment_data — байты файла (уже прочитанные).
    """
    start = time.time()
    port = SMTP_CONFIG["port_ssl"] if use_ssl else SMTP_CONFIG["port_starttls"]

    # Валидация
    if len(to_emails) > SMTP_CONFIG["max_recipients_per_email"]:
        return {
            "success": False,
            "elapsed_ms": 0,
            "error": f"Слишком много получателей: {len(to_emails)} (макс {SMTP_CONFIG['max_recipients_per_email']})",
        }

    if attachment_data and len(attachment_data) > SMTP_CONFIG["max_attachment_size_mb"] * 1024 * 1024:
        size_mb = len(attachment_data) / (1024 * 1024)
        return {
            "success": False,
            "elapsed_ms": 0,
            "error": f"Файл слишком большой: {size_mb:.1f} МБ (макс {SMTP_CONFIG['max_attachment_size_mb']} МБ)",
        }

    try:
        # Формируем письмо
        msg = MIMEMultipart()
        msg["From"] = login
        msg["To"] = ", ".join(to_emails)
        msg["Subject"] = subject
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        # Служебные заголовки (важно для корректной доставки)
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="yandex.ru")

        # Вложение
        if attachment_data and attachment_filename:
            # Определяем MIME-тип по расширению
            mime_type, _ = mimetypes.guess_type(attachment_filename)
            if mime_type is None:
                mime_type = "application/octet-stream"

            maintype, subtype = mime_type.split("/", 1)

            if maintype == "application":
                part = MIMEApplication(attachment_data, _subtype=subtype)
            else:
                part = MIMEBase(maintype, subtype)
                part.set_payload(attachment_data)
                encoders.encode_base64(part)

            # Кодируем имя файла (поддержка кириллицы через RFC 2231)
            part.add_header(
                "Content-Disposition",
                "attachment",
                filename=("utf-8", "", attachment_filename),
            )
            msg.attach(part)

            logger.info(f"[Test7] Вложение: {attachment_filename} ({mime_type}, {len(attachment_data)} байт)")

        # Отправка
        if use_ssl:
            server = smtplib.SMTP_SSL(SMTP_CONFIG["server"], port, timeout=30)
        else:
            server = smtplib.SMTP(SMTP_CONFIG["server"], port, timeout=30)
            server.starttls()

        server.login(login, app_password)
        msg_string = msg.as_string()
        server.sendmail(login, to_emails, msg_string)
        server.quit()

        # Сохраняем копию в «Отправленные» через IMAP
        saved_to_sent = False
        try:
            imap = imaplib.IMAP4_SSL("imap.yandex.ru", 993)
            imap.login(login, app_password)

            # Находим папку с атрибутом \Sent через LIST
            sent_folder = None
            status, folders = imap.list()
            if status == "OK" and folders:
                for f in folders:
                    decoded = f.decode("utf-8", errors="replace")
                    if "\\Sent" in decoded:
                        # Формат: (\flags) "delimiter" "folder_name"
                        parts = decoded.split('"')
                        if len(parts) >= 4:
                            sent_folder = parts[-2]  # Последний элемент в кавычках
                        break

            if not sent_folder:
                # Фоллбэк — стандартное имя Яндекса (IMAP UTF-7 для «Отправленные»)
                sent_folder = "&BB4EQgQ,BEAEMAQyBDsENQQ9BD0ESwQ1-"
                logger.info(f"[Test7] Папка \\Sent не найдена в LIST, используем фоллбэк: {sent_folder}")

            logger.info(f"[Test7] IMAP: сохраняю в папку '{sent_folder}'")
            result = imap.append(sent_folder, "\\Seen", None, msg_string.encode("utf-8"))
            logger.info(f"[Test7] IMAP APPEND результат: {result}")
            saved_to_sent = result[0] == "OK"

            imap.logout()
        except Exception as imap_err:
            logger.warning(f"[Test7] Не удалось сохранить в Отправленные: {type(imap_err).__name__}: {imap_err}")

        elapsed = int((time.time() - start) * 1000)
        logger.info(f"[Test7] Письмо отправлено → {to_emails} ({elapsed}ms)")

        return {
            "success": True,
            "recipients": to_emails,
            "recipients_count": len(to_emails),
            "subject": subject,
            "has_attachment": bool(attachment_data),
            "attachment_name": attachment_filename,
            "saved_to_sent": saved_to_sent,
            "elapsed_ms": elapsed,
        }

    except smtplib.SMTPAuthenticationError as e:
        elapsed = int((time.time() - start) * 1000)
        error_msg = e.smtp_error.decode("utf-8", errors="replace") if isinstance(e.smtp_error, bytes) else str(e.smtp_error)
        return {
            "success": False,
            "recipients": to_emails,
            "elapsed_ms": elapsed,
            "error": f"Ошибка авторизации: {error_msg}",
        }

    except smtplib.SMTPRecipientsRefused as e:
        elapsed = int((time.time() - start) * 1000)
        refused = {addr: str(err) for addr, err in e.recipients.items()}
        return {
            "success": False,
            "recipients": to_emails,
            "elapsed_ms": elapsed,
            "error": f"Адресаты отклонены: {refused}",
        }

    except Exception as e:
        elapsed = int((time.time() - start) * 1000)
        logger.error(f"[Test7] Ошибка отправки: {e}")
        return {
            "success": False,
            "recipients": to_emails,
            "elapsed_ms": elapsed,
            "error": str(e),
        }


# ─── Массовая отправка из CSV ──────────────────────────────────

def parse_csv_contractors(csv_content: str) -> dict:
    """
    Парсит CSV с контрагентами.
    Формат: contractor;emails;subject
    Возвращает список контрагентов и ошибки парсинга.
    """
    contractors = []
    errors = []

    try:
        reader = csv.DictReader(
            io.StringIO(csv_content),
            delimiter=";",
        )

        required_fields = {"contractor", "emails", "subject"}
        if reader.fieldnames:
            missing = required_fields - set(reader.fieldnames)
            if missing:
                return {
                    "success": False,
                    "contractors": [],
                    "errors": [f"Отсутствуют обязательные колонки: {', '.join(missing)}. "
                              f"Найдены: {', '.join(reader.fieldnames)}"],
                }

        for i, row in enumerate(reader, 1):
            name = row.get("contractor", "").strip()
            emails_raw = row.get("emails", "").strip()
            subject = row.get("subject", "").strip()

            if not name:
                errors.append(f"Строка {i}: пустое имя контрагента")
                continue
            if not emails_raw:
                errors.append(f"Строка {i} ({name}): нет email-адресов")
                continue
            if not subject:
                errors.append(f"Строка {i} ({name}): нет темы письма")
                continue

            emails = [e.strip() for e in emails_raw.split(",") if e.strip()]
            if not emails:
                errors.append(f"Строка {i} ({name}): некорректные email")
                continue

            contractors.append({
                "index": i,
                "contractor": name,
                "emails": emails,
                "emails_count": len(emails),
                "subject": subject,
            })

    except Exception as e:
        return {
            "success": False,
            "contractors": [],
            "errors": [f"Ошибка парсинга CSV: {str(e)}"],
        }

    return {
        "success": True,
        "contractors": contractors,
        "total_contractors": len(contractors),
        "total_recipients": sum(c["emails_count"] for c in contractors),
        "errors": errors,
    }


def send_mass_email(
    login: str,
    app_password: str,
    contractors: list[dict],
    body_template: str,
    attachment_data: Optional[bytes] = None,
    attachment_filename: Optional[str] = None,
    delay_seconds: int = 7,
    use_ssl: bool = True,
) -> dict:
    """
    Массовая отправка: одно письмо на все email контрагента.
    contractors — список из parse_csv_contractors()["contractors"].
    body_template — HTML шаблон с плейсхолдерами {contractor}, {subject}.
    Возвращает итоги по каждому контрагенту.
    """
    results = []
    total_success = 0
    total_failed = 0
    total_start = time.time()

    for i, contractor in enumerate(contractors):
        name = contractor["contractor"]
        emails = contractor["emails"]
        subject = contractor["subject"]

        # Подставляем плейсхолдеры в шаблон
        body_html = body_template.replace("{contractor}", name).replace("{subject}", subject)

        result = send_single_email(
            login=login,
            app_password=app_password,
            to_emails=emails,
            subject=subject,
            body_html=body_html,
            attachment_data=attachment_data,
            attachment_filename=attachment_filename,
            use_ssl=use_ssl,
        )

        result["contractor"] = name
        result["index"] = i + 1
        results.append(result)

        if result["success"]:
            total_success += 1
        else:
            total_failed += 1

        # Пауза между письмами (кроме последнего)
        if i < len(contractors) - 1 and delay_seconds > 0:
            time.sleep(delay_seconds)

    total_elapsed = int((time.time() - total_start) * 1000)

    return {
        "results": results,
        "summary": {
            "total": len(contractors),
            "success": total_success,
            "failed": total_failed,
            "total_recipients": sum(len(c["emails"]) for c in contractors),
            "total_elapsed_ms": total_elapsed,
            "delay_between_emails": delay_seconds,
        },
    }


# ─── Информация о лимитах ──────────────────────────────────────

def get_smtp_info() -> dict:
    """Возвращает информацию о настройках SMTP и лимитах Яндекса."""
    return {
        "smtp": SMTP_CONFIG,
        "limits": {
            "max_recipients_per_email_smtp": 300,
            "max_recipients_per_email_web": 1000,
            "max_attachment_size_direct_mb": 25,
            "max_attachment_size_disk_mb": 1024,
            "daily_limit": "Не публикуется Яндексом. ~500 получателей/день безопасно.",
            "anti_spam_note": "Спамооборона может заблокировать при массовых однотипных письмах.",
        },
        "setup_steps": [
            "1. Включить IMAP в настройках ящика: https://mail.yandex.ru/#setup/client",
            "2. Создать пароль приложения: https://id.yandex.ru/security/app-passwords",
            "3. Использовать пароль приложения (НЕ основной пароль аккаунта)",
        ],
    }
