require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MAX_SIZE_BYTES = 500 * 1024; // 500 KB limit as requested
const MAX_WIDTH = 1200;

async function run() {
  console.log('Fetching all files from Supabase Storage...');
  let allFiles = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const { data: files, error } = await supabase.storage.from('product-images').list('', { limit, offset });
    if (error) {
      console.error('Error fetching files:', error);
      return;
    }
    if (!files || files.length === 0) break;
    
    allFiles.push(...files);
    offset += limit;
  }
  
  // Filter out directories and small files
  const filesToCompress = allFiles.filter(f => f.name !== '.emptyFolder' && f.metadata?.size > MAX_SIZE_BYTES);
  
  console.log(`Total files in storage: ${allFiles.length}`);
  console.log(`Files to compress (>500KB): ${filesToCompress.length}`);
  
  let totalSavedBytes = 0;
  
  for (let i = 0; i < filesToCompress.length; i++) {
    const file = filesToCompress[i];
    console.log(`[${i+1}/${filesToCompress.length}] Processing ${file.name} (${(file.metadata.size / 1024).toFixed(1)} KB)...`);
    
    try {
      // 1. Download the file
      const { data: fileData, error: downloadError } = await supabase.storage.from('product-images').download(file.name);
      if (downloadError) {
        console.error(`  -> Download error for ${file.name}:`, downloadError);
        continue;
      }
      
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 2. Compress the file using sharp
      const ext = file.name.split('.').pop().toLowerCase();
      let sharpInstance = sharp(buffer).resize({ width: MAX_WIDTH, withoutEnlargement: true });
      
      if (ext === 'png') {
        sharpInstance = sharpInstance.png({ quality: 80, compressionLevel: 8 });
      } else if (ext === 'webp') {
        sharpInstance = sharpInstance.webp({ quality: 80 });
      } else {
        // Default to JPEG for .jpg, .jpeg, etc.
        sharpInstance = sharpInstance.jpeg({ quality: 80, progressive: true });
      }
      
      const compressedBuffer = await sharpInstance.toBuffer();
      
      // 3. Check if it actually became smaller (sometimes already compressed files might get larger)
      if (compressedBuffer.length < buffer.length) {
        const savedBytes = buffer.length - compressedBuffer.length;
        totalSavedBytes += savedBytes;
        
        // 4. Upload back to Supabase, overwriting the original
        const { error: uploadError } = await supabase.storage.from('product-images').upload(file.name, compressedBuffer, {
          cacheControl: '3600',
          upsert: true, // Overwrite!
          contentType: fileData.type
        });
        
        if (uploadError) {
          console.error(`  -> Upload error for ${file.name}:`, uploadError);
        } else {
          console.log(`  -> Success! Compressed to ${(compressedBuffer.length / 1024).toFixed(1)} KB. Saved ${(savedBytes / 1024).toFixed(1)} KB.`);
        }
      } else {
        console.log(`  -> Skipped. Compressed version was not smaller.`);
      }
    } catch (err) {
      console.error(`  -> Failed to process ${file.name}:`, err);
    }
  }
  
  console.log('--------------------------------------------------');
  console.log(`Compression finished! Total space saved: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
}

run().catch(console.error);
