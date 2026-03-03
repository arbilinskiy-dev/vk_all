# Изображения / Фото

**Правило:** Каждый `<img>`, отображающий фото (товары, посты, аватарки, превью), ОБЯЗАН следовать двум паттернам: skeleton + fade-in И кликабельность с lightbox.

## Паттерн 1: Skeleton + Fade-In Loading

ЗАПРЕЩЕНО рендерить голый `<img>` без обработки состояния загрузки.

### Эталонная реализация

```tsx
const [isLoaded, setIsLoaded] = useState(false);

return (
    <div className="relative h-14 w-14">
        {/* Скелетон-плейсхолдер — виден пока фото не загрузилось */}
        {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 rounded animate-pulse" />
        )}
        {/* Фото с плавным появлением */}
        <img
            src={imageUrl}
            alt={altText}
            className={`h-14 w-14 object-cover rounded transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsLoaded(true)}
        />
    </div>
);
```

### Спецификации

| Параметр | Значение |
|---|---|
| Скелетон | `bg-gray-200 animate-pulse rounded` (размер = размер изображения) |
| Скрытое изображение | `opacity-0` до загрузки |
| Переход | `transition-opacity duration-300` |
| Триггер | `onLoad={() => setIsLoaded(true)}` |

### Запрещено

```tsx
// ❌ Фото без лоадера — дёрганая загрузка
<img src={item.photo} alt={item.title} className="h-14 w-14 object-cover rounded" />
```

## Паттерн 2: Кликабельность + Fullscreen Lightbox

ВСЕ фото ОБЯЗАНЫ быть кликабельными. При клике — открывать полноэкранный lightbox.

### Требования к миниатюре

- Обёрнута в `<button>` с `cursor-pointer`
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`
- Комбинируется с паттерном скелетона (см. выше)

### Требования к Lightbox Overlay

| Параметр | Значение |
|---|---|
| Фон | `bg-black/80` или `bg-black bg-opacity-80` |
| Z-index | `z-[9999]` |
| Изображение | `object-contain max-w-[90vw] max-h-[90vh]` |
| Закрытие | По клику на фон, по кнопке "крестик" (X), по клавише `Escape` |
| Курсор на оверлее | `cursor-zoom-out` |
| Курсор на миниатюре | `cursor-pointer` |

## Где применяется

- Фото товаров в таблице
- Превью изображений в постах
- Аватарки пользователей/сообществ
- Любые другие фотографии в интерфейсе
