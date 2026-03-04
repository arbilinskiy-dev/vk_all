import React from 'react';
import { VK_COLORS, VkPost, VkComment, VkMessage } from '../../../../automations/reviews-contest/components/preview/VkUiKit';

// ============================================
// Демо-компоненты: посты (стартовый, итоговый, полный превью)
// ============================================

/** Полное превью конкурса — 3 блока: старт, итоги, вручение */
export const FullPreviewDemo: React.FC = () => {
  const mockProject = {
    name: 'Магазин Подарков',
    avatar_url: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=256&h=256&fit=crop'
  };

  return (
    <div 
      className="rounded-lg overflow-hidden border border-gray-200" 
      style={{ backgroundColor: VK_COLORS.bg, maxHeight: '600px', overflowY: 'auto' }}
    >
      <div className="max-w-[550px] w-full mx-auto space-y-8 p-4">
        
        {/* 1. Стартовый пост */}
        <div>
          <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">1. Старт конкурса</div>
          <VkPost
            isGroup
            authorName={mockProject.name}
            authorAvatar={mockProject.avatar_url}
            date="20 февраля 2026 в 12:00"
            highlightWord=""
            text="🎉 Запускаем конкурс! Разыгрываем 3 подарка среди участников.&#10;&#10;Условия: лайк + репост + подписка.&#10;Итоги — 27 февраля!"
            likes={36}
            comments={12}
            reposts={4}
            views={1.8}
            images={[{ url: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=400&fit=crop' }]}
            blurredExtras={true}
          />
        </div>

        {/* 2. Итоговый пост */}
        <div>
          <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">2. Объявление итогов</div>
          <VkPost
            isGroup
            authorName={mockProject.name}
            authorAvatar={mockProject.avatar_url}
            date="после завершения"
            highlightWord=""
            text="Поздравляем победителей!&#10;&#10;1. Иван Петров (№42)"
            likes={48}
            comments={15}
            reposts={6}
            views={3.1}
            blurredExtras={true}
          />
        </div>

        {/* 3. Вручение приза */}
        <div>
          <div className="mb-2 text-xs font-bold text-[#818c99] uppercase tracking-wide ml-1">3. Вручение приза</div>
          <div className="space-y-4">
            <VkMessage
              authorName={mockProject.name}
              text="Поздравляем! Вы выиграли приз: Подарок недели&#10;Ваш код: WIN-2025"
              date="14:40"
              authorAvatar={mockProject.avatar_url}
              blurredExtras={true}
            />
            
            <div className="text-xs text-center text-gray-400 pt-2 border-t border-gray-300/50 relative">
              <span className="px-2 relative -top-4 bg-[#edeef0]">Если ЛС закрыто</span>
            </div>
            
            <VkPost
              authorName="Мария Смирнова"
              authorAvatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop"
              date="сегодня в 14:30"
              highlightWord=""
              text="Спасибо за конкурс! Жду результаты ❤️"
              likes={12}
              comments={5}
              reposts={1}
              views={1.2}
              blurredExtras={true}
            >
              <VkComment
                isGroup
                authorName={mockProject.name}
                authorAvatar={mockProject.avatar_url}
                text="Напишите нам в личные сообщения, Мария, чтобы забрать приз!"
                date="только что"
                replyToName="Мария"
                blurredExtras={false}
              />
            </VkPost>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Демо стартового поста конкурса */
export const StartPostDemo: React.FC = () => {
  const mockProject = {
    name: 'Книжный Магазин',
    avatar_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=256&h=256&fit=crop'
  };

  return (
    <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg">
      <VkPost
        isGroup
        authorName={mockProject.name}
        authorAvatar={mockProject.avatar_url}
        date="25 февраля 2026 в 10:00"
        highlightWord=""
        text="📚 Конкурс! Разыгрываем 5 бестселлеров среди подписчиков.&#10;&#10;Правила:&#10;✓ Лайк этому посту&#10;✓ Репост к себе на стену&#10;✓ Подписка на сообщество&#10;&#10;Победителей выберем 28 февраля в 18:00!"
        likes={89}
        comments={23}
        reposts={12}
        views={4.2}
        images={[
          { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop' },
          { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=400&fit=crop' }
        ]}
        blurredExtras={true}
      />
    </div>
  );
};

/** Демо итогового поста с победителями */
export const ResultPostDemo: React.FC = () => {
  const mockProject = {
    name: 'Спортивный Клуб',
    avatar_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=256&h=256&fit=crop'
  };

  return (
    <div className="space-y-4">
      <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg">
        <VkPost
          isGroup
          authorName={mockProject.name}
          authorAvatar={mockProject.avatar_url}
          date="после завершения"
          highlightWord=""
          text="🏆 Итоги конкурса на абонементы!&#10;&#10;Победители:&#10;1. Иван Петров (№42)&#10;2. Анна Кузнецова (№18)&#10;3. Дмитрий Сидоров (№93)&#10;&#10;Поздравляем! Ждём вас в клубе 💪"
          likes={156}
          comments={47}
          reposts={22}
          views={8.5}
          blurredExtras={true}
        />
      </div>

      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-sm text-gray-700">
        <strong>Переменная {'{winners_list}'}:</strong> Система автоматически подставит реальных победителей в формате «Номер. Имя (№участника)»
      </div>
    </div>
  );
};
