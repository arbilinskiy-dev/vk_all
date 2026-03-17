"""
DLVRY API Client — асинхронный клиент для получения статистики из DLVRY.

Платформа: https://dlvry.ru — SaaS для приёма и управления заказами (доставка еды).
API:        REST, авторизация по Bearer-токену.

Хаб-модуль: схемы данных вынесены в dlvry_schemas.py, парсинг — в dlvry_parser.py.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Optional

import aiohttp

# Реэкспорт для обратной совместимости (внешний контракт)
from services.dlvry.dlvry_schemas import (  # noqa: F401
    DlvryDailyItem,
    DlvryStats,
    DlvryComparison,
    DLVRY_API_BASE,
    DATE_FMT,
)
from services.dlvry.dlvry_parser import (
    build_filter,
    build_url,
    parse_statistics_response,
)

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Клиент
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class DlvryApiClient:
    """
    Асинхронный клиент для DLVRY API (получение статистики).

    Параметры:
        token:   Bearer-токен DLVRY (обязательный)
        timeout: HTTP-таймаут в секундах (по умолчанию 30)
    """

    def __init__(self, token: str, timeout: int = 30):
        if not token:
            raise ValueError("DLVRY token обязателен")
        self._token = token
        self._timeout = aiohttp.ClientTimeout(total=timeout)

    # ── Публичные методы ─────────────────────────────────────

    async def get_orders_stats(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
        *,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """
        Получить статистику заказов за произвольный период.

        Args:
            affiliate_id: ID филиала DLVRY (строка)
            date_from:    Начальная дата DD.MM.YYYY
            date_to:      Конечная дата  DD.MM.YYYY
            extra_filter: Дополнительные поля фильтра (UTM, теги и т.д.)

        Returns:
            DlvryStats или None при ошибке
        """
        return await self._fetch_statistics(affiliate_id, date_from, date_to, extra_filter)

    async def get_orders_by_period(
        self,
        affiliate_id: str,
        period_days: int = 7,
        *,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """Получить статистику заказов за последние N дней."""
        now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        dt_to = now - timedelta(days=1)
        dt_from = now - timedelta(days=period_days)
        return await self._fetch_statistics(
            affiliate_id,
            dt_from.strftime(DATE_FMT),
            dt_to.strftime(DATE_FMT),
            extra_filter,
        )

    async def get_orders_comparison(
        self,
        affiliate_id: str,
        period_days: int = 7,
        *,
        date_from: str | None = None,
        date_to: str | None = None,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryComparison]:
        """Получить текущий и предыдущий периоды для сравнения."""
        now = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        if date_from and date_to:
            dt_from = datetime.strptime(date_from, DATE_FMT)
            dt_to = datetime.strptime(date_to, DATE_FMT)
            delta = (dt_to - dt_from).days + 1
        else:
            dt_to = now - timedelta(days=1)
            dt_from = now - timedelta(days=period_days)
            delta = period_days
            date_from = dt_from.strftime(DATE_FMT)
            date_to = dt_to.strftime(DATE_FMT)

        prev_end = dt_from - timedelta(days=1)
        prev_start = prev_end - timedelta(days=delta - 1)

        current = await self._fetch_statistics(
            affiliate_id, date_from, date_to, extra_filter,
        )
        previous = await self._fetch_statistics(
            affiliate_id,
            prev_start.strftime(DATE_FMT),
            prev_end.strftime(DATE_FMT),
            extra_filter,
        )

        return DlvryComparison(
            current=current,
            previous=previous,
            period_days=delta,
            date_from=date_from,
            date_to=date_to,
        )

    # ── Внутренняя реализация ────────────────────────────────

    async def _fetch_statistics(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
        extra_filter: dict | None = None,
    ) -> Optional[DlvryStats]:
        """
        Запрос к DLVRY API.

        Endpoint:
            GET https://dlvry.ru/api/v1/affiliates/{affiliate_id}/statistics

        Headers:
            Authorization: Bearer <token>

        Query params:
            type      = "orders"
            date_from = DD.MM.YYYY
            date_to   = DD.MM.YYYY
            filter    = URL-encoded JSON (объект фильтра)
        """
        filter_obj = build_filter(affiliate_id, date_from, date_to, extra_filter)
        url = build_url(affiliate_id, date_from, date_to, filter_obj)

        try:
            async with aiohttp.ClientSession(timeout=self._timeout) as session:
                async with session.get(
                    url,
                    headers={"Authorization": f"Bearer {self._token}"},
                ) as resp:
                    raw_text = await resp.text()
                    logger.debug(
                        "DLVRY API raw response: affiliate=%s, status_code=%s, body=%s",
                        affiliate_id, resp.status, raw_text,
                    )

                    import json as _json
                    try:
                        result = _json.loads(raw_text)
                    except Exception:
                        logger.error("DLVRY API: не удалось распарсить JSON, raw=%s", raw_text)
                        return None

                    if result and result.get('status') == 'success':
                        return parse_statistics_response(result)

                    # Ошибка от API
                    error_info = result.get('error', {}) if result else {}
                    error_code = error_info.get('error_code', resp.status)
                    error_msg = error_info.get('error_msg', 'unknown')
                    logger.warning(
                        "DLVRY API error: affiliate=%s, code=%s, msg=%s, full_response=%s",
                        affiliate_id, error_code, error_msg, raw_text,
                    )
                    return None

        except Exception as e:
            logger.error("DLVRY API request failed for affiliate %s: %s", affiliate_id, e)
            return None

    # ── Получение заказов через hl-orders ────────────────────

    async def fetch_hl_orders(
        self,
        affiliate_id: str,
        date_from: str,
        date_to: str,
    ) -> list[dict]:
        """
        Получить список заказов за период через hl-orders API.

        Endpoint:
            GET https://dlvry.ru/api/v1/affiliates/{affiliate_id}/hl-orders
                ?date_from=DD.MM.YYYY&date_to=DD.MM.YYYY

        Returns:
            Список raw dict'ов заказов (формат как webhook payload) или пустой список.
        """
        url = (
            f"{DLVRY_API_BASE}/affiliates/{affiliate_id}/hl-orders"
            f"?date_from={date_from}&date_to={date_to}"
        )

        # Увеличенный таймаут: hl-orders может вернуть десятки МБ за большие периоды
        hl_timeout = aiohttp.ClientTimeout(total=120)

        try:
            async with aiohttp.ClientSession(timeout=hl_timeout) as session:
                async with session.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._token}",
                        "User-Agent": "smmgame",
                    },
                ) as resp:
                    raw_text = await resp.text()
                    logger.debug(
                        "DLVRY hl-orders: affiliate=%s, status=%s, len=%s",
                        affiliate_id, resp.status, len(raw_text),
                    )

                    import json as _json
                    try:
                        result = _json.loads(raw_text)
                    except Exception:
                        logger.error(
                            "DLVRY hl-orders: не удалось распарсить JSON, "
                            "status=%s, raw[:500]=%s",
                            resp.status, raw_text[:500],
                        )
                        return []

                    if isinstance(result, dict) and result.get('status') == 'success':
                        data = result.get('data', {})
                        # API возвращает заказы в поле "items"
                        orders = data.get('items', [])
                        if isinstance(orders, list):
                            return orders
                        return []

                    logger.warning(
                        "DLVRY hl-orders error: affiliate=%s, response=%s",
                        affiliate_id, raw_text[:500],
                    )
                    return []

        except Exception as e:
            logger.error("DLVRY hl-orders request failed for affiliate %s: %s", affiliate_id, e)
            return []

    # ── Получение каталога товаров ───────────────────────────

    async def fetch_affiliate_items(self, affiliate_id: str) -> dict[str, str]:
        """
        Получить каталог товаров (id → name) через /affiliates/{id}/items.

        Returns:
            Словарь {item_id: item_name} для маппинга позиций заказов.
        """
        url = f"{DLVRY_API_BASE}/affiliates/{affiliate_id}/items"
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=60)
            ) as session:
                async with session.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._token}",
                        "User-Agent": "smmgame",
                    },
                ) as resp:
                    if resp.status != 200:
                        logger.warning(
                            "DLVRY items: affiliate=%s, status=%s",
                            affiliate_id, resp.status,
                        )
                        return {}

                    import json as _json
                    data = _json.loads(await resp.text())
                    items = data.get("data", {}).get("items", [])
                    return {
                        str(item["id"]): item.get("name", "")
                        for item in items
                        if isinstance(item, dict) and item.get("id")
                    }
        except Exception as e:
            logger.error(
                "DLVRY items request failed for affiliate %s: %s",
                affiliate_id, e,
            )
            return {}
