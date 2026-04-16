---
title: "Professional Modal Pattern (Store Olivka)"
aliases: [modal-pattern, professional-ui, portal-modal]
tags: [ui, react, css, animation]
sources:
  - "daily/2026-04-15.md"
created: 2026-04-15
updated: 2026-04-15
---

# Professional Modal Pattern

Патерн створення високоїкості модальних вікон у проєкті Olivka Store, що поєднує технічну надійність та естетичну довершеність.

## Key Points

- **React Portals (`createPortal`)**: Завжди рендерити модалки через портали в окремий DOM-вузол (`#modal-root` або `document.body`), щоб уникнути конфліктів `z-index`, `overflow: hidden` батьків та проблем зі стекуванням контекстів.
- **Custom CSS Design System**: Відмова від Tailwind-утиліт для складних компонентів UI (як модалки) на користь структурованого CSS у `index.css`. Це забезпечує легшу підтримку складних станів та консистентність радіусів закруглень (`16px` для вікна, `10px` для інпутів).
- **Premium Animations**: Використання `framer-motion` з фізикою `spring` (`stiffness: 300, damping: 30`). Це робить появу вікна "живою" та преміальною.
- **Micro-interactions**: Кожне поле має плавний фокус, кожна кнопка — візуальний відгук на натискання та ховер.
- **UX Details**: Автофокус на першому полі при вході, блокування скролу сторінки під модалкою, закриття по кліку на бекдроп та клавішу Escape.

## Details

Проєкт використовує специфічну палітру (`#faf5ee` фон, `#524f25` основний колір) та шрифти (Inter). Модальне вікно має включати:
1.  **Backdrop**: `rgba(28, 25, 12, 0.35)` з `backdrop-filter: blur(6px)`.
2.  **Header**: З чітким тайтлом та іконкою дії.
3.  **Body**: З відступами `1.75rem` для "повітряності" дизайну.
4.  **Fields**: Інпути з бордером `1.5px solid rgba(82, 79, 37, 0.1)` та легким шадоу при фокусі.

## Related Concepts

- [[concepts/resend-integration]] - Реалізація бекенд-частини для контактних форм.
- [[concepts/ui-visual-consistency]] - Загальна стратегія дизайну проєкту.

## Sources

- [[daily/2026-04-15.md]] - Первинне впровадження при редизайні футера та контактної форми.
