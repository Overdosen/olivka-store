---
title: "Flexbox Carousel & Product Card Equal Height Fix"
aliases: [carousel-card-height, flex-stretch-image-bug, equal-height-cards]
tags: [css, flexbox, layout, nextjs-image, responsive-design]
sources:
  - "daily/2026-08-02.md"
created: 2026-08-02
updated: 2026-08-02
---

# Flexbox Carousel & Product Card Equal Height Fix

Задокументований досвід вирішення проблеми, коли окремі плитки товарів (або їх зображення) в каруселях (flex-rows) роздуваються у висоту на мобільних пристроях чи при високому масштабуванні.

## Корінь проблеми (Root Cause Analysis)

1. **Неоднакова довжина заголовків (Text Wrapping)**:
   При переносі слів у заголовках товарів (`product-title`), один заголовок може займати 2 рядки, а сусідній (через довге слово) переноситься на 3–4 рядки.
2. **Побічний ефект Flexbox `alignItems: 'stretch'`**:
   Карусельний контейнер розтягує УСІ картки до висоти найвищої.
3. **Реакція обгортки картинки (`Image`)**:
   Якщо зображення чи його контейнер посилається на висоту батьківського елемента без суворого фіксованого ratio-box (`padding-top: 133.33%` з `position: absolute` fill), картинка підлаштовується під збільшену висоту плитки і **стає гігантською**, виштовхуючи весь вміст униз.

## Комплексне рішення (The Ultimate Solution Pattern)

Щоб плитки завжди залишалися 100% однаковими на будь-яких пристроях та при будь-якому масштабі:

### 1. Фіксація висоти заголовка (CSS Line Clamp)
Суворо фіксуємо заголовок на 2 рядки з обрізанням трьома крапками:
```css
.product-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-stone-800);
  line-height: 1.25rem;
  height: 2.5rem; /* Чітко 2 рядки (1.25rem * 2) */
  margin-bottom: 0.35rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}
```

### 2. Ізольований Ratio-Box для зображення (Aspect Ratio 3:4)
Замість `aspect-ratio: 3/4` (який глючить у Flexbox-column при `alignItems: stretch`) використовуємо класичну абсолютну обгортку з `paddingTop: '133.33%'`:
```jsx
<div style={{
  position: 'relative',
  width: '100%',
  paddingTop: '133.33%', /* 4/3 * 100% = точний 3:4 ratio */
  borderRadius: '0.75rem',
  overflow: 'hidden',
  marginBottom: '0.5rem',
  backgroundColor: 'var(--color-stone-50)'
}}>
  <Image
    src={product.image}
    alt={product.name}
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

## Ключові правила для майбутнього
- **Ніколи не застосовувати `aspect-ratio` прямо на flex-item або всередині `flex-direction: column` з `alignItems: stretch`**, якщо вміст супроводжується динамічним текстом.
- **Завжди фіксувати висоту тексту (line-clamp)** у картках товарів сіток та каруселей.
