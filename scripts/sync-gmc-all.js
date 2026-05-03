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
const insertProductAction = '6976672484c4e21ccc8d65da'; // Insert/Update Product
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
// КРОК 1: Видалити з GMC товари, яких немає в наявності
// ───────────────────────────────────────────────
async function deleteOutOfStockFromGmc() {
  console.log('\n🗑️  Крок 1: Видалення товарів без наявності з GMC...');

  // Отримуємо опубліковані товари із stock = 0
  const { data: outOfStock, error } = await supabase
    .from('products')
    .select('id, sku, name')
    .eq('is_published', true)
    .eq('stock', 0);

  if (error) {
    console.error('❌ Помилка отримання товарів без наявності:', error);
    return;
  }

  if (!outOfStock || outOfStock.length === 0) {
    console.log('✅ Немає товарів для видалення.');
    return;
  }

  console.log(`📦 Знайдено товарів для видалення: ${outOfStock.length}`);

  for (const product of outOfStock) {
    const offerId = product.sku || product.id;
    try {
      console.log(`  🔸 Видаляємо: ${product.name} (offerId: ${offerId})`);
      runAction(deleteProductAction, {
        merchantId,
        productId: `online:uk:UA:${offerId}`,
      });
      console.log(`  ✅ Видалено.`);
    } catch (err) {
      // Якщо товару вже не було в GMC — це не критична помилка
      const msg = err.message || '';
      if (msg.includes('404') || msg.includes('not found') || msg.toLowerCase().includes('does not exist')) {
        console.log(`  ℹ️  Товар вже відсутній у GMC — пропускаємо.`);
      } else {
        console.error(`  ❌ Помилка видалення (${offerId}):`, msg);
      }
    }
  }
}

// ───────────────────────────────────────────────
// КРОК 2: Завантажити / оновити товари з наявністю > 0
// ───────────────────────────────────────────────
async function syncInStockProducts() {
  console.log('\n📤 Крок 2: Синхронізація товарів у наявності з GMC...');

  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name, id)')
    .eq('is_published', true)
    .gt('stock', 0);

  if (error) {
    console.error('❌ Помилка отримання товарів:', error);
    return;
  }

  if (!products || products.length === 0) {
    console.log('ℹ️  Немає товарів у наявності для синхронізації.');
    return;
  }

  console.log(`📦 Знайдено товарів для завантаження: ${products.length}`);

  for (const product of products) {
    const offerId     = product.sku || product.id;
    const categoryId  = product.categories?.id  || '';
    const categoryName = product.categories?.name || 'Одяг';

    console.log(`\n  🔹 Обробка: ${product.name} (арт. ${offerId})`);

    try {
      // ── Формуємо об'єкт товару для GMC ──
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
        availability   : 'in stock',      // stock > 0 — гарантовано в наявності
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

      // ── Відправляємо в GMC ──
      console.log(`  📤 Відправляємо в GMC...`);
      runAction(insertProductAction, gmcProduct);
      console.log(`  ✅ Успішно завантажено!`);

    } catch (err) {
      console.error(`  ❌ Помилка завантаження товару ${offerId}:`, err.message);
    }
  }
}

// ───────────────────────────────────────────────
// ГОЛОВНА ФУНКЦІЯ
// ───────────────────────────────────────────────
async function main() {
  console.log('🚀 Починаємо нічну синхронізацію з Google Merchant Center...');
  console.log(`📅 ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kiev' })}`);

  await deleteOutOfStockFromGmc();
  await syncInStockProducts();

  console.log('\n✨ Синхронізацію завершено!');
}

main();
