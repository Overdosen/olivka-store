require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const orphans = JSON.parse(fs.readFileSync('orphans.json', 'utf8'));
  console.log(`Starting deletion of ${orphans.length} files...`);

  // Supabase limits removal to max 100 files per request, so we chunk it
  const chunkSize = 100;
  for (let i = 0; i < orphans.length; i += chunkSize) {
    const chunk = orphans.slice(i, i + chunkSize);
    console.log(`Deleting chunk ${i / chunkSize + 1} (${chunk.length} files)...`);
    
    const { data, error } = await supabase.storage.from('product-images').remove(chunk);
    if (error) {
      console.error('Error deleting chunk:', error);
    } else {
      console.log('Successfully deleted chunk.');
    }
  }

  console.log('Finished deleting all orphaned files.');
}

run().catch(console.error);
