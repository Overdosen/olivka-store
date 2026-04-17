---
title: "Next.js Environment Variable Mapping Patterns"
tags: [nextjs, vite, configuration, deployment]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-17
updated: 2026-04-17
---

# Next.js Environment Variable Mapping Patterns

Метод підтримки сумісності між різними префіксами змінних оточення (наприклад, при міграції з Vite на Next.js).

## Ключові моменти

- **Mapping у next.config.mjs:** Замість заміни всіх `VITE_` змінних у коді, можна додати секцію `env` у конфігурацію Next.js, яка буде мапити старі назви на нові.
- **Пріоритетність:** Рекомендується використовувати OR-логіку (`process.env.VITE_X || process.env.NEXT_PUBLIC_X`), щоб забезпечити роботу як у локальному середовищі (де можуть бути старі ключі), так і в продакшені (Vercel).
- **Client-side access:** Змінні, прописані в секції `env` конфігураційного файлу, стають доступними на клієнті, навіть якщо вони не мають префікса `NEXT_PUBLIC_` у самому системному оточенні (хоча краще дотримуватися стандартів).

## Sources

- [[daily/2026-04-17.md]] - Рішення для ініціалізації Supabase у Next.js.
