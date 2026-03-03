/** Допустимые форматы файлов для загрузки историй */
export const ACCEPTED_PHOTO = '.jpg,.jpeg,.png,.gif';
export const ACCEPTED_VIDEO = '.mp4,.mov,.avi,.webm';
export const ACCEPTED_ALL = `${ACCEPTED_PHOTO},${ACCEPTED_VIDEO}`;

/** Тексты ссылок VK для кнопки в истории */
export const LINK_TEXT_OPTIONS = [
    { value: '', label: 'Без ссылки' },
    { value: 'go_to', label: 'Перейти' },
    { value: 'more', label: 'Ещё' },
    { value: 'learn_more', label: 'Подробнее' },
    { value: 'view', label: 'Посмотреть' },
    { value: 'open', label: 'Открыть' },
    { value: 'buy', label: 'Купить' },
    { value: 'book', label: 'Забронировать' },
    { value: 'signup', label: 'Зарегистрироваться' },
    { value: 'write', label: 'Написать' },
    { value: 'contact', label: 'Связаться' },
    { value: 'to_store', label: 'В магазин' },
    { value: 'order', label: 'Заказать' },
    { value: 'ticket', label: 'Купить билет' },
    { value: 'read', label: 'Читать' },
    { value: 'watch', label: 'Смотреть' },
    { value: 'play', label: 'Слушать' },
    { value: 'install', label: 'Установить' },
    { value: 'fill', label: 'Заполнить' },
    { value: 'enroll', label: 'Записаться' },
    { value: 'vote', label: 'Голосовать' },
];
