// ─── Категории событий VK Callback API ────────────────────────────
// Используется в IntegrationsSection и BulkCallbackSetupModal
// для выбора событий при автонастройке Callback-сервера.
//
// Названия категорий и лейблы событий приведены в точное соответствие
// с панелью VK «Управление сообществом → Callback API → Типы событий».
//
// Некоторые события (vkpay_transaction, app_payload)
// VK включает автоматически (не являются параметрами groups.setCallbackSettings),
// но показываются в панели VK → показываем и у нас. Бэкенд фильтрует при отправке.
// wall_schedule_post_new/delete — настраиваемые через API (в setCallbackSettings).

export interface CallbackEventCategory {
    label: string;
    events: { key: string; label: string }[];
}

export const CALLBACK_EVENT_CATEGORIES: CallbackEventCategory[] = [
    {
        label: 'Сообщения',
        events: [
            { key: 'message_new', label: 'Входящее сообщение' },
            { key: 'message_reply', label: 'Исходящее сообщение' },
            { key: 'message_edit', label: 'Редактирование сообщения' },
            { key: 'message_event', label: 'Действие с сообщением' },
            { key: 'message_allow', label: 'Разрешение на получение' },
            { key: 'message_deny', label: 'Запрет на получение' },
            { key: 'message_typing_state', label: 'Статус набора текста' },
            { key: 'message_read', label: 'Прочитанность сообщений' },
            { key: 'message_reaction_event', label: 'Действие с реакциями на сообщение' },
        ],
    },
    {
        label: 'Фотографии',
        events: [
            { key: 'photo_new', label: 'Добавление' },
            { key: 'photo_comment_new', label: 'Новый комментарий' },
            { key: 'photo_comment_edit', label: 'Редактирование комментария' },
            { key: 'photo_comment_delete', label: 'Удаление комментария' },
            { key: 'photo_comment_restore', label: 'Восстановление удалённого комментария' },
        ],
    },
    {
        label: 'Аудиозаписи',
        events: [
            { key: 'audio_new', label: 'Добавление' },
        ],
    },
    {
        label: 'Видеозаписи',
        events: [
            { key: 'video_new', label: 'Добавление' },
            { key: 'video_comment_new', label: 'Новый комментарий' },
            { key: 'video_comment_edit', label: 'Редактирование комментария' },
            { key: 'video_comment_delete', label: 'Удаление комментария' },
            { key: 'video_comment_restore', label: 'Восстановление удалённого комментария' },
        ],
    },
    {
        label: 'Записи на стене',
        events: [
            { key: 'wall_post_new', label: 'Добавление' },
            { key: 'wall_repost', label: 'Поделились' },
            { key: 'like_add', label: 'Добавление отметки «Нравится»' },
            { key: 'like_remove', label: 'Удаление отметки «Нравится»' },
            { key: 'wall_schedule_post_new', label: 'Добавление отложенной записи в расписание' },
            { key: 'wall_schedule_post_delete', label: 'Удаление отложенной записи из расписания' },
        ],
    },
    {
        label: 'Комментарии на стене',
        events: [
            { key: 'wall_reply_new', label: 'Добавление' },
            { key: 'wall_reply_edit', label: 'Редактирование' },
            { key: 'wall_reply_delete', label: 'Удаление' },
            { key: 'wall_reply_restore', label: 'Восстановление' },
        ],
    },
    {
        label: 'Обсуждения',
        events: [
            { key: 'board_post_new', label: 'Добавление' },
            { key: 'board_post_edit', label: 'Редактирование' },
            { key: 'board_post_delete', label: 'Удаление' },
            { key: 'board_post_restore', label: 'Восстановление' },
        ],
    },
    {
        label: 'Товары',
        events: [
            { key: 'market_comment_new', label: 'Новый комментарий' },
            { key: 'market_comment_edit', label: 'Редактирование комментария' },
            { key: 'market_comment_delete', label: 'Удаление комментария' },
            { key: 'market_comment_restore', label: 'Восстановление удалённого комментария' },
        ],
    },
    {
        label: 'Пользователи',
        events: [
            { key: 'group_join', label: 'Подписка на сообщество' },
            { key: 'group_leave', label: 'Выход из сообщества' },
            { key: 'user_block', label: 'Блокировка' },
            { key: 'user_unblock', label: 'Разблокировка' },
        ],
    },
    {
        label: 'Донаты',
        events: [
            { key: 'donut_subscription_create', label: 'Создание подписки' },
            { key: 'donut_subscription_prolonged', label: 'Продление подписки' },
            { key: 'donut_subscription_cancelled', label: 'Отмена подписки' },
            { key: 'donut_subscription_expired', label: 'Подписка истекла' },
            { key: 'donut_subscription_price_changed', label: 'Сумма поддержки изменена' },
            { key: 'donut_money_withdraw', label: 'Вывод денег' },
            { key: 'donut_money_withdraw_error', label: 'Ошибка вывода денег' },
        ],
    },
    {
        label: 'Прочее',
        events: [
            { key: 'group_change_settings', label: 'Изменение настроек' },
            { key: 'poll_vote_new', label: 'Голос в публичном опросе' },
            { key: 'group_change_photo', label: 'Изменение основной фотографии' },
            { key: 'group_officers_edit', label: 'Изменение руководства' },
            { key: 'vkpay_transaction', label: 'Платёж через VK Pay' },
            { key: 'app_payload', label: 'Событие от VK Mini Apps' },
        ],
    },
];

/** Все ключи событий — плоский массив */
export const ALL_EVENT_KEYS = CALLBACK_EVENT_CATEGORIES.flatMap(c => c.events.map(e => e.key));
