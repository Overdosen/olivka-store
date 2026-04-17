---
title: "Vercel Deployment Protection & Secret Leaks"
tags: [security, vercel, infrastructure]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-17
updated: 2026-04-17
---

# Vercel Deployment Protection & Secret Leaks

Коли у публічний репозиторій GitHub потрапляють секретні ключі (наприклад, `.env` файл), Vercel автоматично активує захист деплою.

## Ключові моменти

- **Автоматичне блокування:** Навіть якщо в налаштуваннях `Deployment Protection` вказано "Disabled", Vercel може примусово вимагати авторизацію (Vercel Authentication) для захисту скомпрометованих даних.
- **Ознаки проблеми:** Сайт редіректить на сторінку логіну Vercel, а в URL з'являються параметри `next=.../_vercel/insights/view`.
- **Вирішення:** 
  - Видалення секретів з історії Git (за допомогою `git filter-repo` або BFG, хоча простого видалення файлу в новому коміті може бути достатньо для "чистих" деплоїв).
  - Додавання всіх необхідних змінних у панель керування Vercel (Dashboard -> Environment Variables).
  - Виконання **Redeploy** останнього коміту.

## Пов'язані концепції

- [[concepts/nextjs-env-variable-mapping]] - Як забезпечити роботу коду без локального .env файлу.

## Sources

- [[daily/2026-04-17.md]] - Інцидент з витоком .env та його вирішення.
