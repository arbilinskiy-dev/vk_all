// =====================================================================
// Секция «Советы по работе с участниками» — рекомендации для пользователей
// =====================================================================
import React from 'react';

export const TipsSection: React.FC = () => (
    <>
        <h2 className="!text-2xl !font-bold !tracking-tight !text-gray-900 !mt-10">
            💡 Советы по работе с участниками
        </h2>

        <div className="not-prose">
            <div className="space-y-4 my-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-blue-900 mb-1">1. Регулярно собирайте новых участников</h4>
                    <p className="text-sm text-blue-800">
                        Кнопка "Собрать посты" не работает автоматически — нажимайте её вручную 1-2 раза в день. Так вы не пропустите новые отзывы.
                    </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-green-900 mb-1">2. Комментируйте сразу после сбора</h4>
                    <p className="text-sm text-green-800">
                        Участники со статусом "Новый" не участвуют в розыгрыше. Нажмите "Прокомментировать", чтобы присвоить им номера. Только после этого они становятся валидными.
                    </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-yellow-900 mb-1">3. Проверяйте участников с ошибками</h4>
                    <p className="text-sm text-yellow-800">
                        Если у участника статус "Ошибка" — система не смогла прокомментировать его пост. Причины: закрытый профиль, удалённый пост или бан VK API. Можно вручную прокомментировать через VK.
                    </p>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-red-900 mb-1">4. Не используйте "Очистить" в боевом режиме</h4>
                    <p className="text-sm text-red-800">
                        Кнопка "Очистить" (корзина) удаляет <strong>ВСЕХ</strong> участников из базы безвозвратно. Она нужна только для тестирования. В реальном конкурсе не используйте её!
                    </p>
                </div>
            </div>
        </div>
    </>
);
