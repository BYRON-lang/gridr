import { ALL_CATEGORIES } from '~/services/websiteService';
import { getAllWebsitesForSitemap } from '~/services/websiteService';

// Get the base URL based on the environment
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return 'https://gridrr.com';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://gridrr.com';
  }
  return 'http://localhost:3000';
};

const BASE_URL = getBaseUrl();

// Define static routes with their priorities and change frequencies
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/browse', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { path: '/terms', priority: '0.5', changefreq: 'yearly' },
];

export interface SitemapEntry {
  url: string;
  lastModified: string;
  priority?: string;
  changefreq?: string;
}

export async function generateSitemap(): Promise<SitemapEntry[]> {
  const now = new Date().toISOString();
  
  // Add static routes
  const staticRoutes: SitemapEntry[] = STATIC_ROUTES.map(route => ({
    url: route.path,
    lastModified: now,
    priority: route.priority,
    changefreq: route.changefreq
  }));

  // Add category routes
  const categoryRoutes: SitemapEntry[] = ALL_CATEGORIES.map(category => ({
    url: `/category/${encodeURIComponent(category.toLowerCase())}`,
    lastModified: now,
    priority: '0.8',
    changefreq: 'daily'
  }));

  // Add dynamic website routes
  try {
    const websites = await getAllWebsitesForSitemap();
    const websiteRoutes: SitemapEntry[] = websites.map(website => ({
      url: `/websites/${website.id}`,
      lastModified: website.updatedAt || now,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    // Combine all routes
    return [...staticRoutes, ...categoryRoutes, ...websiteRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return at least the static and category routes if there's an error with dynamic content
    return [...staticRoutes, ...categoryRoutes];
  }
}

export function generateSitemapXml(entries: SitemapEntry[]): string {
  const urlEntries = entries
    .map(({ url, lastModified, priority = '0.8', changefreq = 'weekly' }) => {
      // Ensure URL is properly encoded and doesn't have double slashes
      const cleanUrl = `${url}`.replace(/([^:]\/)\/+/g, '$1');
      
      return `
    <url>
      <loc>${BASE_URL}${cleanUrl.startsWith('/') ? '' : '/'}${cleanUrl}</loc>
      <lastmod>${lastModified}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  ${urlEntries}
</urlset>`;
}
