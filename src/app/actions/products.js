'use server';

import { supabase, supabaseService } from '../../lib/supabase';

const dbClient = supabaseService || supabase;

export async function searchProductsSemantic({ searchTerm = '', limit = 10 }) {
  try {
    if (!searchTerm || !searchTerm.trim()) return [];

    const qClean = searchTerm.trim();
    const qLower = qClean.toLowerCase();
    const tokens = qLower.split(/\s+/).filter(Boolean);

    // 1. Перевіряємо налаштування AI-пошуку
    const { data: settingRes } = await dbClient
      .from('global_settings')
      .select('value')
      .eq('id', 'ai_search_settings')
      .single();

    let isEnabled = true;
    if (settingRes?.value) {
      try {
        const parsed = typeof settingRes.value === 'string' ? JSON.parse(settingRes.value) : settingRes.value;
        if (parsed.enabled === false) isEnabled = false;
      } catch (e) {}
    }

    // 2. Мапінг кольорів магазину для точного фільтрації у БД
    const colorMapping = {
      'молочний': 'Молочний', 'молочна': 'Молочний', 'молочне': 'Молочний',
      'бежевий': 'Беж/коричневий', 'бежева': 'Беж/коричневий', 'беж': 'Беж/коричневий', 'коричневий': 'Беж/коричневий',
      'рожевий': 'Рожевий/пудра', 'рожева': 'Рожевий/пудра', 'пудра': 'Рожевий/пудра',
      'сірий': 'Сірий', 'сіра': 'Сірий',
      'гірчичний': 'Гірчичний', 'гірчична': 'Гірчичний'
    };

    let targetDbColor = null;
    tokens.forEach(tok => {
      if (colorMapping[tok]) targetDbColor = colorMapping[tok];
    });
    const textTokens = tokens.filter(tok => !colorMapping[tok]);

    // 3. Словник Семантичних Контекстів (для сну, на літо, на зиму, в пологовий)
    const semanticContexts = [
      {
        name: 'sleep',
        matches: ['для сну', 'сон', 'у ліжечко', 'спати'],
        boostKeywords: ['чоловічок', 'кокон', 'піжама', 'спальник', 'інтерлок', 'футер', 'м\'який'],
      },
      {
        name: 'summer',
        matches: ['на літо', 'літній', 'для літа', 'на спеку', 'спека'],
        boostKeywords: ['короткий рукав', 'пісочник', 'муслін', 'перфорація', 'літня капсула', 'боді-маєчка', 'бавовна'],
      },
      {
        name: 'winter',
        matches: ['на зиму', 'зимовий', 'теплий', 'в холод', 'холод'],
        boostKeywords: ['футер', 'махровий', 'трикотаж', 'довгий рукав', 'комбінезон', 'теплий'],
      },
      {
        name: 'maternity',
        matches: ['у пологовий', 'в пологовий', 'на виписку', 'для новонароджених', 'перші речі'],
        boostKeywords: ['пологовий', 'комплект', 'капсула', 'чепчик', '56', 'царапки', 'інтерлок'],
      }
    ];

    const activeContexts = semanticContexts.filter(ctx => ctx.matches.some(m => qLower.includes(m)));

    // 4. Визначення типа товару та правил виключення
    const itemTypeRules = [
      { key: 'боді', keywords: ['боді'], exclude: ['кокон', 'чоловічок', 'ланцюжок', 'прорізувач', 'плед', 'кофта'] },
      { key: 'чоловічок', keywords: ['чоловічок', 'чоловічки'], exclude: ['боді', 'кокон', 'ланцюжок', 'плед'] },
      { key: 'кокон', keywords: ['кокон', 'європелюшка'], exclude: ['боді', 'чоловічок', 'ланцюжок', 'плед'] },
      { key: 'пелюшка', keywords: ['пелюшка', 'пелюшки'], exclude: ['боді', 'чоловічок', 'ланцюжок', 'кофта'] },
      { key: 'плед', keywords: ['плед', 'пледи'], exclude: ['боді', 'чоловічок', 'ланцюжок', 'пустушка', 'прорізувач'] },
      { key: 'шапочка', keywords: ['шапочка', 'чепчик', 'шкарпетки'], exclude: ['боді', 'чоловічок', 'плед'] },
      { key: 'набір', keywords: ['набір', 'бокс', 'капсула', 'комплект', 'готові рішення', 'готове рішення'], exclude: [] },
      { key: 'ланцюжок', keywords: ['ланцюжок', 'пустушка', 'контейнер', 'гризунок', 'прорізувач'], exclude: ['боді', 'чоловічок', 'плед', 'кокон'] },
    ];

    let targetItemType = null;
    for (const rule of itemTypeRules) {
      if (rule.keywords.some(kw => qLower.includes(kw))) {
        targetItemType = rule;
        break;
      }
    }

    // 5. Витягуємо розмір
    const sizeMatch = qLower.match(/\b(56|62|68|74|80|86|92)\b/);
    const targetSize = sizeMatch ? sizeMatch[1] : null;

    // 5. Запит до Supabase: спочатку точна фраза, потім токени
    const exactQueryStr = `%${qClean}%`;
    const { data: exactPhraseResults } = await dbClient
      .from('products')
      .select('id, name, price, image_url, gallery, is_published, category_id, gender, color, sizes, stock')
      .eq('is_published', true)
      .or(`name.ilike.${exactQueryStr},description.ilike.${exactQueryStr}`)
      .limit(limit);

    let query = dbClient
      .from('products')
      .select('id, name, price, image_url, gallery, is_published, category_id, gender, color, sizes, stock')
      .eq('is_published', true);

    if (targetDbColor) {
      if (textTokens.length > 0) {
        query = query.filter('color', 'cs', `["${targetDbColor}"]`);
        const orConditions = textTokens.map(tok => `name.ilike.%${tok}%,description.ilike.%${tok}%`).join(',');
        query = query.or(orConditions);
      } else {
        query = query.or(`color.cs.["${targetDbColor}"],name.ilike.%${qClean}%,description.ilike.%${qClean}%`);
      }
    } else if (textTokens.length > 0) {
      const orConditions = textTokens.map(tok => `name.ilike.%${tok}%,description.ilike.%${tok}%`).join(',');
      query = query.or(orConditions);
    }

    const { data: tokenSqlResults } = await query.limit(limit * 3);
    const sqlResults = [...(exactPhraseResults || []), ...(tokenSqlResults || [])];

    // 6. Мультиязичний векторний пошук (з безпечним окремим try-catch)
    let vectorResults = [];
    if (isEnabled) {
      try {
        const { getEmbedding } = await import('../../lib/embeddings');
        const queryEmbedding = await getEmbedding(qClean);

        if (queryEmbedding && Array.isArray(queryEmbedding)) {
          const { data: rpcData } = await dbClient.rpc('match_products', {
            query_embedding: queryEmbedding,
            match_threshold: 0.35,
            match_count: limit * 2,
          });
          vectorResults = rpcData || [];
        }
      } catch (embErr) {
        console.error('[searchProductsSemantic] Vector embedding fallback to SQL:', embErr);
      }
    }

    // 7. Об'єднання та жорстка фільтрація виключень
    const combinedMap = new Map();
    (sqlResults || []).forEach(p => combinedMap.set(p.id, { ...p, score: 100 }));
    (vectorResults || []).forEach(p => {
      if (!combinedMap.has(p.id)) {
        if (targetDbColor) {
          const colorArr = Array.isArray(p.color) ? p.color : [p.color];
          if (!colorArr.includes(targetDbColor)) return;
        }
        combinedMap.set(p.id, { ...p, score: (p.similarity || 0) * 50 });
      }
    });

    let finalResults = Array.from(combinedMap.values());

    // Фільтрація: тільки товари В НАЯВНОСТІ + виключення невідповідних типів
    finalResults = finalResults.filter(p => {
      if (p.is_published === false) return false;

      // Перевіряємо наявність на складі
      const sizesArr = Array.isArray(p.sizes) ? p.sizes : [];
      if (sizesArr.length > 0) {
        const hasStock = sizesArr.some(s => Number(s.quantity || 0) > 0);
        if (!hasStock) return false;
      } else if (p.stock !== null && p.stock !== undefined) {
        if (Number(p.stock) <= 0) return false;
      }

      // Перевіряємо правила виключення типу товару
      const pNameLower = (p.name || '').toLowerCase();
      if (targetItemType && targetItemType.exclude.length > 0) {
        const isTargetMatch = targetItemType.keywords.some(kw => pNameLower.includes(kw));
        const isExcluded = targetItemType.exclude.some(ex => pNameLower.includes(ex));
        if (isExcluded && !isTargetMatch) return false;
      }
      return true;
    });

    // Смарт-ранжування та бустинг
    finalResults = finalResults.map(p => {
      let boost = 0;
      const pNameLower = (p.name || '').toLowerCase();
      const pDescLower = (p.description || '').toLowerCase();

      // 1. СУПЕР-БУСТ ЗА ПОВНИЙ ТОЧНИЙ ЗБІГ ФРАЗИ У НАЗВІ (+200)
      if (pNameLower.includes(qLower)) {
        boost += 200;
      }
      // 2. СУПЕР-БУСТ ЗА ПОВНИЙ ЗБІГ У ОПИСІ (+100)
      else if (pDescLower.includes(qLower)) {
        boost += 100;
      }
      // 3. Буст за всі токени у назві (+60)
      else if (textTokens.length > 0 && textTokens.every(tok => pNameLower.includes(tok))) {
        boost += 60;
      }

      // Буст типу товару (+40)
      if (targetItemType && targetItemType.keywords.some(kw => pNameLower.includes(kw))) {
        boost += 40;
      }

      // Буст семантичного контексту (для сну, на літо, на зиму, в пологовий) (+50)
      activeContexts.forEach(ctx => {
        const matchesCtx = ctx.boostKeywords.some(kw => pNameLower.includes(kw) || (p.description || '').toLowerCase().includes(kw));
        if (matchesCtx) {
          boost += 50;
        }
      });

      return { ...p, finalScore: (p.score || 0) + boost };
    });

    finalResults.sort((a, b) => b.finalScore - a.finalScore);

    return finalResults.slice(0, limit);
  } catch (error) {
    console.error('searchProductsSemantic error:', error);
    return [];
  }
}


