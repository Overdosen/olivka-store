import { useState } from 'react';
import { motion } from 'framer-motion';
import InfoModal from '../components/InfoModal';

// Імпорти
import deliveryIcon from '../assets/icons/deliveryandpay.png';
import cottonIcon from '../assets/icons/procotton.png';
import checklistIcon from '../assets/icons/checklist.png';
import consumerIcon from '../assets/icons/consumer.png';
import ofertaIcon from '../assets/icons/oferta.png';
import contactIcon from '../assets/icons/contact.png';

const sections = [
  {
    id: 'oferta',
    icon: ofertaIcon,
    title: "Публічна оферта",
    desc: "Умови надання послуг, права та обов'язки сторін",
    color: '#f5f2ea',
    accent: '#c9c3a0',
    modalType: 'text_file',
    modalSrc: '/docs/offer.txt'
  },
  {
    id: 'consumer',
    icon: consumerIcon,
    title: "Про обробку та оплату персональних даних",
    desc: "Важлива інформація та права для покупців",
    color: '#edf3e9',
    accent: '#9cb691',
    modalType: 'static_text',
    modalSrc: `Інформація про суб'єкта господарювання (Продавця):
Продавець:
Фізична особа-підприємець Сопіна Вікторія Іванівна
Реєстраційний номер облікової картки платника податків 3522303066
Адреса реєстрації: Україна, 84108, Донецька обл., Краматорський р-н, місто Слов'янськ, вулиця Путилівська, будинок 5
Адреса електронної пошти: olivka.hello@gmail.com \ sopinaviktoriia@gmail.com 
Номер телефону: 0950643443
Поточний рахунок: UA203052990000026002043900812`
  },
  {
    id: 'checklist',
    icon: checklistIcon,
    title: "Чек-лист в пологовий",
    desc: "Від пологової зали до виписки. Що взяти з собою - корисний список для майбутніх мам",
    color: '#f0f4fb',
    accent: '#a3b4cf',
    modalType: 'pdf',
    modalSrc: '/docs/checklist.pdf'
  },
  {
    id: 'delivery',
    icon: deliveryIcon,
    title: "Оплата і доставка",
    desc: "Способи оплати, терміни та умови доставки по Україні",
    color: '#fdf1e8',
    accent: '#e0b98a',
    modalType: 'static_text',
    modalSrc: `Інформація про суб'єкта господарювання (Продавця):
Продавець:
Фізична особа-підприємець Сопіна Вікторія Іванівна
Реєстраційний номер облікової картки платника податків 3522303066
Адреса реєстрації: Україна, 84108, Донецька обл., Краматорський р-н, місто Слов'янськ, вулиця Путилівська, будинок 5
Адреса електронної пошти: olivka.hello@gmail.com \ sopinaviktoriia@gmail.com 
Номер телефону: 0950643443
Поточний рахунок: UA203052990000026002043900812
`
  },
  {
    id: 'fabrics',
    icon: cottonIcon,
    title: "Про тканини",
    desc: "Про особливості наших матеріалів",
    color: '#f9f5f0',
    accent: '#c4a882',
    modalType: 'carousel',
    modalSrc: [
      '/images/about/fabrics/1.jpg',
      '/images/about/fabrics/2.jpg',
      '/images/about/fabrics/3.jpg',
      '/images/about/fabrics/4.jpg',
      '/images/about/fabrics/5.jpg',
      '/images/about/fabrics/6.jpg'
    ]
  },
  {
    id: 'contacts',
    icon: contactIcon,
    title: "Контакти",
    desc: "Зв'яжіться з нами — ми завжди на зв'язку",
    color: '#faf5ee',
    accent: '#bab5a0',
    modalType: 'static_text',
    modalSrc: `Ми завжди на зв'язку, щоб допомогти вам із вибором розміру, проконсультувати щодо асортименту або оперативно вирішити будь-яке питання щодо вашого замовлення.
Якщо у вас є зауваження чи пропозиції щодо нашої роботи, ви можете звернутися за електронною адресою, яка вказана.
Instagram: https://www.instagram.com/store.olivka/ 
E-mail: olivka.hello@gmail.com.`
  },
];

export default function AboutPage() {
  const [activeModal, setActiveModal] = useState(null);

  const handleClose = () => setActiveModal(null);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ paddingBottom: '6rem' }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #f5f2e9 0%, #eae6d8 100%)',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        borderBottom: '1px solid rgba(82,79,37,0.08)',
      }}>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(82,79,37,0.45)',
            marginBottom: '1rem',
          }}
        >
          store.olivka
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            color: '#524f25',
            fontWeight: 400,
            marginBottom: '1rem',
          }}
        >
          Про нас
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{
            color: 'rgba(82,79,37,0.55)',
            fontSize: '1rem',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Дізнайтеся більше про наші цінності, сервіс, умови покупок та корисні матеріали, які ми підготували для вашої впевненості у кожному замовленні.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
        }}>
          {sections.map((sec, i) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <button
                type="button"
                onClick={() => setActiveModal(sec)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '2.5rem 2rem',
                  backgroundColor: sec.color,
                  borderRadius: '1.5rem',
                  border: `1px solid ${sec.accent}40`,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  minHeight: '220px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px ${sec.accent}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Декоративне коло */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  backgroundColor: `${sec.accent}15`,
                  pointerEvents: 'none',
                }} />

                {/* Рендеримо іконку */}
                <div style={{ height: '50px', display: 'flex', alignItems: 'center' }}>
                  {typeof sec.icon === 'string' && sec.icon.length < 10 ? (
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{sec.icon}</span>
                  ) : (
                    <img
                      src={sec.icon}
                      alt=""
                      style={{ height: '65px', width: 'auto', objectFit: 'contain' }}
                    />
                  )}
                </div>

                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.3rem',
                    color: '#524f25',
                    fontWeight: 500,
                    marginBottom: '0.6rem',
                  }}>
                    {sec.title}
                  </h2>
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    color: 'rgba(82,79,37,0.65)',
                    lineHeight: 1.55,
                  }}>
                    {sec.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-sans)',
                  color: sec.accent,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  Дізнатись більше
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <InfoModal
        isOpen={!!activeModal}
        onClose={handleClose}
        title={activeModal?.title}
        type={activeModal?.modalType}
        src={activeModal?.modalSrc}
      />
    </motion.main>
  );
}
