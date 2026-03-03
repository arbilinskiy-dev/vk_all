/**
 * Шапка панели информации о пользователе.
 * Аватар, имя, ссылка на VK, badge «можно / нельзя писать».
 */

import React, { useState, useEffect, useRef } from 'react';
import { MailingUserInfo, ConversationUser } from '../../types';

interface UserInfoPanelHeaderProps {
    userInfo: MailingUserInfo;
    user: ConversationUser;
}

export const UserInfoPanelHeader: React.FC<UserInfoPanelHeaderProps> = ({ userInfo, user }) => {
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const initials = `${user.firstName[0]}${user.lastName[0]}`;

    // Сброс avatarLoaded при смене пользователя (новый URL аватара)
    const prevAvatarUrlRef = useRef(user.avatarUrl);
    useEffect(() => {
        if (prevAvatarUrlRef.current !== user.avatarUrl) {
            setAvatarLoaded(false);
            prevAvatarUrlRef.current = user.avatarUrl;
        }
    }, [user.avatarUrl]);

    return (
        <div className="px-5 py-5 border-b border-gray-100 text-center">
            {/* Аватар */}
            <div className="mx-auto w-20 h-20 rounded-full relative mb-3">
                {user.avatarUrl ? (
                    <>
                        {!avatarLoaded && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full" />
                        )}
                        <img
                            src={user.avatarUrl}
                            alt={`${user.firstName} ${user.lastName}`}
                            className={`w-20 h-20 rounded-full object-cover transition-opacity duration-300 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setAvatarLoaded(true)}
                        />
                    </>
                ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
                        {initials}
                    </div>
                )}
            </div>

            {/* Имя */}
            <p className="text-base font-semibold text-gray-800">
                {userInfo.first_name} {userInfo.last_name}
            </p>

            {/* Ссылка на VK */}
            {userInfo.domain && (
                <a
                    href={`https://vk.com/${userInfo.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-500 hover:text-indigo-600 mt-1 inline-block"
                >
                    vk.com/{userInfo.domain}
                </a>
            )}

            {/* Статус отправки сообщений */}
            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                userInfo.can_write_private_message
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-500'
            }`}>
                <span className={`w-2 h-2 rounded-full ${userInfo.can_write_private_message ? 'bg-green-400' : 'bg-red-400'}`} />
                {userInfo.can_write_private_message ? 'Можно писать' : 'Нельзя писать'}
            </div>
        </div>
    );
};
