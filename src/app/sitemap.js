import { supabase } from '../lib/supabase';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://olivka.store';

  // 1. Статичні сторінки
  const staticPages = [
    { route: '', priority: 1, changeFrequency: 'daily' },
    { route: '/catalog', priority: 0.9, changeFrequency: 'daily' },
    { route: '/about', priority: 0.6, changeFrequency: 'monthly' },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // 2. Отримуємо всі категорії з бази (з датою оновлення)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, created_at');

  const categoryPages = (categories || []).map((cat) => ({
    url: `${baseUrl}/category/${cat.id}`,
    lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 3. Отримуємо всі товари z бази (з датою останнього оновлення)
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, created_at')
    .eq('is_published', true);

  const productPages = (products || []).map((prod) => ({
    url: `${baseUrl}/product/${prod.id}`,
    lastModified: prod.updated_at
      ? new Date(prod.updated_at)
      : prod.created_at
        ? new Date(prod.created_at)
        : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
