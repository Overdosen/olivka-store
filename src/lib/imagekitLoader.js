export default function imageKitLoader({ src, width, quality }) {
  if (src[0] === "/") src = src.slice(1);
  const params = [`w-${width}`];
  if (quality) {
    params.push(`q-${quality}`);
  }
  const paramsString = params.join(",");
  const urlEndpoint = "https://ik.imagekit.io/Overdose";

  // Якщо це повний URL від Supabase
  const supabaseDomain = "whmsyhshgvuhfqwyguft.supabase.co";
  
  if (src.includes(supabaseDomain)) {
    // Витягуємо шлях після домену, наприклад /storage/v1/object/public/product-images/123.jpg
    const path = src.split(supabaseDomain)[1]; 
    // Прибираємо перший слеш, якщо він є, щоб уникнути подвійних слешів в URL ImageKit
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `${urlEndpoint}/${cleanPath}?tr=${paramsString}`;
  }

  // Якщо це локальна картинка або з іншого джерела, віддаємо як є
  return src;
}
