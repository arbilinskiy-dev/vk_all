import React from 'react';
import { VK_COLORS, VkPost, VkComment, VkMessage } from '../../../../automations/reviews-contest/components/preview/VkUiKit';

// ============================================
// Демо-компоненты: сообщения (ЛС и комментарий-фолбэк)
// ============================================

/** Демо личного сообщения победителю */
export const DirectMessageDemo: React.FC = () => {
  const mockProject = {
    name: 'Магазин Электроники',
    avatar_url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=256&h=256&fit=crop'
  };

  return (
    <div className="space-y-4">
      <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg">
        <VkMessage
          authorName={mockProject.name}
          text="Поздравляем! 🎉&#10;&#10;Вы выиграли приз: Скидка 50% на любой товар&#10;Ваш промокод: WIN-2025&#10;&#10;Действителен до 31 марта."
          date="16:25"
          authorAvatar={mockProject.avatar_url}
          blurredExtras={true}
        />
      </div>

      <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm space-y-2">
        <p className="text-gray-700">
          <strong>Переменные в шаблоне:</strong>
        </p>
        <ul className="text-gray-600 text-xs space-y-1 ml-4">
          <li>• <code className="bg-gray-100 px-1 rounded">{'{promo_code}'}</code> → "WIN-2025"</li>
          <li>• <code className="bg-gray-100 px-1 rounded">{'{description}'}</code> → "Скидка 50% на любой товар"</li>
        </ul>
      </div>
    </div>
  );
};

/** Демо комментария-заглушки (если ЛС закрыты) */
export const FallbackCommentDemo: React.FC = () => {
  const mockProject = {
    name: 'Кафе "Уют"',
    avatar_url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=256&h=256&fit=crop'
  };

  return (
    <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg space-y-4">
      <div className="text-xs text-center text-gray-400 pt-2 border-t border-gray-300/50 relative">
        <span className="px-2 relative -top-4 bg-[#edeef0]">Если ЛС закрыто</span>
      </div>
      
      <VkPost
        authorName="Екатерина Волкова"
        authorAvatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop"
        date="вчера в 19:15"
        highlightWord=""
        text="Участвую в конкурсе! Очень хочу выиграть 🍰"
        likes={8}
        comments={2}
        reposts={0}
        views={0.5}
        blurredExtras={true}
      >
        <VkComment
          isGroup
          authorName={mockProject.name}
          authorAvatar={mockProject.avatar_url}
          text="Напишите нам в личные сообщения, Екатерина, чтобы забрать приз!"
          date="2 минуты назад"
          replyToName="Екатерина"
          blurredExtras={false}
        />
      </VkPost>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
        <strong>Когда используется:</strong> Если победителю нельзя отправить ЛС (закрыты личные сообщения), система найдёт его пост и напишет комментарий с призывом написать самому.
      </div>
    </div>
  );
};
