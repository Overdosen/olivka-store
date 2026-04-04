import { useEffect } from 'react';

/**
 * SEO component to update document head tags dynamically.
 * @param {Object} props
 * @param {string} props.title - The title of the page
 * @param {string} props.description - The meta description
 * @param {string} props.image - The image URL for OG tags
 * @param {string} props.url - The canonical URL
 * @param {string} props.type - The OG:type (default: 'website')
 * @param {string} props.keywords - Custom keywords for search engines
 */
export default function SEO({ title, description, image, url, type = 'website', keywords }) {
  const siteTitle = 'Store Olivka';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  useEffect(() => {
    // Update Document Title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (selector, content) => {
      if (!content) return;
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        const newTag = document.createElement('meta');
        if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)[1];
          newTag.setAttribute('name', name);
        } else if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)[1];
          newTag.setAttribute('property', property);
        }
        newTag.setAttribute('content', content);
        document.head.appendChild(newTag);
      }
    };

    // Standard Meta Tags
    if (description) {
      updateMetaTag('meta[name="description"]', description);
    }
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', keywords);
    }

    // Open Graph Tags (Facebook, Instagram, Telegram)
    updateMetaTag('meta[property="og:title"]', fullTitle);
    if (description) updateMetaTag('meta[property="og:description"]', description);
    if (image) updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:type"]', type);
    if (url) updateMetaTag('meta[property="og:url"]', url);

    // Twitter Card Tags
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', fullTitle);
    if (description) updateMetaTag('meta[name="twitter:description"]', description);
    if (image) updateMetaTag('meta[name="twitter:image"]', image);

    // Canonical link
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', url);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', url);
        document.head.appendChild(canonical);
      }
    }
  }, [fullTitle, description, image, url, type, keywords]);

  return null; // This component doesn't render anything to the DOM
}
