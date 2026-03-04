import React, { useState } from 'react';
import { VK_COLORS, VkPost } from '../../../../automations/reviews-contest/components/preview/VkUiKit';

// ============================================
// Демо-компоненты: утилитарные (переменные, изображения, размытие)
// ============================================

/** Демо подстановки переменных */
export const VariablesDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Доступные переменные:</h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-mono text-xs border border-indigo-200 shrink-0">
              {'{winners_list}'}
            </code>
            <div>
              <p className="font-medium text-gray-700">Список победителей</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Пример: «1. Иван Петров (№42)<br />2. Анна Кузнецова (№18)»
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-mono text-xs border border-indigo-200 shrink-0">
              {'{promo_code}'}
            </code>
            <div>
              <p className="font-medium text-gray-700">Промокод победителя</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Пример: «WIN-2025» (из базы промокодов)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-mono text-xs border border-indigo-200 shrink-0">
              {'{description}'}
            </code>
            <div>
              <p className="font-medium text-gray-700">Описание приза</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Пример: «Скидка 50%» или «Подарочный набор»
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-mono text-xs border border-indigo-200 shrink-0">
              {'{user_name}'}
            </code>
            <div>
              <p className="font-medium text-gray-700">Имя победителя</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Пример: «Мария» (из профиля VK)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
        💡 <strong>Совет:</strong> В превью переменные заменены на примеры. При реальной публикации подставятся настоящие данные из базы.
      </div>
    </div>
  );
};

/** Демо отображения фотографий (1 / 2 / 4 фото) */
export const ImagesHandlingDemo: React.FC = () => {
  const [imageCount, setImageCount] = useState<1 | 2 | 4>(1);

  const mockProject = {
    name: 'Фотостудия',
    avatar_url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=256&h=256&fit=crop'
  };

  const images = {
    1: [{ url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop' }],
    2: [
      { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop' }
    ],
    4: [
      { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=400&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop' },
      { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&h=400&fit=crop' }
    ]
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setImageCount(1)}
          className={`px-3 py-1 text-xs rounded ${imageCount === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          1 фото
        </button>
        <button
          onClick={() => setImageCount(2)}
          className={`px-3 py-1 text-xs rounded ${imageCount === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          2 фото
        </button>
        <button
          onClick={() => setImageCount(4)}
          className={`px-3 py-1 text-xs rounded ${imageCount === 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
        >
          4 фото
        </button>
      </div>

      <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg">
        <VkPost
          isGroup
          authorName={mockProject.name}
          authorAvatar={mockProject.avatar_url}
          date="сегодня в 11:00"
          highlightWord=""
          text="Новая фотосессия! Смотрите наши работы 📸"
          likes={45}
          comments={8}
          reposts={3}
          views={2.1}
          images={images[imageCount]}
          blurredExtras={true}
        />
      </div>

      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <strong>Правило:</strong> {imageCount === 1 ? 'Одно фото → показывается на всю ширину' : `${imageCount} фото → сетка 2 колонки`}
      </div>
    </div>
  );
};

/** Демо эффекта размытия второстепенных элементов */
export const BlurEffectDemo: React.FC = () => {
  const [showBlur, setShowBlur] = useState(true);

  const mockProject = {
    name: 'Спа-Салон',
    avatar_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=256&h=256&fit=crop'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowBlur(!showBlur)}
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
        >
          {showBlur ? 'Убрать размытие' : 'Включить размытие'}
        </button>
        <span className="text-sm text-gray-600">
          {showBlur ? 'Акцент на текст' : 'Все элементы чёткие'}
        </span>
      </div>

      <div style={{ backgroundColor: VK_COLORS.bg }} className="p-4 rounded-lg">
        <VkPost
          isGroup
          authorName={mockProject.name}
          authorAvatar={mockProject.avatar_url}
          date="15 февраля в 14:00"
          highlightWord=""
          text="Розыгрыш сертификата на массаж!&#10;&#10;Условия: лайк + репост"
          likes={67}
          comments={19}
          reposts={8}
          views={3.4}
          blurredExtras={showBlur}
        />
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
        <strong>Зачем размытие:</strong> Помогает сфокусироваться на главном — тексте и переменных. Лайки и комментарии в превью фиктивные, поэтому они размыты.
      </div>
    </div>
  );
};
