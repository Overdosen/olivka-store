-- Migration: create product_components table
-- Used to link 'Готові рішення' bundles to their individual component products.
-- If any component goes out of stock, the bundle is considered unavailable.

CREATE TABLE IF NOT EXISTS product_components (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id     text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_id  text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(bundle_id, component_id)
);

-- Row Level Security
ALTER TABLE product_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY ""Public can read product_components""
  ON product_components FOR SELECT
  USING (true);

CREATE POLICY ""Authenticated can manage product_components""
  ON product_components FOR ALL
  USING (auth.role() = 'authenticated');
