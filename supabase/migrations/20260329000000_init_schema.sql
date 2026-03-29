-- Create Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    is_new BOOLEAN DEFAULT false,
    details JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create Policies for public read access
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public Read All'
    ) THEN
        CREATE POLICY "Public Read All" ON public.categories FOR SELECT TO public USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Public Read All'
    ) THEN
        CREATE POLICY "Public Read All" ON public.products FOR SELECT TO public USING (true);
    END IF;
END
$$;
