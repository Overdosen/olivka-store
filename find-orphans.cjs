require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: products } = await supabase.from('products').select('image_url, gallery');
  
  let usedUrls = new Set();
  
  for (let p of products || []) {
    let urls = [];
    
    // Check main image
    if (p.image_url) {
      if (typeof p.image_url === 'string' && p.image_url.startsWith('[')) {
        try { urls.push(...JSON.parse(p.image_url)); } catch(e) {}
      } else {
        urls.push(p.image_url);
      }
    }
    
    // Check gallery
    if (p.gallery) {
      if (Array.isArray(p.gallery)) {
        urls.push(...p.gallery);
      } else if (typeof p.gallery === 'string') {
        try {
          if (p.gallery.startsWith('[')) {
            urls.push(...JSON.parse(p.gallery));
          } else {
            urls.push(...p.gallery.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')));
          }
        } catch(e) {}
      }
    }
    
    for (let u of urls) {
      if (typeof u === 'string') {
        const parts = u.split('/product-images/');
        if (parts.length > 1) {
          usedUrls.add(parts[1]);
        }
      }
    }
  }
  
  const { data: categories } = await supabase.from('categories').select('image_url');
  for (let c of categories || []) {
    if (!c.image_url) continue;
    const parts = c.image_url.split('/product-images/');
    if (parts.length > 1) {
      usedUrls.add(parts[1]);
    }
  }

  let allFiles = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data: files, error } = await supabase.storage.from('product-images').list('', { limit, offset });
    if (error) {
      console.error(error);
      break;
    }
    if (!files || files.length === 0) break;
    
    allFiles.push(...files);
    offset += limit;
  }
  
  let orphans = [];
  let orphanSize = 0;
  
  for (let f of allFiles) {
    if (f.name === '.emptyFolder') continue;
    if (!usedUrls.has(f.name)) {
      orphans.push(f.name);
      orphanSize += f.metadata?.size || 0;
    }
  }
  
  console.log('Total files in storage:', allFiles.length);
  console.log('Used files count in DB:', usedUrls.size);
  console.log('Orphan files count:', orphans.length);
  console.log('Orphan files total size (MB):', (orphanSize / (1024 * 1024)).toFixed(2));
  
  require('fs').writeFileSync('orphans.json', JSON.stringify(orphans, null, 2));
}

run().catch(console.error);
