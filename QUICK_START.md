# 🚀 Quick Start - Deploy Admin Web Interface

## TL;DR - Deploy in 3 Steps

### Step 1: Build
```bash
npm run build:web
```

### Step 2: Test Locally (Optional)
```bash
npm run serve:web
# Visit http://localhost:3000
```

### Step 3: Deploy to Vercel
```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login (one-time)
vercel login

# Deploy
vercel

# Or use the npm script:
npm run deploy:vercel
```

**That's it!** Your admin dashboard is now live. 🎉

---

## What Just Happened?

1. **Build Process** - Converted your React Native app to a web app using `react-native-web`
2. **Deployment** - Uploaded static files to Vercel's CDN
3. **Live Site** - Your admin dashboard is accessible via URL (e.g., `https://picklepro-mobile.vercel.app`)

---

## Next Steps

### Add Custom Domain (Optional)
1. Go to your Vercel dashboard
2. Click on your project → Settings → Domains
3. Add your domain (e.g., `admin.pickleballhero.app`)
4. Update DNS as instructed
5. SSL certificate is automatic ✅

### Set Environment Variables
If your app needs environment variables in production:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy: `vercel --prod`

### Enable Continuous Deployment
Once deployed, Vercel automatically:
- Monitors your GitHub repository
- Builds and deploys on every push to main
- Creates preview deployments for pull requests

To enable:
1. In Vercel Dashboard, click "Connect Git Repository"
2. Authorize GitHub access
3. Select your repository
4. Done! Future git pushes auto-deploy

---

## Access Your Admin Dashboard

**URL:** The deployment will provide a URL like:
- `https://picklepro-mobile.vercel.app` (Vercel subdomain)
- `https://admin.pickleballhero.app` (your custom domain, if configured)

**Authentication:**
- The app uses your existing Supabase authentication
- Admin users see the dashboard
- Non-admin users see appropriate screens
- Not authenticated → Shows login screen

---

## Alternative: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
npm run deploy:netlify
```

---

## Troubleshooting

### Build fails with "command not found"
```bash
# Make sure you have expo-cli
npm install -g expo-cli

# Or use npx
npx expo export:web
```

### "Module not found" errors during build
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build:web
```

### Site works locally but not in production
- Check browser console for errors
- Verify Supabase URL and keys are correct
- Make sure Supabase allows requests from your deployment domain

### Admin dashboard not showing
- Verify your user has admin privileges in Supabase `users` table
- Check `is_admin` column is set to `true`
- Look at browser console for authentication errors

---

## Support Resources

- 📖 Full Deployment Guide: [ADMIN_WEB_DEPLOYMENT_GUIDE.md](./ADMIN_WEB_DEPLOYMENT_GUIDE.md)
- 🌐 Expo Web Docs: https://docs.expo.dev/workflow/web/
- ⚡ Vercel Docs: https://vercel.com/docs
- 🗄️ Supabase Docs: https://supabase.com/docs

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run build:web` | Build production web version |
| `npm run serve:web` | Test production build locally |
| `npm run deploy:vercel` | Build and deploy to Vercel |
| `npm run deploy:netlify` | Build and deploy to Netlify |
| `npm run web` | Start development server |

---

**Need Help?** Check the full [ADMIN_WEB_DEPLOYMENT_GUIDE.md](./ADMIN_WEB_DEPLOYMENT_GUIDE.md) for detailed instructions and advanced configurations.

