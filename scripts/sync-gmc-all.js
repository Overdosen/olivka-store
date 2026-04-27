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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Помилка: Відсутні SUPABASE_URL або SUPABASE_SERVICE_ROLE_KEY в змінних оточення.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Мапінг категорій Google
const googleCategoryMap = {
  'pants': '540',    // Штанці
  'caps': '548',     // Чепчики, шапочки
  'cap': '541',      // Пісочники, ромпери
  'swaddles': '576', // Текстиль (пелюшки, пледи)
  'socks': '545',    // Шкарпетки
  'body': '541',     // Боді
  'suits': '537',    // Костюми, сукні
  'fullset': '537',  // Готові рішення
  'cocoons': '582',  // Кокони
  'men': '541',      // Чоловічки
  'sets': '537'      // Комплекти
};

async function syncAllProducts() {
  console.log('🚀 Починаємо повну синхронізацію товарів з Google Merchant Center...');

  // Отримуємо всі опубліковані товари, що є в наявності
  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(name, id)')
    .eq('is_published', true)
    .gt('stock', 0);

  if (error) {
    console.error('❌ Помилка отримання товарів:', error);
    return;
  }

  console.log(`📦 Знайдено товарів для синхронізації: ${products.length}`);

  for (const product of products) {
    try {
      const categoryId = product.categories?.id;
      const categoryName = product.categories?.name || 'Одяг';
      
      console.log(`\n🔹 Обробка товару: ${product.name} (Категорія: ${categoryName}, арт. ${product.sku || product.id})`);

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
        availability: 'in stock',
        price: {
          value: product.price.toString(),
          currency: 'UAH'
        },
        googleProductCategory: googleCategoryMap[categoryId] || '537',
        productTypes: [categoryName],
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
      gmcProduct.ageGroup = (categoryId === 'swaddles' || categoryId === 'cocoons') ? 'newborn' : 'infant';

      // Викликаємо Membrane CLI
      const inputJson = JSON.stringify(gmcProduct).replace(/"/g, '\\"');
      const command = `membrane action run ${insertProductActionId} --connectionId ${connectionId} --input "${inputJson}" --json`;
      
      console.log(`📤 Відправляємо в GMC...`);
      execSync(command);
      console.log(`✅ Успішно!`);

    } catch (err) {
      console.error(`❌ Помилка завантаження товару ${product.id}:`, err.message);
    }
  }

  console.log('\n✨ Повна синхронізація завершена!');
}

syncAllProducts();
