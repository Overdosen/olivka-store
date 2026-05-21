---
title: "Reviews and Moderation System"
aliases: [reviews-system, crm-reviews]
tags: [database, frontend, crm, security]
sources:
  - "daily/2026-05-18.md"
created: 2026-05-18
updated: 2026-05-18
---

# Reviews and Moderation System

Інтегрована система для збору, модерації та відображення клієнтських відгуків на сайті та в CRM-панелі адміністратора. Система поєднує в собі базу даних Supabase з налаштованою безпекою, інтерактивне клієнтське модальне вікно, динамічне злиття та сортування відгуків на сайті, а також преміальну Apple-style панель модерації в CRM.

## Key Points

- **Безпечна база даних**: Таблиця `public.reviews` у Supabase використовує Row Level Security (RLS) політики, які дозволяють анонімне надсилання (`INSERT`), публічне читання лише схвалених відгуків (`SELECT` з `is_approved = true`) та повний доступ (`ALL`) для адміністраторів.
- **Модальне вікно клієнта**: Компонент `ReviewModal.jsx` має повністю інтерактивну оцінку (1-5 зірок) з мікроанімаціями наведення, валідацією полів та екраном успіху зі слоганом бренду: *"Дякуємо за Ваш відгук 🤎"*.
- **Злиття просторів імен ID**: Для уникнення конфліктів React `key` під час відображення змішаних (статичних `rawReviews` та динамічних з бази) відгуків, усім завантаженим з Supabase відгукам автоматично присвоюється префікс `db-${id}`.
- **Багаторівневе сортування**: Відгуки на головній сторінці сортуються спочатку за ознакою `is_pinned = true` (закріплені йдуть першими), а потім за датою створення `created_at` у зворотному хронологічному порядку.
- **Преміальна CRM-панель**: Сторінка `/admin/reviews` надає повний спектр дій над відгуками: миттєве схвалення (`is_approved`), закріплення у топі ("Вивести першим" / `is_pinned`), швидке редагування автора/оцінки/тексту та безпечне видалення з вікном підтвердження.

## Details

### 1. Структура Таблиці та Безпека (Supabase)
Таблиця `public.reviews` містить наступні поля:
* `id` (bigint, primary key)
* `created_at` (timestamptz, default now())
* `name` (text, not null)
* `email` (text, not null)
* `rating` (integer, check rating between 1 and 5)
* `text` (text, not null)
* `is_approved` (boolean, default false)
* `is_pinned` (boolean, default false)

RLS політики розмежовують доступи без потреби створення окремого API-ендпоінту:
```sql
-- Дозвіл на анонімне створення відгуків (за замовчуванням is_approved = false)
CREATE POLICY "Allow anonymous insert" ON public.reviews FOR INSERT TO anon WITH CHECK (true);

-- Дозвіл на читання схвалених відгуків для всіх
CREATE POLICY "Allow public read approved" ON public.reviews FOR SELECT TO public USING (is_approved = true);

-- Повний доступ для авторизованих адміністраторів
CREATE POLICY "Allow admin all" ON public.reviews FOR ALL TO authenticated USING (true);
```

### 2. Динамічне відображення на Сайті
У компоненті `StoreReviews.jsx` завантажені відгуки поєднуються зі статичним масивом `rawReviews` у `useMemo` блоці:
```javascript
const allReviews = useMemo(() => {
  const dbMapped = dbReviews.map(r => ({
    id: `db-${r.id}`, // Уникнення дублювання React key
    author: r.name,
    rating: r.rating,
    text: r.text,
    created_at: r.created_at,
    is_pinned: r.is_pinned
  }));
  return [...dbMapped, ...rawReviews];
}, [dbReviews]);
```
Динамічно підраховується загальна кількість відгуків у шапці секції (`120 + dbReviews.length`) та автоматично генеруються оновлені структуровані SEO-дані LD+JSON з урахуванням нових відгуків та середньої оцінки.

### 3. CRM Інтерфейс Модерації
Кабінет модерації `/admin/reviews` розроблений відповідно до Apple-style гайдлайнів дизайну:
* **Аналітика**: Верхній ряд містить преміальні картки статистики (Всього відгуків, На модерації, Схвалено, Середній рейтинг).
* **Вкладки швидкої фільтрації**: *Всі*, *На модерації*, *Схвалені*.
* **Інтерактивні дії**:
  1. *Toggle Схвалення*: перемикач `is_approved` з миттєвим оновленням UI.
  2. *Toggle Закріплення*: перемикач `is_pinned` ("Вивести першим").
  3. *Редагування*: модальне вікно для виправлення орфографічних помилок в імені, тексті або коригування рейтингу.
  4. *Видалення*: дія з червоною оксамитовою плашкою підтвердження для захисту від випадкових натискань.

## Related Concepts

- [[concepts/store-reviews-polishing]] - Візуальна стратегія та загальна стилістика відгуків.
- [[concepts/store-olivka-branding]] - Дотримання колірної палітри (#524f25) та фірмового слогану.
- [[concepts/professional-modal-pattern]] - Патерн побудови діалогових вікон для модалу відгуків.

## Sources

- [[daily/2026-05-18.md]] - Повна розробка та впровадження системи відгуків.
