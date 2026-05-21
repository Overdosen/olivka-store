---
title: "Dynamic COGS & Capital Stock Valuation"
aliases: [cogs-valuation, stock-capital, financial-metrics]
tags: [admin, dashboard, finance, cogs, inventory, supabase]
sources:
  - "daily/2026-05-17.md"
created: 2026-05-17
updated: 2026-05-17
---

# Dynamic COGS & Capital Stock Valuation

Ця стаття описує методологію розрахунку динамічної собівартості проданих товарів (COGS) та оцінки оборотного капіталу складу в Olivka Store.

## Key Points

- **Фіксація ціни закупівлі при покупці**: Інтеграція поля `cost_price` у JSON-структуру позицій замовлення при оформленні кошика. Це захищає історичні звіти від спотворень при зміні собівартості товарів у майбутньому.
- **Двокомпонентний облік Витрат**: Розділення картки «Витрати» на дві складові: собівартість проданих товарів (COGS) та вартість пакування, з можливістю детального перегляду під основним показником.
- **Оцінка капіталу складу (Inventory Value)**: Динамічний розрахунок загальної вартості закупівлі всіх товарів на складі з урахуванням індивідуальних цін закупівлі для кожного розміру (з JSON масиву `sizes`).
- **Трьохрівневий Fallback-алгоритм собівартості**: Резервна схема пошуку собівартості для історичних замовлень (до оновлення кошика), яка спочатку шукає ціну закупівлі конкретного купленого розміру, потім загальну ціну товару і повертає нуль лише у крайньому випадку.

## Details

### Схема збереження при оформленні замовлення
Для забезпечення абсолютної точності фінансових звітів, під час чекауту в [CheckoutClient.jsx](file:///d:/Overdose/Важно/Olivka_store/src/app/checkout/CheckoutClient.jsx) собівартість фіксується у момент транзакції:
```javascript
const itemsWithCost = cart.map(item => {
  let costPrice = item.cost_price || 0;
  // Якщо товар має розмір, шукаємо індивідуальну ціну закупівлі розміру
  if (item.selectedSize && item.sizes) {
    const sizeObj = item.sizes.find(s => s.size === item.selectedSize);
    if (sizeObj && sizeObj.cost_price !== undefined) {
      costPrice = sizeObj.cost_price;
    }
  }
  return {
    ...item,
    cost_price: costPrice
  };
});
```

### Динамічний розрахунок капіталу складу
Оборотний капітал складу рахується в [page.jsx (admin)](file:///d:/Overdose/Важно/Olivka_store/src/app/admin/page.jsx) на основі актуальних залишків:
```javascript
const totalStockValue = stockData.reduce((acc, product) => {
  if (product.sizes && product.sizes.length > 0) {
    const sizesSum = product.sizes.reduce((sum, s) => {
      const qty = Number(s.quantity || 0);
      const cost = Number(s.cost_price !== undefined ? s.cost_price : product.cost_price || 0);
      return sum + (qty * cost);
    }, 0);
    return acc + sizesSum;
  } else {
    const qty = Number(product.quantity || 0);
    const cost = Number(product.cost_price || 0);
    return acc + (qty * cost);
  }
}, 0);
```

## Related Concepts

- [[concepts/database-schema]] — Схема бази даних Supabase та структури JSON-полів.
- [[concepts/order-flow]] — Процеси чекауту та обробки кошика.

## Sources

- [[daily/2026-05-17.md]] — Реалізовано динамічний прорахунок собівартості COGS та капіталу складу з підтримкою розмірів.
