import type { RequestHandler } from '@builder.io/qwik-city';
import { generateSitemap, generateSitemapXml } from '~/utils/sitemap';

export const onGet: RequestHandler = async ({ send, headers }) => {
  const urls = await generateSitemap();
  const sitemap = generateSitemapXml(urls);
  
  headers.set('Content-Type', 'application/xml');
  headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  // Send the response
  send(200, sitemap);
};
