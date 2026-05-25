/**
 * Утиліта для ручної оптимізації посилань через ImageKit.
 * Використовується там, де технічно неможливо використати компонент <Image> від Next.js
 * (наприклад: email-розсилки або гнучкі повноекранні модалки, де розміри невідомі).
 */
export function getOptimizedUrl(src, width = 800, quality = 80) {
  if (!src || typeof src !== 'string') return src;

  // Якщо це локальний ассет або data URL
  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  const supabaseDomain = "whmsyhshgvuhfqwyguft.supabase.co";
  const urlEndpoint = "https://ik.imagekit.io/Overdose";

  if (src.includes(supabaseDomain)) {
    const path = src.split(supabaseDomain)[1]; 
    if (!path) return src;

    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${urlEndpoint}/${cleanPath}?tr=w-${width},q-${quality}`;
  }

  return src;
}
