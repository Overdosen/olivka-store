-- Увімкнення RLS для global_settings
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Створення політики доступу для авторизованих користувачів
CREATE POLICY "Allow authenticated users all access to global_settings"
ON public.global_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Додавання коментаря до політики
COMMENT ON POLICY "Allow authenticated users all access to global_settings" 
ON public.global_settings 
IS 'Дозволяє авторизованим адміністраторам повний доступ до глобальних налаштувань (блокнота)';
