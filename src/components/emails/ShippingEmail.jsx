/**
 * Шаблон для листів про зміну статусу доставки замовлення.
 */
export const getShippingEmailHtml = (order, status) => {
  const { 
    order_number, 
    full_name, 
    tracking_number,
    id
  } = order;

  const brandColor = '#524f25';
  const bgColor = '#fdfcf7';
  const textColor = '#333333';

  // Визначаємо базовий URL для зображень
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_BASE_URL || 'https://olivka.store');

  let statusTitle = 'Ваша посилка прямує до вас!';
  let statusMessage = 'Ми успішно передали ваше замовлення у службу доставки. Незабаром воно буде у вас.';
  let ttnBlock = '';

  if (status === 'shipped') {
    statusTitle = 'Ваша посилка відправлена!';
    statusMessage = 'Ми успішно відправили ваше замовлення. Воно вже в дорозі!';
  } else if (status === 'arrived') {
    statusTitle = 'Посилка прибула у відділення!';
    statusMessage = 'Ваше замовлення вже очікує на вас у відділенні. Не забудьте забрати його найближчим часом.';
  } else if (status === 'delivered') {
    statusTitle = 'Посилку успішно отримано!';
    statusMessage = 'Дякуємо, що забрали своє замовлення! Сподіваємось, вам усе сподобалось.';
  }

  if (tracking_number) {
    ttnBlock = `
      <div style="background-color: #f6f8f1; padding: 24px; border-radius: 12px; border: 1px dashed ${brandColor}; margin: 30px 0; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Номер накладної (ТТН):</p>
        <p style="margin: 10px 0 0; color: ${brandColor}; font-weight: bold; font-size: 24px; font-family: monospace; letter-spacing: 2px;">
          ${tracking_number}
        </p>
      </div>
    `;
  }

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
                  <h1 style="margin: 0; color: ${brandColor}; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">${statusTitle}</h1>
                  <p style="margin: 8px 0 0; color: #9a866a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">Замовлення №${order_number || id.slice(0, 8)}</p>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;" class="content">
                  <p style="margin: 0 0 25px; color: ${textColor}; font-size: 16px; line-height: 1.6;">
                    Вітаємо, <strong>${full_name}</strong>! <br><br>
                    ${statusMessage}
                  </p>

                  ${ttnBlock}

                  <div style="margin-top: 40px; padding: 24px; background-color: #fcfbf9; border-radius: 12px; text-align: center;">
                    <h3 style="margin: 0 0 10px; font-size: 16px; color: ${brandColor};">Будемо раді вашому відгуку!</h3>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                      Ваша думка дуже важлива для нас. Поділіться своїми враженнями від покупки в нашому Instagram, та допоможіть іншим матусям зробити правильний вибір.
                    </p>
                    <a href="https://www.instagram.com/store.olivka?igsh=cmZpdWp2dXQ2a2F4" target="_blank" style="display: inline-block; background-color: #fff; border: 1px solid ${brandColor}; color: ${brandColor}; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Залишити відгук</a>
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
                    Store Olivka &copy; ${new Date().getFullYear()} ❤️ З любов'ю до найменших
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
