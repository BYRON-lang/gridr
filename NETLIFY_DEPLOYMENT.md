# 🚀 Netlify Deployment Guide

This guide will help you deploy your Qwik application to Netlify.

## Prerequisites

1. Netlify account (sign up at [netlify.com](https://www.netlify.com/))
2. Netlify CLI installed (optional, for local testing)

## Deployment Options

### Option 1: Netlify UI (Recommended)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**: Add any required environment variables in the Netlify dashboard

### Option 2: Netlify CLI

1. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy to production:
   ```bash
   npm run deploy
   ```

### Option 3: Git-based Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect your repository to Netlify
3. Netlify will automatically detect the Qwik project and set up the build settings

## Environment Variables

Set the following environment variables in your Netlify site settings:

- `NODE_VERSION`: 18 (or your preferred Node.js version)
- Any other environment variables your app needs

## Custom Domains

1. Go to your site settings in the Netlify dashboard
2. Navigate to "Domain management"
3. Add your custom domain and follow the verification steps

## Build Settings

The `netlify.toml` file contains the following configuration:

- Build command: `npm run build`
- Publish directory: `dist`
- Redirects all routes to `index.html` for client-side routing
- Sets cache headers for assets

## Troubleshooting

- If you get build errors, check the build logs in the Netlify dashboard
- Ensure all required environment variables are set
- Make sure your `dist` directory contains the built files

## Continuous Deployment

Netlify will automatically deploy new commits to your connected repository. You can configure branch and build settings in the Netlify dashboard.
