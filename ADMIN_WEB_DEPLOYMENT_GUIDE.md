# Admin Web Deployment Guide

This guide explains how to deploy your admin dashboard as a standalone web application accessible via URL, without needing to run Expo or use the mobile app.

## Prerequisites

Your app already has:
- ✅ `react-native-web` and `react-dom` installed
- ✅ Web script configured in `package.json`
- ✅ `AdminDashboard.js` with web-compatible code
- ✅ Supabase backend for authentication and data

## Quick Start - Deploy to Vercel (Easiest)

### 1. Build for Web
```bash
npm run web
# OR
npx expo export:web
```

This creates a `dist` folder with your production-ready web files.

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect settings from `vercel.json`
5. Click "Deploy"

Your admin dashboard will be live at: `https://your-project.vercel.app`

### 3. Access Your Admin Dashboard

Navigate to: `https://your-project.vercel.app`

The app will:
- Show authentication screen if not logged in
- Check admin access via Supabase
- Display admin dashboard if user has admin privileges

---

## Alternative Hosting Options

### Option 1: Netlify

**Using Netlify CLI:**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npx expo export:web

# Deploy
netlify deploy --prod --dir=dist
```

**Using Netlify Dashboard:**
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your repository
4. Build settings are auto-configured from `netlify.toml`
5. Deploy

### Option 2: GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "npx expo export:web && gh-pages -d dist"

# Deploy
npm run deploy
```

Your site will be at: `https://yourusername.github.io/Pickleball_Hero`

### Option 3: AWS S3 + CloudFront

```bash
# Build
npx expo export:web

# Install AWS CLI and configure
aws configure

# Create S3 bucket
aws s3 mb s3://picklepro-admin

# Enable static website hosting
aws s3 website s3://picklepro-admin --index-document index.html --error-document index.html

# Upload files
aws s3 sync dist/ s3://picklepro-admin --acl public-read

# Setup CloudFront for HTTPS (recommended)
# Follow AWS CloudFront documentation
```

### Option 4: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Build
npx expo export:web

# Deploy
firebase deploy --only hosting
```

---

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file (if needed):

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Make sure your Supabase config is properly set in `src/lib/supabase.js`.

---

## Custom Domain Setup

### For Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `admin.pickleballhero.app`)
3. Follow DNS configuration instructions
4. Vercel automatically provisions SSL certificate

### For Netlify:
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records
4. SSL is automatic

---

## Security Considerations

### 1. Admin Access Control

Your app already has admin access control via `AdminRoute.js`:
- ✅ Checks authentication via Supabase
- ✅ Verifies admin role before showing dashboard
- ✅ Protected routes

### 2. Row Level Security (RLS)

Ensure Supabase has proper RLS policies:
```sql
-- Example: Only admins can access admin tables
CREATE POLICY "Admin access only" ON programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );
```

### 3. Environment Variables

Never commit sensitive keys to Git:
- Add `.env*` to `.gitignore` (already done)
- Use hosting platform's environment variable settings
- Rotate keys if accidentally exposed

---

## Routing Configuration

Your admin dashboard is accessed via the `AdminRoute` component. The web app routing already handles:

- `/` → Main app (shows auth screen if not logged in)
- Admin dashboard accessed through navigation after authentication
- Deep linking handled by `src/lib/deepLinkHandler.js`

### Make Admin Dashboard the Default Landing Page (Optional)

If you want `yourdomain.com` to go directly to admin dashboard, modify `App.js`:

```javascript
// In AppContent component, change initial route logic
{isAuthenticated ? (
  <>
    <Stack.Screen name="AdminRoute" component={AdminRoute} />
    <Stack.Screen name="Main" component={MainTabNavigator} />
    {/* ... other screens */}
  </>
) : (
  // Show auth screen
)}
```

---

## Testing Locally

Before deploying, test the web build locally:

```bash
# Build
npx expo export:web

# Serve locally (install serve if needed)
npx serve dist -p 3000

# Visit http://localhost:3000
```

---

## Troubleshooting

### Issue: Build fails

**Solution:** Check for React Native components that don't work on web:
- Replace `react-native` components with web alternatives
- Your `AdminDashboard.js` already checks `Platform.OS === 'web'`

### Issue: Authentication doesn't work

**Solution:** 
1. Check Supabase URL/keys in production
2. Verify CORS settings in Supabase dashboard
3. Check browser console for errors

### Issue: Images/assets not loading

**Solution:**
1. Make sure assets are in `assets` folder
2. Use `require()` for local images
3. Check asset paths in build

### Issue: Routing breaks on refresh

**Solution:** The hosting configurations (`vercel.json`, `netlify.toml`) already handle SPA routing by redirecting all routes to `index.html`.

---

## Production Checklist

- [ ] Build completes without errors
- [ ] Test locally with `npx serve dist`
- [ ] Admin authentication works
- [ ] All admin features functional
- [ ] Environment variables configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Supabase RLS policies verified
- [ ] Performance tested (Lighthouse score)

---

## Continuous Deployment

### With Vercel or Netlify:

Once connected to GitHub:
1. Push changes to your repository
2. Automatic build triggers
3. Site deploys automatically
4. Preview deployments for pull requests

### GitHub Actions (Alternative)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx expo export:web
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Support

For issues or questions:
1. Check Expo Web documentation: https://docs.expo.dev/workflow/web/
2. Supabase docs: https://supabase.com/docs
3. Hosting platform documentation

---

## Summary

**Quickest Path to Production:**

```bash
# 1. Build
npx expo export:web

# 2. Deploy with Vercel
npm install -g vercel
vercel login
vercel

# Done! Your admin dashboard is live.
```

Your admin dashboard URL will be provided by Vercel (e.g., `https://picklepro-mobile.vercel.app`). You can then add a custom domain like `admin.pickleballhero.app` through Vercel's dashboard.

