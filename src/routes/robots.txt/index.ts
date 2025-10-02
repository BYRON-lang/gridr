import type { RequestHandler } from '@builder.io/qwik-city';

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${import.meta.env.VITE_VERCEL_URL ? `https://${import.meta.env.VITE_VERCEL_URL}/sitemap.xml` : '/sitemap.xml'}
`;

export const onGet: RequestHandler = ({ send, headers }) => {
  headers.set('Content-Type', 'text/plain');
  headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  send(200, robotsTxt);
};
