export const metadata = {
  title: "Особистий кабінет | Store Olivka",
  description: "Особистий кабінет клієнта",
  robots: {
    index: false,
    follow: false,
  }
};

import AccountClient from './AccountClient';

export default function AccountPage() {
  return <AccountClient />;
}
