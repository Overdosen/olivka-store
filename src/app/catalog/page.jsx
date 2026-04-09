import CatalogClient from './CatalogClient';

export const metadata = {
  title: 'Каталог',
  description: 'Каталог ніжного дитячого одягу. Оберіть категорію: боді, комплекти, текстиль та багато іншого.',
};

export default function CatalogPage() {
  return <CatalogClient />;
}
