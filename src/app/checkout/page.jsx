import CheckoutClient from './CheckoutClient';

export const metadata = {
  title: 'Оформлення замовлення',
  description: 'Оформіть замовлення в Store Olivka — безпечна оплата, швидка доставка Новою Поштою та Укрпоштою.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: '/checkout',
  },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
