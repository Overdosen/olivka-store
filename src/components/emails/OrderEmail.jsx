/**
 * Покращений генератор HTML-шаблону для листів замовлень Store Olivka.
 */
export const getOrderEmailHtml = (order) => {
  const { 
    order_number, 
    full_name, 
    items = [], 
    total, 
    payment_method, 
    delivery_method, 
    address, 
    phone,
    email 
  } = order;

  const brandColor = '#524f25';
  const secondaryColor = '#c4a882';
  const bgColor = '#fdfcf7';
  const textColor = '#333333';

  // Визначаємо базовий URL для зображень (працює і локально, і на сервері)
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_BASE_URL || 'https://olivka.store');

  // Форматування способу доставки
  const getDeliveryLabel = (method) => {
    switch(method) {
      case 'nova_poshta': return 'Нова Пошта (Відділення/Поштомат)';
      case 'ukr_poshta': return 'Укрпошта';
      case 'pickup': return 'Самовивіз';
      default: return method;
    }
  };

  // Логіка для блоку оплати
  let paymentInfo = '';
  if (payment_method === 'liqpay') {
    paymentInfo = `
      <div style="background-color: #f6f8f1; padding: 24px; border-radius: 12px; border: 1px solid rgba(82, 79, 37, 0.1); margin-bottom: 30px; text-align: center;">
        <p style="margin: 0; color: ${brandColor}; font-weight: bold; font-size: 18px;">✅ Оплата отримана</p>
        <p style="margin: 8px 0 0; color: #666; font-size: 14px; line-height: 1.5;">Ваше замовлення успішно оплачено та передано на склад для пакування.</p>
      </div>
    `;
  } else if (payment_method === 'iban') {
    paymentInfo = `
      <div style="background-color: #fffdf5; padding: 24px; border-radius: 12px; border: 1px solid ${secondaryColor}; margin-bottom: 30px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="display: inline-block; background-color: ${brandColor}; color: white; padding: 6px 16px; border-radius: 50px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
            Чекаємо на оплату (100%)
          </span>
        </div>
        <p style="margin: 0 0 16px; color: #666; font-size: 14px; text-align: center;">Будь ласка, здійсніть оплату за реквізитами:</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px dashed ${secondaryColor};">
          <table style="width: 100%; font-size: 13px; color: ${textColor}; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #888; width: 100px;">Отримувач:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">ФОП Сопіна Вікторія Іванівна</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">ЄДРПОУ:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">3522303066</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">Банк:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">АТ КБ "ПРИВАТБАНК"</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">IBAN:</td><td style="padding: 5px 0; text-align: right; font-weight: 600; font-family: monospace; letter-spacing: 0.5px;">UA203052990000026002043900812</td></tr>
            <tr><td style="padding: 10px 0 0; color: #888; border-top: 1px solid #f0f0f0;">До сплати:</td><td style="padding: 10px 0 0; text-align: right; font-weight: bold; font-size: 16px; color: ${brandColor};">${total} грн</td></tr>
          </table>
        </div>
        <div style="margin: 15px 0 0; padding: 12px; background-color: #f9f7f0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: ${brandColor}; line-height: 1.6;">
            <strong>У призначенні обов'язково вкажіть:</strong><br>
            <span style="font-size: 15px;"><strong>«Сплата за товар»</strong> та ваше прізвище або номер замовлення <strong>${order_number}</strong>.</span><br>
            <span style="font-size: 11px; color: #9a866a;">*Будь ласка, враховуйте комісію банку при переказі.</span>
          </p>
        </div>
      </div>
    `;
  } else if (payment_method === 'cash_on_delivery') {
    paymentInfo = `
      <div style="background-color: #fffdf5; padding: 24px; border-radius: 12px; border: 1px solid ${secondaryColor}; margin-bottom: 30px;">
        <div style="text-align: center; margin-bottom: 15px;">
          <span style="display: inline-block; background-color: #9a866a; color: white; padding: 6px 16px; border-radius: 50px; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
            ПІСЛЯПЛАТА
          </span>
        </div>
        <p style="margin: 0 0 16px; color: #666; font-size: 14px; text-align: center;">Для підтвердження замовлення внесіть аванс 150 грн:</p>
        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px dashed ${secondaryColor};">
          <table style="width: 100%; font-size: 13px; color: ${textColor}; border-collapse: collapse;">
            <tr><td style="padding: 5px 0; color: #888; width: 100px;">Отримувач:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">ФОП Сопіна Вікторія Іванівна</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">ЄДРПОУ:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">3522303066</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">Банк:</td><td style="padding: 5px 0; text-align: right; font-weight: 600;">АТ КБ "ПРИВАТБАНК"</td></tr>
            <tr><td style="padding: 5px 0; color: #888;">IBAN для авансу:</td><td style="padding: 5px 0; text-align: right; font-weight: 600; font-family: monospace;">UA203052990000026002043900812</td></tr>
            <tr><td style="padding: 8px 0; color: #888; border-top: 1px solid #f0f0f0;">Сума авансу:</td><td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${brandColor}; font-size: 15px;">150 грн</td></tr>
            <tr><td style="padding: 8px 0; color: #888; border-top: 1px solid #f0f0f0;">Залишок при отриманні:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; border-top: 1px solid #f0f0f0;">${total - 150} грн</td></tr>
          </table>
        </div>
        <div style="margin: 15px 0 0; padding: 12px; background-color: #f9f7f0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: ${brandColor}; line-height: 1.6;">
            <strong>У призначенні обов'язково вкажіть:</strong><br>
            <span style="font-size: 15px;"><strong>«Сплата за товар»</strong> та вашу фамілію або номер замовлення <strong>${order_number}</strong>.</span><br>
            <span style="font-size: 11px; color: #9a866a;">*Будь ласка, враховуйте комісію банку при переказі.</span>
          </p>
        </div>
      </div>
    `;
  }

  // Генерація рядків товарів
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; width: 80px;">
        <img src="${item.image_url || `${baseUrl}/placeholder-product.png`}" alt="${item.name}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover; border: 1px solid #f0f0f0;">
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid #f0f0f0;">
        <p style="margin: 0; font-weight: bold; color: ${brandColor}; font-size: 14px;">${item.name}</p>
        <div style="margin: 4px 0 0; font-size: 12px; color: #888;">
          ${item.size ? `<span>Розмір: <strong>${item.size}</strong></span>` : ''}
          ${item.sku ? `<span style="margin-left: 10px;">Арт: <strong>${item.sku}</strong></span>` : ''}
        </div>
        <p style="margin: 4px 0 0; font-size: 13px; color: ${textColor};">${item.qty} шт. x ${item.price} грн</p>
      </td>
      <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; text-align: right; vertical-align: middle; font-weight: bold; color: ${brandColor}; font-size: 15px;">
        ${item.price * item.qty} грн
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @media only screen and (max-width: 600px) {
          .container { padding: 10px !important; }
          .content { padding: 20px !important; }
          .header { padding: 30px 10px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${bgColor};">
        <tr>
          <td align="center" style="padding: 20px 0;" class="container">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(82, 79, 37, 0.05);">
              
              <!-- Banner Image -->
              <tr>
                <td style="padding: 0; line-height: 0;">
                  <img src="${baseUrl}/logo-email.png" alt="Store Olivka" style="display: block; width: 100%; height: auto; border: 0;">
                </td>
              </tr>

              <!-- Header Info -->
              <tr>
                <td align="center" style="background-color: #f9f7f0; padding: 30px 20px; border-bottom: 1px solid rgba(82, 79, 37, 0.05);" class="header">
                  <h1 style="margin: 0; color: ${brandColor}; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">Замовлення №${order_number}</h1>
                  <p style="margin: 8px 0 0; color: #9a866a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">Дякуємо за ваш вибір</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="content">
                  <p style="margin: 0 0 25px; color: ${textColor}; font-size: 16px; line-height: 1.6;">
                    Вітаємо, <strong>${full_name}</strong>! <br>
                    Приємно повідомити, що ми успішно отримали ваше замовлення. Ми вже почали його опрацювання та підготовку до відправки.
                  </p>

                  ${paymentInfo}

                  <h2 style="font-size: 18px; color: ${brandColor}; margin: 30px 0 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">Ваші покупки</h2>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse;">
                    ${itemsHtml}
                  </table>

                  <!-- Totals & Info -->
                  <div style="margin-top: 30px; padding: 24px; background-color: #fcfbf9; border-radius: 12px;">
                    <h3 style="margin: 0 0 15px; font-size: 16px; color: ${brandColor}; border-bottom: 1px solid rgba(82, 79, 37, 0.05); padding-bottom: 10px;">Інформація про доставку та оплату</h3>
                    
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; line-height: 1.8;">
                      <tr>
                        <td style="color: #888; padding: 4px 0; width: 120px;">Отримувач:</td>
                        <td style="color: ${textColor}; padding: 4px 0; font-weight: 500;">${full_name}</td>
                      </tr>
                      <tr>
                        <td style="color: #888; padding: 4px 0;">Телефон:</td>
                        <td style="color: ${textColor}; padding: 4px 0; font-weight: 500;">${phone}</td>
                      </tr>
                      <tr>
                        <td style="color: #888; padding: 4px 0;">Доставка:</td>
                        <td style="color: ${textColor}; padding: 4px 0; font-weight: 500;">${getDeliveryLabel(delivery_method)}</td>
                      </tr>
                      <tr>
                        <td style="color: #888; padding: 4px 0;">Адреса:</td>
                        <td style="color: ${textColor}; padding: 4px 0; font-weight: 500;">${address}</td>
                      </tr>
                    </table>

                    <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #ffffff;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="font-size: 18px; font-weight: 700; color: ${brandColor};">Загальна сума:</td>
                          <td style="font-size: 22px; font-weight: 800; color: ${brandColor}; text-align: right;">${total} грн</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 30px;">
                    <p style="color: #999; font-size: 13px; line-height: 1.6; margin: 0;">
                      Маєте запитання? Будемо раді допомогти! <br>
                      Просто <strong>напишіть нам у відповідь на цей лист</strong> — <br>
                      ми завжди на зв'язку та допоможемо з будь-яким питанням.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #faf9f6; padding: 30px; border-top: 1px solid rgba(82, 79, 37, 0.05);">
                  <p style="margin: 0; color: #bbb; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                    Store Olivka &copy; 2026 ❤️ З любов'ю до найменших
                  </p>
                  <div style="margin-top: 15px;">
                    <a href="https://olivka.store" style="color: ${brandColor}; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Магазин</a>
                    <a href="https://olivka.store/catalog" style="color: ${brandColor}; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Каталог</a>
                    <a href="https://www.instagram.com/store.olivka?igsh=cmZpdWp2dXQ2a2F4" style="color: ${brandColor}; text-decoration: none; font-size: 12px; margin: 0 10px; font-weight: 600;">Instagram</a>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
