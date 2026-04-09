export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Форматування UA-номера з маскою +38 (___) ___-__-__
 * @param {string} raw - сирий рядок
 * @returns {string} - форматований рядок з маскою
 */
export function formatUaMasked(raw = '') {
  // 1. Витягуємо лише цифри
  let digits = raw.replace(/\D/g, '');
  
  // 2. Обробка префікса +38
  // Оскільки маска завжди містить +38, цифри часто будуть починатися з 38
  if (digits.startsWith('38')) {
    // Якщо користувач ввів повний номер 380... (12 цифр), беремо останні 10
    if (digits.length >= 12 && digits.startsWith('380')) {
      digits = digits.substring(2);
    } else {
      // Інакше вважаємо, що 38 - це префікс маски, і прибираємо його
      digits = digits.substring(2);
    }
  }

  // 3. Обмежуємо до 10 цифр (напр. 0671234567)
  digits = digits.substring(0, 10);
  
  // 4. Накладання маски
  let result = "+38 (";
  
  for (let i = 0; i < 10; i++) {
    if (i === 3) result += ") ";
    if (i === 6) result += "-";
    if (i === 8) result += "-";
    
    if (digits[i]) {
      result += digits[i];
    } else {
      result += "_";
    }
  }
  
  return result;
}

/**
 * Перевірка, чи телефон повністю заповнений (12 цифр разом з 38)
 * @param {string} formatted - рядок з маскою
 */
export function isPhoneFull(formatted) {
  if (!formatted) return false;
  // Рахуємо лише цифри. Для повного номера їх має бути 12 (+38 067 123 45 67)
  const digitsCount = formatted.replace(/\D/g, '').length;
  return digitsCount === 12;
}
