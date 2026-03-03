import React from 'react';
import { UseMailingCollectionResult } from '../../hooks/mailing/useMailingCollection';

interface MailingOnboardingProps {
    /** Открыть настройки проекта на секции «Интеграции» */
    onOpenIntegrations: () => void;
    /** Результат хука useMailingCollection (поднят в ConversationsSidebar) */
    mailingCollection: UseMailingCollectionResult;
}

/**
 * Компонент onboarding-flow для сбора подписчиков в рассылку.
 * Показывается в ConversationsSidebar при блокирующих состояниях (нет токена/callback)
 * или в empty state (когда список пуст, но всё готово — кнопка загрузки).
 * 
 * Последовательность:
 * 1. Нет токена → предлагает добавить (кнопка → секция Интеграции)
 * 2. Нет callback → кнопка автонастройки
 * 3. Всё готово → кнопка «Загрузить»
 * 4. Стриминг с прогрессом
 */
export const MailingOnboarding: React.FC<MailingOnboardingProps> = ({
    onOpenIntegrations,
    mailingCollection,
}) => {
    const {
        readiness,
        progress,
        progressLabel,
        errorMessage,
        callbackSetupMessage,
        callbackErrorCode,
        vkApiSettingsUrl,
        setupCallback,
        startCollection,
        reset,
    } = mailingCollection;

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 h-full">
            {/* Состояние: проверка */}
            {readiness === 'checking' && (
                <StepContainer>
                    <StepIcon type="loading" />
                    <StepTitle>Проверка настроек...</StepTitle>
                    <StepDescription>Проверяем токен сообщества и Callback API</StepDescription>
                </StepContainer>
            )}

            {/* Состояние: нет токена */}
            {readiness === 'no-token' && (
                <StepContainer>
                    <StepIcon type="token" />
                    <StepTitle>Нужен токен сообщества</StepTitle>
                    <StepDescription>
                        Для работы с сообщениями необходимо добавить токен сообщества в настройках проекта
                    </StepDescription>
                    <StepButton onClick={onOpenIntegrations} variant="primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Добавить токен
                    </StepButton>
                </StepContainer>
            )}

            {/* Состояние: нет callback */}
            {readiness === 'no-callback' && (
                <StepContainer>
                    <StepIcon type="callback" />
                    <StepTitle>Настройка Callback API</StepTitle>
                    <StepDescription>
                        Callback-сервер не настроен. Нажмите кнопку для автоматической настройки
                    </StepDescription>
                    <StepButton onClick={setupCallback} variant="primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Настроить автоматически
                    </StepButton>
                </StepContainer>
            )}

            {/* Состояние: настройка callback в процессе */}
            {readiness === 'setting-up-callback' && (
                <StepContainer>
                    <StepIcon type="loading" />
                    <StepTitle>Настройка Callback API...</StepTitle>
                    <StepDescription>
                        Подключаем сервер для приёма сообщений от ВКонтакте
                    </StepDescription>
                </StepContainer>
            )}

            {/* Состояние: ошибка настройки callback */}
            {readiness === 'callback-error' && (
                <StepContainer>
                    <StepIcon type="error" />
                    {callbackErrorCode === 2000 ? (
                        <>
                            <StepTitle>Лимит Callback-серверов</StepTitle>
                            <StepDescription>
                                VK разрешает максимум 10 серверов. Удалите ненужные в настройках API сообщества.
                            </StepDescription>
                            {vkApiSettingsUrl && (
                                <a
                                    href={vkApiSettingsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Открыть настройки API
                                </a>
                            )}
                            <div className="flex gap-2 mt-1">
                                <StepButton onClick={setupCallback} variant="primary">
                                    Повторить
                                </StepButton>
                            </div>
                        </>
                    ) : (
                        <>
                            <StepTitle>Ошибка настройки Callback</StepTitle>
                            <StepDescription>{errorMessage}</StepDescription>
                            <div className="flex gap-2 mt-1">
                                <StepButton onClick={setupCallback} variant="primary">
                                    Повторить
                                </StepButton>
                                <StepButton onClick={onOpenIntegrations} variant="secondary">
                                    Настроить вручную
                                </StepButton>
                            </div>
                        </>
                    )}
                </StepContainer>
            )}

            {/* Состояние: всё готово — можно собирать */}
            {readiness === 'ready' && (
                <StepContainer>
                    <StepIcon type="ready" />
                    <StepTitle>Сообщения не загружены</StepTitle>
                    <StepDescription>
                        {callbackSetupMessage || 'Нажмите кнопку для загрузки подписчиков рассылки'}
                    </StepDescription>
                    <StepButton onClick={startCollection} variant="primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Загрузить
                    </StepButton>
                </StepContainer>
            )}

            {/* Состояние: сбор в процессе */}
            {readiness === 'collecting' && (
                <StepContainer>
                    <StepIcon type="loading" />
                    <StepTitle>Загрузка подписчиков...</StepTitle>
                    {/* Прогресс-бар */}
                    {progress && progress.total && progress.total > 0 && (
                        <div className="w-full mt-2">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>{progress.message || 'Сбор данных'}</span>
                                <span>{progressLabel}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min(100, ((progress.loaded || 0) / progress.total) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}
                    {/* Если нет total — просто спиннер с сообщением */}
                    {progress && (!progress.total || progress.total === 0) && progress.message && (
                        <StepDescription>{progress.message}</StepDescription>
                    )}
                    {!progress && (
                        <StepDescription>Инициализация задачи...</StepDescription>
                    )}
                </StepContainer>
            )}

            {/* Состояние: сбор завершён */}
            {readiness === 'done' && (
                <StepContainer>
                    <StepIcon type="success" />
                    <StepTitle>Загрузка завершена</StepTitle>
                    <StepDescription>
                        {progress?.loaded ? `Загружено ${progress.loaded} подписчиков` : 'Данные загружены'}
                    </StepDescription>
                </StepContainer>
            )}

            {/* Состояние: ошибка сбора */}
            {readiness === 'error' && (
                <StepContainer>
                    <StepIcon type="error" />
                    <StepTitle>Ошибка загрузки</StepTitle>
                    <StepDescription>{errorMessage}</StepDescription>
                    <div className="flex gap-2 mt-1">
                        <StepButton onClick={startCollection} variant="primary">
                            Повторить
                        </StepButton>
                        <StepButton onClick={reset} variant="secondary">
                            Сбросить
                        </StepButton>
                    </div>
                </StepContainer>
            )}
        </div>
    );
};

// ─── Мелкие UI-подкомпоненты ─────────────────────────────────────

/** Контейнер шага */
const StepContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex flex-col items-center text-center gap-1.5 animate-fade-in-up max-w-[220px]">
        {children}
    </div>
);

/** Заголовок шага */
const StepTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-sm font-medium text-gray-600">{children}</p>
);

/** Описание шага */
const StepDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
);

/** Кнопка действия */
const StepButton: React.FC<{
    onClick: () => void;
    variant: 'primary' | 'secondary';
    children: React.ReactNode;
}> = ({ onClick, variant, children }) => {
    const base = 'mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors';
    const styles = variant === 'primary'
        ? `${base} bg-indigo-600 text-white hover:bg-indigo-700`
        : `${base} bg-gray-100 text-gray-600 hover:bg-gray-200`;

    return (
        <button onClick={onClick} className={styles}>
            {children}
        </button>
    );
};

/** Иконка шага */
const StepIcon: React.FC<{
    type: 'loading' | 'token' | 'callback' | 'ready' | 'success' | 'error';
}> = ({ type }) => {
    const iconClass = 'h-10 w-10';

    switch (type) {
        case 'loading':
            return (
                <div className="w-10 h-10 flex items-center justify-center">
                    <div className="loader" style={{ width: '24px', height: '24px', borderTopColor: '#4f46e5' }} />
                </div>
            );

        case 'token':
            return (
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
            );

        case 'callback':
            return (
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            );

        case 'ready':
            return (
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-indigo-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
            );

        case 'success':
            return (
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-green-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            );

        case 'error':
            return (
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
    }
};
