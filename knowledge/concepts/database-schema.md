---
title: "Схема бази даних"
tags: [database, supabase, technical]
sources:
  - "manual_initial_capture"
created: 2026-04-11
updated: 2026-04-11
---

# Схема бази даних (Supabase)

Дані проекту Store Olivka зберігаються в схемі `public` бази даних PostgreSQL на платформі Supabase.

## Основні таблиці

### 1. [[concepts/products|Продукти (products)]]
Зберігає асортимент товарів, їх ціни, залишки (`stock`) та мета-дані для SEO.

### 2. [[concepts/categories|Категорії (categories)]]
Дерево категорій товарів (наприклад, "для дівчаток", "комплекти").

### 3. [[concepts/order-flow|Замовлення (orders)]]
Зберігає інформацію про покупки:
- Колонку `items` (jsonb) зі знімком товарів.
- Колонку `address` (text) з повною адресою доставки (оновлено 2026-04-11).
- Статус та методи оплати/доставки.

### 4. Профілі (profiles)
Розширення таблиці `auth.users` з додатковим прапором `is_admin`.

## Пов'язані концепти
- [[concepts/architecture-overview]] — Загальний контекст використання БД.
- [[concepts/order-flow]] — Як дані потрапляють у таблицю замовлень.

---
*Джерело: Supabase Dashboard & Codebase Analysis*
