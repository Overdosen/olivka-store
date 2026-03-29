-- Додаємо колонку gallery як масив текстових рядків
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "gallery" text[] DEFAULT '{}'::text[];
