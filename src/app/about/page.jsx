export const metadata = {
  title: "Про нас | Store Olivka",
  description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки, публічну оферту та корисні матеріали для мам.",
  openGraph: {
    title: "Про нас | Store Olivka",
    description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки, публічну оферту та корисні матеріали для мам.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Про нас | Store Olivka",
    description: "Дізнайтеся більше про Store Olivka: наші цінності, умови оплати та доставки...",
  }
};

import AboutClient from './AboutClient';

export default function AboutPage() {
  return <AboutClient />;
}
