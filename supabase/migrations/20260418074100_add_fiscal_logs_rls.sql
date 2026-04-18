-- Дозвіл на запис у таблицю логів швидкодії для анонімних користувачів
-- (Це необхідно для логування з Edge Functions/API маршрутів, де може бути відсутній Service Role Key)

CREATE POLICY "Anyone can insert performance logs" 
ON public.fiscal_performance_logs 
FOR INSERT 
WITH CHECK (true);

COMMENT ON POLICY "Anyone can insert performance logs" ON public.fiscal_performance_logs IS 'Дозволяє запис метрик швидкодії без авторизації (але читання залишається закритим)';
