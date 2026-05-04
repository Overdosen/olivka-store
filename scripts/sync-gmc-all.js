import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Завантаження env змінних
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ───────────────────────────────────────────────
// Ідентифікатори Membrane / GMC
// ───────────────────────────────────────────────
const merchantId         = '5774679836';
const connectionId       = '69eb73be0fdd4707beb7cb25';
const insertProductAction = '6976672484c4e21ccc8d65da'; // Insert/Update (upsert) Product
const deleteProductAction = '6976672484c4e21ccc8d65d6'; // Delete Product

// ───────────────────────────────────────────────
// Категорія Google для ВСІХ товарів
// 182 = Apparel & Accessories > Clothing > Baby & Toddler Clothing
// (Одяг для немовлят)
// ───────────────────────────────────────────────
const GOOGLE_CATEGORY_ID = '182';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Помилка: Відсутні SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY в змінних оточення.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ───────────────────────────────────────────────
// Допоміжна функція: виклик Membrane CLI
// ───────────────────────────────────────────────
function runAction(actionId, inputObj) {
  const inputJson = JSON.stringify(inputObj).replace(/"/g, '\\"');
  const command = `membrane action run ${actionId} --connectionId ${connectionId} --input "${inputJson}" --json`;
  return execSync(command, { encoding: 'utf-8' });
}

// ───────────────────────────────────────────────
// Маппінг статі
// ───────────────────────────────────────────────
const GENDER_MAP = {
  'Унісекс' : 'unisex',
  'Хлопчик' : 'male',
  'Дівчинка': 'female',
};

// ───────────────────────────────────────────────
// Маппінг вікової групи за категорією
// ───────────────────────────────────────────────
function getAgeGroup(categoryId) {
  const newborn = ['swaddles', 'cocoons'];
  return newborn.includes(categoryId) ? 'newborn' : 'infant';
}

// ───────────────────────────────────────────────
// Формування об'єкту товару для GMC
// ───────────────────────────────────────────────
function buildGmcProduct(product) {
  const offerId      = product.sku || product.id;
  const categoryId   = product.categories?.id  || '';
  const categoryName = product.categories?.name || 'Одяг';
  const stock        = product.stock || 0;

  const gmcProduct = {
    merchantId,
    offerId,
    title      : product.name,
    description: product.description || product.name,
    link       : `https://olivka.store/product/${product.id}`,
    imageLink  : product.image_url,
    contentLanguage: 'uk',
    targetCountry  : 'UA',
    channel        : 'online',
    brand          : 'Store Olivka',
    condition      : 'new',
    // ── ГОЛОВНЕ: динамічний статус наявності ──
    availability   : stock > 0 ? 'in stock' : 'out of stock',
    price: {
      value   : product.price.toString(),
      currency: 'UAH',
    },
    // Єдина категорія Google для всіх товарів
    // 182 = Apparel & Accessories > Clothing > Baby & Toddler Clothing
    googleProductCategory: GOOGLE_CATEGORY_ID,
    productTypes: [categoryName],
  };

  // Додаткові зображення з галереї
  if (product.gallery && product.gallery.length > 0) {
    gmcProduct.additionalImageLinks = product.gallery;
  }

  // Колір (перший в масиві)
  if (product.color && product.color.length > 0) {
    gmcProduct.color = product.color[0];
  }

  // Матеріал (перший в масиві)
  if (product.material && product.material.length > 0) {
    gmcProduct.material = product.material[0];
  }

  // Розмір (перший в масиві; Google дозволяє лише один)
  if (product.sizes && product.sizes.length > 0) {
    gmcProduct.sizes = [product.sizes[0].name];
  }

  // Стать
  if (product.gender) {
    gmcProduct.gender = GENDER_MAP[product.gender] || 'unisex';
  }

  // Вікова група
  gmcProduct.ageGroup = getAgeGroup(categoryId);

  return gmcProduct;
}

// ───────────────────────────────────────────────
// ЄДИНИЙ КРОК: Синхронізація ВСІХ опублікованих товарів
// stock > 0  → availability: "in stock"
// stock = 0  → availability: "out of stock"
// ───────────────────────────────────────────────
async function syncAllProducts() {
  console.log('\n📤 Синхронізація ВСІХ товарів з Google Merchant Center...');

  // Отримуємо ВСІ опубліковані товари — незалежно від наявності
  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name, id)')
    .eq('is_published', true);

  if (error) {
    console.error('❌ Помилка отримання товарів:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('ℹ️  Немає опублікованих товарів.');
    return;
  }

  const inStock    = products.filter(p => (p.stock || 0) > 0);
  const outOfStock = products.filter(p => (p.stock || 0) === 0);

  console.log(`📦 Всього опублікованих товарів: ${products.length}`);
  console.log(`   ✅ В наявності:    ${inStock.length}`);
  console.log(`   ❌ Немає в наявності: ${outOfStock.length}`);

  let successCount = 0;
  let errorCount   = 0;

  for (const product of products) {
    const offerId = product.sku || product.id;
    const stock   = product.stock || 0;
    const status  = stock > 0 ? '✅ in stock' : '🔴 out of stock';

    console.log(`\n  🔹 ${product.name} (арт. ${offerId}) — ${status}`);

    try {
      const gmcProduct = buildGmcProduct(product);

      console.log(`  📤 Відправляємо в GMC (availability: ${gmcProduct.availability})...`);
      runAction(insertProductAction, gmcProduct);
      console.log(`  ✅ Успішно оновлено!`);
      successCount++;

    } catch (err) {
      console.error(`  ❌ Помилка (${offerId}):`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Результат: ${successCount} успішно, ${errorCount} помилок.`);
}

// ───────────────────────────────────────────────
// ГОЛОВНА ФУНКЦІЯ
// ───────────────────────────────────────────────
async function main() {
  console.log('🚀 Починаємо нічну синхронізацію з Google Merchant Center...');
  console.log(`📅 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}`);

  await syncAllProducts();

  console.log('\n✨ Синхронізацію завершено!');
}

main();
