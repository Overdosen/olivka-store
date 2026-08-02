-- 1. Увімкнення розширення pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Додавання колонки embedding (384 виміри для моделей типу all-MiniLM-L6-v2 / bge-small)
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(384);

-- 3. Створення HNSW індексу для ультра-швидкого векторного пошуку
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
ON products USING hnsw (embedding vector_cosine_ops);

-- 4. Створення RPC функції пошуку товарів за косинусною схожістю
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.25,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id text,
  name text,
  price numeric,
  sale_price numeric,
  images jsonb,
  slug text,
  is_published boolean,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.price,
    p.sale_price,
    p.images,
    p.slug,
    p.is_published,
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM products p
  WHERE p.is_published = true
    AND p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
