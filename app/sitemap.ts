import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/demo', '/guides', '/guides/first-stock-watchlist', '/guides/portfolio-tracking-basics', '/privacy']
    .map(path => ({ url: `${SITE_URL}${path === '/' ? '' : path}`, changeFrequency: 'monthly', priority: path === '/' ? 1 : path === '/demo' ? 0.9 : 0.7 }));
}
