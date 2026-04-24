---
title: "Realtime-синхронізація замовлень"
aliases: [supabase-realtime, order-sync]
tags: [database, frontend, realtime]
sources:
  - "daily/2026-04-12.md"
created: 2026-04-12
updated: 2026-04-12
---

# Realtime-синхронізація замовлень

Для Store Olivka впроваджено миттєве оновлення інтерфейсу після оплати через технологію Supabase Realtime.

## Ключові моменти

- **Налаштування БД**: Таблиця `orders` додана до публікації `supabase_realtime`.
- **Replica Identity**: Встановлено режим `FULL` (`ALTER TABLE orders REPLICA IDENTITY FULL`), щоб Realtime-повідомлення містили всі дані рядка, а не тільки PK.
- **Фронтенд**: На сторінці `/payment/success` використовується `supabase.channel()` для прослуховування подій `UPDATE` на конкретному `order_id`.

## Деталі

Для надійності впроваджено "Double Check" стратегію:
1. Клієнт миттєво реагує на Realtime-подію.
2. При отриманні події виконується `fetchOrder(true)` для отримання фінального об'єкта.
3. Додано фоновий інтервал (10 сек) як резервний механізм (fallback) на випадок розриву Websocket-з'єднання.

## Пов'язані концепти

- [[concepts/liqpay-integration]] — джерело оновлень статусу.
