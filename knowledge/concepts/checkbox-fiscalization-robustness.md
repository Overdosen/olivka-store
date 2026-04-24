---
title: "Checkbox Fiscalization Robustness"
tags: [checkbox, api, fiscalization, logic]
sources:
  - "daily/2026-04-17.md"
created: 2026-04-17
updated: 2026-04-17
---

# Checkbox Fiscalization Robustness

Патерн надійної фіскалізації для Next.js API Routes, розгорнутих на Vercel.

## Ключові моменти

- **Керування таймаутами:** На плані Vercel Hobby ліміт виконання функції становить 10 секунд. Оскільки Checkbox може відповідати довго, необхідно використовувати обгортку `withTimeout` (наприклад, 8 секунд) для контрольованого завершення запиту.
- **Гарантований запис у БД:** Навіть якщо фіскалізація завершилася помилкою або таймаутом, результат ПОВИНЕН бути записаний у таблицю `orders`. Це запобігає повторним спробам фіскалізації вже оплачених замовлень та дає чіткий діагностичний слід.
- **Маркери помилок:** Замість запису `null` у поле `fiscal_receipt_id`, використовуються текстові маркери:
  - `ERROR_TIMEOUT`: Сервіс не відповів вчасно.
  - `ERROR_API`: Помилка валідації або внутрішня помилка сервісу.
  - `ERROR_EMPTY`: Сервіс відповів, але не повернув ID чека.

## Код-патерн

```javascript
const receipt = await withTimeout(
  checkboxService.createReceipt(orderData),
  8000,
  'CHECKBOX_TIMEOUT'
);
```

## Sources

- [[daily/2026-04-17.md]] - Рефакторинг liqpay-callback для Store Olivka.
