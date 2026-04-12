# Структура бази даних (Supabase)

Дані проекту Store Olivka зберігаються в **public** схемі бази даних PostgreSQL (Supabase).

## Таблиці

### 1. `categories` (Категорії)
Зберігає дерево категорій товарів.
- `id` (text, PK): Унікальний ідентифікатор (наприклад: `dlya-malyukiv`).
- `name` (text): Назва категорії українською.
- `sort_order` (int): Вага для сортування (за замовчуванням 99).

### 2. `products` (Товари)
Основна інформація про асортимент.
- `id` (text, PK): Артикул або slug.
- `category_id` (text, FK): Посилання на `categories.id`.
- `name`, `price`, `description`: Базові поля.
- `stock` (int): Залишок на складі.
- `sizes` (jsonb): Список доступних розмірів.
- `details` (jsonb): Технічні характеристики (склад, тощо).
- `gallery` (text[]): Масив посилань на додаткові фото.
- `image_url`: Головне фото.
- `meta_keywords`, `meta_description`: SEO-дані.

### 3. `orders` (Замовлення)
Інформація про покупки.
- `id` (uuid, PK): Автоматично згенерований.
- `user_id` (uuid, FK): Посилання на `auth.users` (необов'язково для гостьових замовлень).
- `status`: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'].
- `items` (jsonb): Масив об'єктів товарів у замовленні на момент покупки.
- `address` (text): Повна адреса доставки (Місто, Область, Відділення).
- `delivery_method`: ['nova_poshta', 'ukrposhta', 'pickup'].
- `payment_method`: ['cash_on_delivery', 'liqpay'].

### 4. `profiles` (Профілі користувачів)
Розширені дані користувачів.
- `id` (uuid, PK): Зв'язок з `auth.users.id`.
- `is_admin` (bool): Права доступу до адмін-панелі.

## Зв'язки
- `products.category_id` -> `categories.id` (RESTRICT)
- `orders.user_id` -> `auth.users.id` (SET NULL)
- `profiles.id` -> `auth.users.id` (CASCADE)

---
*Джерело даних: Supabase Schema. Дата: 2026-04-11*
