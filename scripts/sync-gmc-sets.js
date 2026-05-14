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
const merchantId = '5774679836';
const connectionId = '69eb73be0fdd4707beb7cb25';
const insertProductActionId = '6976672484c4e21ccc8d65da';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSets() {
  console.log('🚀 Починаємо синхронізацію категорії "Комплекти"...');

  // 1. Отримуємо товари категорії 'sets'
  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name)')
    .eq('category_id', 'sets')
    .eq('is_published', true)
    .gt('stock', 0);

  if (error) {
    console.error('❌ Помилка отримання товарів:', error);
    return;
  }

  console.log(`📦 Знайдено товарів: ${products.length}`);

  for (const product of products) {
    try {
      console.log(`\n🔹 Обробка товару: ${product.name} (арт. ${product.sku || product.id})`);

      // Готуємо дані для GMC
      const gmcProduct = {
        merchantId,
        offerId: product.sku || product.id,
        title: product.name,
        description: product.description || product.name,
        link: `https://olivka.store/product/${product.id}`,
        imageLink: product.image_url,
        contentLanguage: 'uk',
        targetCountry: 'UA',
        channel: 'online',
        brand: 'Store Olivka',
        condition: 'new',
        availability: product.stock > 0 ? 'in stock' : 'out of stock',
        price: {
          value: product.price.toString(),
          currency: 'UAH'
        },
        googleProductCategory: '537', // Apparel & Accessories > Clothing > Baby & Toddler Clothing > Baby & Toddler Outfits
        productTypes: [product.categories?.name || 'Комплекти'],
      };

      // Додаємо галерею
      if (product.gallery && product.gallery.length > 0) {
        gmcProduct.additionalImageLinks = product.gallery;
      }

      // Додаємо колір
      if (product.color && product.color.length > 0) {
        gmcProduct.color = product.color[0];
      }

      // Додаємо матеріал
      if (product.material && product.material.length > 0) {
        gmcProduct.material = product.material[0];
      }

      // Додаємо розмір (тільки один, щоб уникнути помилки "Too many values [size]")
      if (product.sizes && product.sizes.length > 0) {
        gmcProduct.sizes = [product.sizes[0].name];
      }

      // Мапінг статі
      if (product.gender) {
        const genderMap = {
          'Унісекс': 'unisex',
          'Хлопчик': 'male',
          'Дівчинка': 'female'
        };
        gmcProduct.gender = genderMap[product.gender] || 'unisex';
      }

      // Вікова група
      gmcProduct.ageGroup = 'infant'; // Комплекти зазвичай для немовлят/дітей

      // Викликаємо Membrane CLI
      const inputJson = JSON.stringify(gmcProduct).replace(/"/g, '\\"');
      const command = `membrane action run ${insertProductActionId} --connectionId ${connectionId} --input "${inputJson}" --json`;
      
      console.log(`📤 Відправляємо в GMC...`);
      execSync(command);
      console.log(`✅ Успішно завантажено!`);

    } catch (err) {
      console.error(`❌ Помилка завантаження товару ${product.id}:`, err.message);
    }
  }

  console.log('\n✨ Синхронізація завершена!');
}

syncSets();
