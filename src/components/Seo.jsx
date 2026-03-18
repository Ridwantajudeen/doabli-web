import { useEffect } from 'react';

const SITE_URL = 'https://doabli.com';
const DEFAULT_TITLE = 'Doabli - Tasks, Services, and Skilled Work';
const DEFAULT_DESCRIPTION =
  'Doabli connects clients with trusted people for errands, home services, tech and digital work, creative gigs, and more.';
const DEFAULT_IMAGE = '/doabli-home.jpg';

export default function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  schema = [],
}) {
  const canonical = path.startsWith('http') ? path : `${SITE_URL}${path}`;
  const resolvedImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  useEffect(() => {
    const setMeta = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    };

    const setLink = (selector, attrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        document.head.appendChild(el);
      }
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    };

    document.title = title;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: noIndex ? 'noindex, nofollow' : 'index, follow',
    });
    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonical });

    setMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: resolvedImage });

    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: resolvedImage });

    const existing = document.head.querySelectorAll('script[data-seo="jsonld"]');
    existing.forEach((node) => node.remove());

    schema.forEach((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'jsonld');
      script.text = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }, [title, description, canonical, resolvedImage, type, noIndex, schema]);

  return null;
}
