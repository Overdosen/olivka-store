---
title: "Resend Email Integration"
aliases: [resend, email-api, contact-form-backend]
tags: [backend, api, nextjs, email]
sources:
  - "daily/2026-04-15.md"
created: 2026-04-15
updated: 2026-04-15
---

# Resend Email Integration

Налаштування відправки електронної пошти через сервіс Resend у середовищі Next.js.

## Key Points

- **API Route**: Використання Route Handlers (`src/app/api/contact/route.js`) для безпечного виконання відправки на стороні сервера.
- **Environment Variables**: API-ключ Resend зберігається в `.env.local` під ключем `RESEND_API_KEY`.
- **Domain Verification**: Для відправки від імені власного домену (напр. `info@olivka.store`) необхідно верифікувати DNS-записи в панелі Resend. До цього моменту використовується системна адреса `onboarding@resend.dev`.
- **Security**: На стороні сервера обов'язково перевіряти наявність всіх полів (name, email, message) перед викликом API.
- **Rate Limiting**: Безплатний рівень Resend має ліміти, які достатні для невеликих магазинів, але потребують моніторингу.

## Details

Приклад реалізації:
\`\`\`javascript
const resend = new Resend(process.env.RESEND_API_KEY);
const { data, error } = await resend.emails.send({
  from: 'Store Olivka <onboarding@resend.dev>',
  to: ['target@email.com'],
  subject: 'Нове повідомлення з сайту',
  replyTo: userEmail,
  html: \`<p><strong>Від:</strong> \${name}</p>...\`
});
\`\`\`

## Related Concepts

- [[concepts/professional-modal-pattern]] - Фронтенд-частина контактної форми.

## Sources

- [[daily/2026-04-15.md]] - Інтеграція для підтримки клієнтів у футері.
