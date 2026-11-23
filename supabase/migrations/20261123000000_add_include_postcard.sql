-- Add include_postcard boolean flag to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS include_postcard BOOLEAN DEFAULT false;