export async function getPaginatedProducts({ page, perPage = 20, searchTerm = '', statusFilter = 'all', categoryFilter = 'all', sortKey = 'created_at', sortDirection = 'desc' }) {
  try {
    let query = dbClient
      .from('products')
      .select(`*, categories (name)`, { count: 'exact' });

    // Filter by status
    if (statusFilter === 'active') {
      query = query.eq('is_published', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_published', false);
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      query = query.eq('category_id', categoryFilter);
    }

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const q = `%${searchTerm.trim()}%`;
      query = query.or(`name.ilike.${q},sku.ilike.${q}`);
    }

    // Sorting
    let finalSortKey = sortKey;
    if (sortKey === 'category') {
      finalSortKey = 'category_id';
    }
    
    // cost_price is special as we sort it by the base column cost_price
    query = query.order(finalSortKey, { ascending: sortDirection === 'asc' });

    // Pagination range
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      products: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('getPaginatedProducts server action error:', error);
    throw error;
  }
}

export async function getSoldProductsStats(soldDateFilter) {
  try {
    let dateLimit = null;
    if (soldDateFilter !== 'all') {
      const now = new Date();
      if (soldDateFilter === 'today') {
        dateLimit = new Date(now.setHours(0, 0, 0, 0));
      } else {
        const days = soldDateFilter === '7d' ? 7 : soldDateFilter === '90d' ? 90 : 30;
        dateLimit = new Date(now.setDate(now.getDate() - days));
      }
    }

    // Fetch orders for the period
    let ordersQuery = dbClient
      .from('orders')
      .select('id, items, status, created_at, order_number');
      
    if (dateLimit) {
      ordersQuery = ordersQuery.gte('created_at', dateLimit.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) throw ordersError;

    // Extract sold product IDs
    const soldProductIds = new Set();
    const validOrders = (orders || []).filter(order => {
      if (['cancelled', 'returned', 'payment_error', 'pending_payment'].includes(order.status)) return false;
      if (!Array.isArray(order.items)) return false;
      return true;
    });

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.product_id || item.id;
        if (prodId) soldProductIds.add(prodId);
      });
    });

    // Fetch details for sold products only
    let productsMap = {};
    if (soldProductIds.size > 0) {
      const { data: products, error: productsError } = await dbClient
        .from('products')
        .select('id, cost_price, sizes, category_id, categories (name)')
        .in('id', Array.from(soldProductIds));

      if (productsError) throw productsError;

      (products || []).forEach(p => {
        productsMap[p.id] = p;
      });
    }

    const getPurchasePrice = (product) => {
      if (!product) return 0;
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        const prices = product.sizes
          .map(s => Number(s.cost_price))
          .filter(p => !isNaN(p) && p > 0);
        if (prices.length > 0) {
          return Math.max(...prices);
        }
      }
      return Number(product.cost_price || 0);
    };

    const soldMap = {};

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const prodId = item.product_id || item.id;
        if (!prodId) return;

        const name = item.name || item.title || 'Без назви';
        const sku = item.sku || '';
        const size = item.size || null;
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);
        const image = item.image_url || '';

        const key = prodId;

        if (!soldMap[key]) {
          const catalogProd = productsMap[prodId];
          const currentCostPrice = catalogProd ? getPurchasePrice(catalogProd) : Number(item.cost_price || 0);

          soldMap[key] = {
            id: prodId,
            name,
            sku,
            image_url: image,
            totalQuantity: 0,
            totalRevenue: 0,
            sizes: {},
            lastSold: order.created_at,
            costPrice: currentCostPrice,
            categoryName: catalogProd?.categories?.name || '',
            categoryId: catalogProd?.category_id || null,
            isDeleted: !catalogProd,
            orders: [],
          };
        }

        const record = soldMap[key];
        record.totalQuantity += qty;
        record.totalRevenue += qty * price;

        if (!record.orders.find(o => o.id === order.id)) {
          record.orders.push({ id: order.id, number: order.order_number });
        }

        const sizeKey = size || 'Без розміру';
        record.sizes[sizeKey] = (record.sizes[sizeKey] || 0) + qty;

        if (new Date(order.created_at) > new Date(record.lastSold)) {
          record.lastSold = order.created_at;
        }
      });
    });

    return Object.values(soldMap);
  } catch (error) {
    console.error('getSoldProductsStats server action error:', error);
    throw error;
  }
}
