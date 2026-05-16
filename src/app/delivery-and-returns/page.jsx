import Link from 'next/link';

export const metadata = {
  title: "Оплата, доставка та повернення",
  description: "Інформація про способи оплати, умови доставки та правила обміну і повернення товарів у магазині Store Olivka.",
  alternates: {
    canonical: '/delivery-and-returns',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function DeliveryAndReturnsPage() {
  return (
    <main style={{ backgroundColor: '#faf9f6', minHeight: '100vh', paddingBottom: '6rem' }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f2e9 0%, #eae6d8 100%)',
        padding: '6rem 2rem 4rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(82,79,37,0.08)',
      }}>
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(82,79,37,0.45)',
          marginBottom: '1rem',
        }}>
          store.olivka
        </p>
        <h1 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: '#524f25',
          fontWeight: 400,
          marginBottom: '1.5rem',
          lineHeight: 1.2
        }}>
          Оплата, доставка<br className="mobile-only" /> та повернення
        </h1>
        <div style={{
          width: '60px',
          height: '2px',
          backgroundColor: '#c4a882',
          margin: '0 auto',
          opacity: 0.6
        }} />
      </div>

      <div className="container" style={{ marginTop: '4rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          {/* ОПЛАТА */}
          <section>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              color: '#524f25',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ color: '#c4a882' }}>01.</span> ОПЛАТА
            </h2>
            <div style={{ 
              color: 'rgba(82,79,37,0.85)', 
              fontSize: '1.1rem', 
              lineHeight: '1.8',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <p>Ми пропонуємо кілька зручних способів розрахунку, щоб ви могли обрати найкомфортніший для себе:</p>
              
              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Оплата онлайн:</strong>
                <p>Швидка та безпечна оплата карткою Visa/MasterCard, а також через системи Apple Pay або Google Pay безпосередньо на сайті. Безпеку ваших платежів гарантує міжнародний стандарт PCI DSS.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Післяплата з частковою передоплатою:</strong>
                <p>Оплата при отриманні у відділеннях Нової Пошти або Укрпошти. У такому разі вноситься мінімальна передоплата у розмірі 150 грн. Решту суми замовлення ви сплачуєте безпосередньо при отриманні посилки.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Оплата за реквізитами:</strong>
                <p>Оплата через додаток, термінал або в касі будь-якого банку. Після оформлення ми надішлемо реквізити на вашу електронну адресу. Будь ласка, повідомте нас після здійснення платежу.</p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(82,79,37,0.08)' }} />

          {/* ДОСТАВКА */}
          <section>
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              color: '#524f25',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ color: '#c4a882' }}>02.</span> ДОСТАВКА
            </h2>
            <div style={{ 
              color: 'rgba(82,79,37,0.85)', 
              fontSize: '1.1rem', 
              lineHeight: '1.8',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <p>Ми цінуємо ваш час і дбаємо про те, щоб замовлення потрапило до вас якнайшвидше:</p>
              
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#c4a882', marginTop: '4px' }}>•</span>
                  <span><strong>Нова Пошта:</strong> Швидка доставка по Україні (1-2 робочих дні).</span>
                </li>
                <li style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#c4a882', marginTop: '4px' }}>•</span>
                  <span><strong>Укрпошта:</strong> Надійна доставка по Україні (3-4 дні).</span>
                </li>
              </ul>

              <div style={{ 
                backgroundColor: '#f5f2ea', 
                padding: '1.5rem', 
                borderRadius: '1rem',
                borderLeft: '4px solid #c4a882'
              }}>
                <p>Відправлення замовлень, оплачених до 17:00, здійснюється в день замовлення.<br />
                При замовленні на суму від <strong>2500 грн</strong> доставка здійснюється за наш рахунок.</p>
              </div>

              <p><strong>Важливо:</strong> При оформленні замовлення вказуйте повне ПІБ, актуальний номер телефону та точну адресу або номер відділення. Одразу після відправки ми надішлемо вам номер ТТН для відстеження посилки.</p>
            </div>
          </section>

          <div style={{ height: '1px', width: '100%', backgroundColor: 'rgba(82,79,37,0.08)' }} />

          {/* ОБМІН ТА ПОВЕРНЕННЯ */}
          <section id="returns">
            <h2 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              color: '#524f25',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ color: '#c4a882' }}>03.</span> ОБМІН ТА ПОВЕРНЕННЯ
            </h2>
            <div style={{ 
              color: 'rgba(82,79,37,0.85)', 
              fontSize: '1.1rem', 
              lineHeight: '1.8',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <p>Ми прагнемо, щоб кожна покупка приносила вам радість, тому передбачили прості та прозорі умови повернення:</p>
              
              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Термін:</strong>
                <p>Ви можете обміняти або повернути товар протягом 14 календарних днів з моменту отримання.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Умови:</strong>
                <p>Товар приймається лише у разі збереження його товарного вигляду: він не повинен бути у вжитку, мати слідів використання (плями, запахи), з обов'язковою наявністю всіх ярликів та цілісної оригінальної упаковки. Вироби, що пройшли прання, поверненню не підлягають.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Обмеження:</strong>
                <p>Згідно із законодавством, товари для немовлят, натільна білизна (боді, чоловічки, розпашонки, піжами) та панчішно-шкарпеткові вироби належної якості не підлягають обміну та поверненню з міркувань безпеки та гігієни.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Виробничий брак:</strong>
                <p>Будь ласка, перевіряйте замовлення при отриманні у присутності представника служби доставки. У разі виявлення браку або невідповідності замовленню в момент огляду, ви маєте право відмовитися від посилки — у такому випадку всі витрати на логістику та заміну товару ми беремо на себе.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Логістика:</strong>
                <p>Витрати на доставку товару належної якості для обміну чи повернення оплачує Покупець. Відправлення має бути оформлене без післяплати.</p>
              </div>

              <div>
                <strong style={{ color: '#524f25', display: 'block', marginBottom: '0.5rem' }}>Повернення коштів:</strong>
                <p>Ми опрацьовуємо запит та повертаємо кошти протягом двох робочих днів після отримання та перевірки товару на складі.</p>
              </div>
            </div>
          </section>

          {/* Footer Back Link */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link 
              href="/about" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#c4a882',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                borderBottom: '1px solid #c4a882'
              }}
            >
              Дізнатися більше про нас
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
