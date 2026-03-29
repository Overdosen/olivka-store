-- Add stock column for general availability
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;

-- Update existing sizes array structure to objects
-- Turn non-empty JSONB arrays of strings like ["S", "M"] into [{"name": "S", "quantity": 0}, {"name": "M", "quantity": 0}]
UPDATE products 
SET sizes = (
  SELECT jsonb_agg(
    jsonb_build_object('name', value#>>'{}', 'quantity', 0)
  )
  FROM jsonb_array_elements(sizes)
)
WHERE jsonb_typeof(sizes) = 'array' 
  AND jsonb_array_length(sizes) > 0 
  AND jsonb_typeof(sizes->0) = 'string';
