---
title: "Інтеграція LiqPay"
aliases: [liqpay-setup, payment-integration]
tags: [payment, api, backend]
sources:
  - "daily/2026-04-12.md"
created: 2026-04-12
updated: 2026-04-12
---

# Інтеграція LiqPay

Система оплати LiqPay впроваджена як основний метод онлайн-оплати для Olivka Store.

## Ключові моменти

- **Підготовка (Prepare)**: Ендпоінт `/api/payment/prepare-liqpay` генерує `data` та `signature` на сервері для безпечного відправлення форми.
- **Callback (Webhook)**: Ендпоінт `/api/payment/liqpay-callback` обробляє відповіді від LiqPay. Він верифікує підпис перед оновленням статусу замовлення.
- **Статуси**: Присвоює статус `paid` після успішного підтвердження транзакції.

## Деталі

Логіка списання товару була винесена з Callback-ендпоінту безпосередньо в базу даних через PostgreSQL тригери, щоб уникнути конфліктів при ручних змінах адміністратором.

## Пов'язані концепти

- [[concepts/inventory-automation-triggers]] — як списання товару пов'язане з оплатою.
- [[concepts/supabase-realtime-orders]] — як клієнт дізнається про завершення оплати.
