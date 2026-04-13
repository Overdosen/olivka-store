import { supabase } from '../lib/supabase';

export default async function sitemap() {
  const baseUrl = 'https://olivka.store';

  // 1. Статичні сторінки
  const staticPages = [
    '',
    '/catalog',
    '/about',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Отримуємо всі категорії з бази
  const { data: categories } = await supabase.from('categories').select('id');
  const categoryPages = (categories || []).map((cat) => ({
    url: `${baseUrl}/category/${cat.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // 3. Отримуємо всі товари з бази
  const { data: products } = await supabase.from('products').select('id');
  const productPages = (products || []).map((prod) => ({
    url: `${baseUrl}/product/${prod.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
