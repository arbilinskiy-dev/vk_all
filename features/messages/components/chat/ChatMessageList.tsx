import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatMessageData, ChatDisplayFilters } from '../../types';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
    messages: ChatMessageData[];
    /** Идёт ли подгрузка старых сообщений */
    isLoadingMore?: boolean;
    /** Есть ли ещё старые сообщения для подгрузки */
    hasMore?: boolean;
    /** Колбэк подгрузки предыдущей страницы */
    onLoadMore?: () => void;
    /** Поисковый запрос для подсветки */
    searchQuery?: string;
    /** Фильтры отображения (скрытие вложений/кнопок) */
    displayFilters?: ChatDisplayFilters;
}

/**
 * Список сообщений в чате со скроллом.
 * Автоматически прокручивается вниз при первой загрузке.
 * Подгрузка старых сообщений при прокрутке вверх.
 * 
 * Анимация: stagger-появление только при первичной загрузке диалога.
 * Последующие обновления (SSE, подгрузка) — без анимации, чтобы не мигать.
 */
export const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    isLoadingMore,
    hasMore,
    onLoadMore,
    searchQuery,
    displayFilters,
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isInitialLoadRef = useRef(true);
    const prevMessagesLengthRef = useRef(0);
    /** Таймеры scrollToBottom — чтобы отменять при смене диалога */
    const scrollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    /** ID сообщений, которые уже были показаны (не анимируем повторно) */
    const shownMessageIdsRef = useRef<Set<string>>(new Set());
    /** Флаг: идёт первичная загрузка диалога (анимируем stagger) */
    const isFirstBatchRef = useRef(true);
    /** Сохраняем scrollHeight перед подгрузкой старых сообщений (для фиксации позиции) */
    const scrollHeightBeforePrependRef = useRef<number>(0);
    /** Флаг: ожидаем рендер после prepend (loadMore) */
    const pendingPrependRef = useRef(false);

    /** ResizeObserver для автоскролла при изменении высоты контента (загрузка картинок и т.д.) */
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    /** Флаг: разрешён ли автоскролл при ресайзе (только первые секунды после входа в диалог) */
    const allowResizeScrollRef = useRef(false);

    // Очистка таймеров и observer при размонтировании
    useEffect(() => {
        return () => {
            scrollTimersRef.current.forEach(clearTimeout);
            scrollTimersRef.current = [];
            resizeObserverRef.current?.disconnect();
        };
    }, []);

    // ResizeObserver: автоскролл при изменении высоты контента (напр. загрузка картинок)
    useEffect(() => {
        if (!containerRef.current) return;
        resizeObserverRef.current?.disconnect();

        const observer = new ResizeObserver(() => {
            // Скроллим вниз только если разрешено (первые секунды после входа в диалог)
            if (allowResizeScrollRef.current && containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        });

        // Наблюдаем за внутренним контентом (первый дочерний элемент или сам контейнер)
        const target = containerRef.current;
        // Через MutationObserver-подход: наблюдаем за самим контейнером (scrollHeight меняется)
        // ResizeObserver на контейнере не сработает (его размер фиксирован), 
        // поэтому оборачиваем контент — наблюдаем за всеми дочерними элементами
        Array.from(target.children).forEach(child => observer.observe(child));
        // Также наблюдаем за самим контейнером на случай если children меняются
        observer.observe(target);

        resizeObserverRef.current = observer;

        return () => observer.disconnect();
    // Переподписываемся при изменении количества сообщений
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.length]);

    // Автоскролл вниз при первичной загрузке или новых сообщениях внизу
    useEffect(() => {
        if (messages.length === 0) {
            isInitialLoadRef.current = true;
            prevMessagesLengthRef.current = 0;
            // Сбрасываем «показанные» ID при смене диалога (messages обнулились)
            shownMessageIdsRef.current.clear();
            isFirstBatchRef.current = true;
            allowResizeScrollRef.current = false;
            // Отменяем старые таймеры скролла
            scrollTimersRef.current.forEach(clearTimeout);
            scrollTimersRef.current = [];
            return;
        }
        
        // --- Фиксация скролла после подгрузки старых сообщений ---
        if (pendingPrependRef.current && containerRef.current) {
            const newScrollHeight = containerRef.current.scrollHeight;
            const delta = newScrollHeight - scrollHeightBeforePrependRef.current;
            containerRef.current.scrollTop += delta;
            pendingPrependRef.current = false;
            prevMessagesLengthRef.current = messages.length;
            // Помечаем подгруженные сообщения как «показанные» (без анимации)
            messages.forEach(m => shownMessageIdsRef.current.add(m.id));
            return;
        }

        // Первичная загрузка — скроллим к самому низу контейнера.
        // Включаем ResizeObserver-автоскролл на 3 секунды, чтобы подхватить загрузку картинок.
        if (isInitialLoadRef.current) {
            // Отменяем предыдущие таймеры
            scrollTimersRef.current.forEach(clearTimeout);
            scrollTimersRef.current = [];

            const scrollToBottom = () => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            };

            // Включаем автоскролл при ресайзе контента
            allowResizeScrollRef.current = true;

            scrollToBottom();
            const t1 = setTimeout(scrollToBottom, 150);
            const t2 = setTimeout(scrollToBottom, 500);
            const t3Extra = setTimeout(scrollToBottom, 1000);
            scrollTimersRef.current.push(t1, t2, t3Extra);

            // Через 3 секунды выключаем автоскролл при ресайзе,
            // чтобы не мешать пользователю, который уже начал скроллить вручную
            const tDisableResize = setTimeout(() => {
                allowResizeScrollRef.current = false;
            }, 3000);
            scrollTimersRef.current.push(tDisableResize);

            isInitialLoadRef.current = false;
            prevMessagesLengthRef.current = messages.length;

            // Выключаем stagger-режим СИНХРОННО — CSS-анимации уже запечены
            // в DOM первым рендером. Установка через таймер ненадёжна:
            // React StrictMode чистит таймеры при ремаунте и isFirstBatch
            // остаётся true навсегда.
            isFirstBatchRef.current = false;
            // Помечаем все сообщения как «показанные»
            messages.forEach(m => shownMessageIdsRef.current.add(m.id));
            return;
        }

        // Если добавились сообщения внизу (новое сообщение) — скроллим вниз плавно
        if (messages.length > prevMessagesLengthRef.current) {
            const diff = messages.length - prevMessagesLengthRef.current;
            // Если добавлено немного (1-3) — скорее всего новое сообщение, скроллим
            if (diff <= 3) {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
            // Если добавлено много — это подгрузка старых, НЕ скроллим
        }

        // Помечаем ВСЕ текущие сообщения как «показанные» (без повторной анимации).
        // Вынесено за пределы if, чтобы обрабатывать замену оптимистичного
        // сообщения реальным (temp→real): длина массива не меняется, но ID — да,
        // и без этого React перемонтирует элемент с новым key, вызывая повторную анимацию.
        messages.forEach(m => shownMessageIdsRef.current.add(m.id));
        prevMessagesLengthRef.current = messages.length;
    }, [messages]);

    // Обработчик прокрутки вверх для подгрузки старых сообщений
    const handleScroll = useCallback(() => {
        if (!containerRef.current || !hasMore || isLoadingMore || !onLoadMore) return;

        const { scrollTop } = containerRef.current;
        // Если прокрутили почти до самого верха — подгружаем
        if (scrollTop < 100) {
            // Сохраняем scrollHeight ДО подгрузки — для фиксации позиции после рендера
            scrollHeightBeforePrependRef.current = containerRef.current.scrollHeight;
            pendingPrependRef.current = true;
            onLoadMore();
        }
    }, [hasMore, isLoadingMore, onLoadMore]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center opacity-0 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm text-gray-400">Нет сообщений</p>
                    <p className="text-xs text-gray-300 mt-1">Начните диалог первым</p>
                </div>
            </div>
        );
    }

    // Группировка сообщений по дате
    const groupedByDate: { date: string; messages: ChatMessageData[] }[] = [];
    messages.forEach(msg => {
        const dateStr = new Date(msg.timestamp).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const lastGroup = groupedByDate[groupedByDate.length - 1];
        if (lastGroup && lastGroup.date === dateStr) {
            lastGroup.messages.push(msg);
        } else {
            groupedByDate.push({ date: dateStr, messages: [msg] });
        }
    });

    // Stagger-анимация ТОЛЬКО для первичной загрузки (isFirstBatchRef === true).
    // Последующие обновления (SSE, подгрузка) — без анимации, чтобы не мигать/прыгать.
    const shouldAnimate = isFirstBatchRef.current;
    const ANIM_STEP_MS = 15; // шаг задержки между элементами
    const totalAnimItems = shouldAnimate
        ? groupedByDate.reduce((sum, g) => sum + 1 + g.messages.length, 0)
        : 0;

    let globalIdx = 0;
    const renderGroups = groupedByDate.map(group => {
        const dateGlobalIdx = globalIdx++;
        const msgs = group.messages.map(msg => {
            const msgGlobalIdx = globalIdx++;
            // Анимируем ТОЛЬКО если идёт первичный stagger И сообщение ещё не показано.
            // willAnimate=false для всех последующих обновлений (отправка, SSE, подгрузка)
            // — это гарантирует отсутствие повторной анимации при замене temp→real.
            const alreadyShown = shownMessageIdsRef.current.has(msg.id);
            const willAnimate = shouldAnimate && !alreadyShown;
            const delay = willAnimate
                ? (totalAnimItems - 1 - msgGlobalIdx) * ANIM_STEP_MS
                : 0;
            return { msg, delay, willAnimate };
        });
        const dateWillAnimate = msgs.some(m => m.willAnimate);
        return {
            date: group.date,
            dateDelay: dateWillAnimate
                ? (totalAnimItems - 1 - dateGlobalIdx) * ANIM_STEP_MS
                : 0,
            dateWillAnimate,
            messages: msgs,
        };
    });

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4" onScroll={handleScroll}>
            {/* Индикатор подгрузки старых сообщений */}
            {isLoadingMore && (
                <div className="flex items-center justify-center py-3">
                    <div className="loader h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
                    <span className="text-xs text-gray-400 ml-2">Загрузка...</span>
                </div>
            )}
            
            {/* Кнопка «Загрузить ещё» если есть старые сообщения */}
            {hasMore && !isLoadingMore && onLoadMore && (
                <div className="flex items-center justify-center py-2 mb-2">
                    <button
                        onClick={onLoadMore}
                        className="text-xs text-indigo-500 hover:text-indigo-600 font-medium px-3 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
                    >
                        Загрузить ранние сообщения
                    </button>
                </div>
            )}

            {renderGroups.map((group) => (
                <div key={group.date}>
                    {/* Разделитель даты */}
                    <div
                        className={`flex items-center justify-center my-4 ${group.dateWillAnimate ? 'opacity-0 animate-fade-in' : ''}`}
                        style={group.dateWillAnimate ? { animationDelay: `${group.dateDelay}ms`, animationFillMode: 'forwards' } : undefined}
                    >
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            {group.date}
                        </span>
                    </div>
                    {/* Сообщения за эту дату */}
                    {group.messages.map(({ msg, delay, willAnimate }) => (
                        <div
                            key={msg.id}
                            className={willAnimate ? 'opacity-0 animate-fade-in-up' : ''}
                            style={willAnimate ? { animationDelay: `${delay}ms`, animationFillMode: 'forwards' } : undefined}
                        >
                            <ChatMessage message={msg} searchQuery={searchQuery} displayFilters={displayFilters} />
                        </div>
                    ))}
                </div>
            ))}
            {/* Элемент для автоскролла */}
            <div ref={bottomRef} />
        </div>
    );
};
