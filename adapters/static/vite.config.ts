import { staticAdapter } from '@builder.io/qwik-city-static/adapters';

/**
 * @fileoverview Qwik City Vercel adapter configuration
 * This file is used by the build system to configure the Vercel adapter
 */

export default staticAdapter({
  // Configuration options for the static adapter
  // You can customize these based on your needs

  // The directory where the built files should be placed
  // For Vercel, this should be in the root of the project
  distDir: 'dist',

  // Whether to build a SPA (Single Page Application) or static site
  // For Vercel static deployment, set to false
  spa: false,

  // Static paths that should be pre-rendered at build time
  // Add any paths that need to be statically generated
  staticPaths: [],

  // Origins for the static adapter
  // Add your domain here when deploying to production
  origin: process.env.VITE_APP_URL || 'http://localhost:3000',

  // Whether to include a trailing slash in URLs
  trailingSlash: true,

  // Clean URLs (remove .html extensions)
  cleanUrls: true,
});
