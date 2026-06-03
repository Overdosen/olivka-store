-- Розширюємо колонку account_password_hint з VARCHAR(4) до VARCHAR(7)
-- щоб зберігати 7 останніх цифр номера телефону як підказку пароля
ALTER TABLE orders 
  ALTER COLUMN account_password_hint TYPE VARCHAR(7);
