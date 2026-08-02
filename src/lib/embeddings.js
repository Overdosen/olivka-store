import { pipeline, env } from '@xenova/transformers';

// Disable downloading local models when running in restricted environments
env.allowLocalModels = false;

let extractor = null;

export async function getEmbedding(text) {
  try {
    if (!text || typeof text !== 'string') return null;

    if (!extractor) {
      // Use 384-dim Multilingual model (paraphrase-multilingual-MiniLM-L12-v2) for Ukrainian & multilingual support
      extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
    }

    const cleanedText = text.trim().toLowerCase();
    const output = await extractor(cleanedText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error);
    return null;
  }
}
