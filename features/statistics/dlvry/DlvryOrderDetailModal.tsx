/**
 * Модальное окно с полной информацией о заказе DLVRY.
 * Показывает данные клиента, адрес, позиции, оплату.
 */

import React, { useEffect, useState } from 'react';
import { fetchDlvryOrderDetail, DlvryOrderDetail } from '../../../services/api/dlvry.api';
import { formatMoney, formatDate } from './dlvryFormatUtils';

interface DlvryOrderDetailModalProps {
    orderId: number;
    onClose: () => void;
}

export const DlvryOrderDetailModal: React.FC<DlvryOrderDetailModalProps> = ({ orderId, onClose }) => {
    const [data, setData] = useState<DlvryOrderDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);

        fetchDlvryOrderDetail(orderId)
            .then(d => { if (!cancelled) setData(d); })
            .catch(e => { if (!cancelled) setError(e.message || 'Ошибка загрузки'); })
            .finally(() => { if (!cancelled) setIsLoading(false); });

        return () => { cancelled = true; };
    }, [orderId]);

    const order = data?.order;
    const items = data?.items || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Шапка */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">
                        Заказ #{order?.dlvry_order_id || orderId}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Контент */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="loader w-8 h-8 border-t-indigo-500" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    )}

                    {order && !isLoading && (
                        <>
                            {/* Клиент */}
                            <Section title="Клиент">
                                <InfoRow label="Имя" value={order.client_name} />
                                <InfoRow label="Телефон" value={order.client_phone} />
                                <InfoRow label="Email" value={order.client_email} />
                                <InfoRow label="День рождения" value={order.client_birthday} />
                                {order.vk_user_id && (
                                    <InfoRow label="VK ID" value={order.vk_user_id} />
                                )}
                                {order.vk_platform && (
                                    <InfoRow label="VK платформа" value={order.vk_platform} />
                                )}
                            </Section>

                            {/* Заказ */}
                            <Section title="Детали заказа">
                                <InfoRow label="Дата" value={formatDate(order.order_date)} />
                                <InfoRow label="Статус" value={order.status} />
                                <InfoRow label="Источник" value={order.source_name} />
                                <InfoRow label="Оплата" value={order.payment_type} />
                                <InfoRow label="Доставка" value={order.delivery_type} />
                                {order.pickup_point_name && (
                                    <InfoRow label="Точка самовывоза" value={order.pickup_point_name} />
                                )}
                                {order.promocode && (
                                    <InfoRow label="Промокод" value={order.promocode} />
                                )}
                                {order.comment && (
                                    <InfoRow label="Комментарий" value={order.comment} />
                                )}
                                {order.preorder && (
                                    <InfoRow label="Предзаказ" value="Да" />
                                )}
                                {order.persons != null && order.persons > 0 && (
                                    <InfoRow label="Кол-во персон" value={String(order.persons)} />
                                )}
                                {order.items_total_qty != null && order.items_total_qty > 0 && (
                                    <InfoRow label="Единиц товаров" value={String(order.items_total_qty)} />
                                )}
                            </Section>

                            {/* Адрес */}
                            {order.address_full && (
                                <Section title="Адрес доставки">
                                    <p className="text-sm text-gray-700">{order.address_full}</p>
                                </Section>
                            )}

                            {/* Суммы */}
                            <Section title="Суммы">
                                <div className="grid grid-cols-2 gap-3">
                                    <MoneyCard label="Итого" value={order.total} accent />
                                    <MoneyCard label="Подытог" value={order.subtotal} />
                                    <MoneyCard label="Скидка" value={order.discount} />
                                    <MoneyCard label="Доставка" value={order.delivery_price} />
                                </div>
                                {/* Расширенная финансовая информация */}
                                {(order.cost != null || order.payment_bonus != null || order.markup != null) && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {order.cost != null && (
                                            <MoneyCard label="Себестоимость" value={order.cost} />
                                        )}
                                        {order.total != null && order.cost != null && (
                                            <MarginCard total={order.total} cost={order.cost} />
                                        )}
                                        {order.payment_bonus != null && order.payment_bonus > 0 && (
                                            <MoneyCard label="Оплата бонусами" value={order.payment_bonus} />
                                        )}
                                        {order.markup != null && order.markup > 0 && (
                                            <MoneyCard label="Наценка" value={order.markup} />
                                        )}
                                    </div>
                                )}
                            </Section>

                            {/* Позиции */}
                            {items.length > 0 && (
                                <Section title={`Позиции - ${items.length}`}>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={item.id || idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.name || 'Без названия'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.quantity} шт. × {formatMoney(item.price)} ₽
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 ml-3">
                                                    {formatMoney(item.total)} ₽
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// Вспомогательные компоненты
// =============================================================================

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
        <div className="space-y-1">{children}</div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-baseline justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium text-right ml-4">{value}</span>
        </div>
    );
};

const MoneyCard: React.FC<{ label: string; value: number | null | undefined; accent?: boolean }> = ({ label, value, accent }) => (
    <div className={`p-3 rounded-lg ${accent ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'}`}>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-lg font-bold ${accent ? 'text-indigo-600' : 'text-gray-900'}`}>
            {formatMoney(value)} ₽
        </p>
    </div>
);

const MarginCard: React.FC<{ total: number; cost: number }> = ({ total, cost }) => {
    const margin = total - cost;
    const pct = total > 0 ? Math.round((margin / total) * 100) : 0;
    const color = pct >= 50 ? 'text-green-600' : pct >= 20 ? 'text-amber-600' : 'text-red-500';
    return (
        <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500">Маржа</p>
            <p className={`text-lg font-bold ${color}`}>
                {formatMoney(margin)} ₽ <span className="text-sm font-medium">({pct}%)</span>
            </p>
        </div>
    );
};

// Утилиты импортированы из ./dlvryFormatUtils
