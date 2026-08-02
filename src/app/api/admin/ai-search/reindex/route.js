import { NextResponse } from 'next/server';
import { supabaseService, supabase } from '../../../../../lib/supabase';
import { getEmbedding } from '../../../../../lib/embeddings';

const dbClient = supabaseService || supabase;

export async function POST() {
  try {
    // 1. Fetch all products with categories and metadata
    const { data: products, error: fetchErr } = await dbClient
      .from('products')
      .select('id, name, description, material, color, gender, sizes, category_id, categories(name)');

    if (fetchErr) {
      console.error('[AI Search Reindex] Error fetching products:', fetchErr);
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, message: 'Немає товарів для індексації', count: 0 });
    }

    // 2. Fetch all product_components to link готове рішення (bundles) with component names
    const bundleComponentsMap = new Map();
    try {
      const { data: componentsData } = await dbClient
        .from('product_components')
        .select('bundle_id, component_id');

      if (componentsData && componentsData.length > 0) {
        // Collect component product IDs
        const componentIds = [...new Set(componentsData.map(c => c.component_id))];
        const { data: compProducts } = await dbClient
          .from('products')
          .select('id, name')
          .in('id', componentIds);

        const compNameMap = new Map((compProducts || []).map(p => [p.id, p.name]));

        for (const row of componentsData) {
          const compName = compNameMap.get(row.component_id);
          if (compName) {
            if (!bundleComponentsMap.has(row.bundle_id)) {
              bundleComponentsMap.set(row.bundle_id, []);
            }
            bundleComponentsMap.get(row.bundle_id).push(compName);
          }
        }
      }
    } catch (compErr) {
      console.error('[AI Search Reindex] Warning fetching product_components:', compErr);
    }

    let indexedCount = 0;

    // 3. Loop & generate clean, rich embeddings
    for (const prod of products) {
      const categoryName = prod.categories?.name || '';
      const materialText = Array.isArray(prod.material) ? prod.material.join(', ') : (prod.material || '');
      const colorText = Array.isArray(prod.color) ? prod.color.join(', ') : (typeof prod.color === 'string' ? prod.color : '');
      const genderText = prod.gender === 'boy' ? 'для хлопчика' : (prod.gender === 'girl' ? 'для дівчинки' : (prod.gender || ''));
      const sizesText = Array.isArray(prod.sizes) ? prod.sizes.join(', ') : (typeof prod.sizes === 'string' ? prod.sizes : '');

      const compNames = bundleComponentsMap.get(prod.id) || [];
      const componentsText = compNames.length > 0 ? ` Склад готового рішення / набору: ${compNames.join(', ')}.` : '';

      // Rich, structured text representation
      const textToEmbed = `${prod.name}. ${categoryName ? 'Категорія: ' + categoryName + '. ' : ''}${colorText ? 'Колір: ' + colorText + '. ' : ''}${genderText ? 'Стать: ' + genderText + '. ' : ''}${sizesText ? 'Розміри: ' + sizesText + '. ' : ''}${materialText ? 'Матеріал: ' + materialText + '. ' : ''}${prod.description || ''}${componentsText}`.trim();

      const embedding = await getEmbedding(textToEmbed);

      if (embedding && Array.isArray(embedding)) {
        const { error: updateErr } = await dbClient
          .from('products')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', prod.id);

        if (updateErr) {
          console.error(`[AI Search Reindex] Error updating product ${prod.id}:`, updateErr);
        } else {
          indexedCount++;
        }
      }
    }

    // 4. Update global_settings for ai_search_settings
    const { data: existingSettings } = await dbClient
      .from('global_settings')
      .select('value')
      .eq('id', 'ai_search_settings')
      .single();

    let currentVal = { enabled: true };
    if (existingSettings?.value) {
      try {
        currentVal = typeof existingSettings.value === 'string'
          ? JSON.parse(existingSettings.value)
          : existingSettings.value;
      } catch (e) {}
    }

    const updatedVal = {
      ...currentVal,
      enabled: currentVal.enabled !== undefined ? currentVal.enabled : true,
      indexed_count: indexedCount,
      total_count: products.length,
      last_indexed_at: new Date().toISOString(),
    };

    await dbClient.from('global_settings').upsert({
      id: 'ai_search_settings',
      value: JSON.stringify(updatedVal),
    });

    return NextResponse.json({
      success: true,
      indexedCount,
      totalCount: products.length,
      lastIndexedAt: updatedVal.last_indexed_at,
    });
  } catch (err) {
    console.error('[AI Search Reindex] Server error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
