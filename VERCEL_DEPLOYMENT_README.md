# Deployment to Vercel

Your Qwik project is now configured for Vercel deployment!

## Files Created/Modified:

1. **`adapters/static/vite.config.ts`** - Vercel adapter configuration
2. **`vercel.json`** - Vercel deployment configuration
3. **`package.json`** - Added `@builder.io/qwik-city-static` dependency
4. **`vite.config.ts`** - Updated to use the static adapter

## To Deploy:

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to Vercel:
   - Connect your project to Vercel
   - Vercel will automatically detect the configuration and deploy

## Notes:

- The static adapter generates static HTML files that Vercel can serve
- Make sure your `VITE_APP_URL` environment variable is set in Vercel (or update the origin in the adapter config)
- The build output will be in the `dist` folder

The project is now ready for Vercel deployment!
