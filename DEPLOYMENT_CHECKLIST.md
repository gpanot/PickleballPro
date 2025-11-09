# ✅ Web Deployment Checklist

## Pre-Deployment

### 1. Verify Your Setup
- [ ] Node.js installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase configured in `src/lib/supabase.js`
- [ ] Admin users configured in Supabase (set `is_admin = true`)

### 2. Test Locally
```bash
# Start dev server
npm run web

# Visit http://localhost:19006
# Test login
# Verify admin dashboard loads
```

### 3. Build for Production
```bash
# Create production build
npm run build:web

# Test production build locally
npm run serve:web

# Visit http://localhost:3000
# Test everything again
```

---

## Deployment (Choose One)

### Option A: Vercel (Recommended) ⭐

**Initial Setup:**
```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Login to Vercel (one-time)
vercel login
```

**Deploy:**
```bash
# Deploy to production
vercel --prod

# Or use npm script
npm run deploy:vercel
```

**What You'll Get:**
- [ ] Live URL (e.g., `https://picklepro-mobile.vercel.app`)
- [ ] Free SSL certificate
- [ ] Global CDN
- [ ] Automatic deployments from GitHub (if connected)

**Configure Environment Variables:**
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   - `EXPO_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
3. Redeploy

---

### Option B: Netlify

**Initial Setup:**
```bash
# Install Netlify CLI (one-time)
npm install -g netlify-cli

# Login to Netlify (one-time)
netlify login
```

**Deploy:**
```bash
# Deploy to production
npm run deploy:netlify
```

**What You'll Get:**
- [ ] Live URL (e.g., `https://picklepro-mobile.netlify.app`)
- [ ] Free SSL certificate
- [ ] Global CDN
- [ ] Automatic deployments from GitHub (if connected)

---

### Option C: GitHub Pages

**Setup:**
```bash
# Install gh-pages (one-time)
npm install --save-dev gh-pages

# Add script to package.json
# "deploy:gh-pages": "npm run build:web && gh-pages -d dist"
```

**Deploy:**
```bash
npm run deploy:gh-pages
```

**What You'll Get:**
- [ ] Live URL (e.g., `https://yourusername.github.io/Pickleball_Hero`)
- [ ] Free hosting
- [ ] Automatic HTTPS

---

## Post-Deployment

### 1. Verify Deployment
- [ ] Visit your deployed URL
- [ ] Test login functionality
- [ ] Verify admin dashboard loads
- [ ] Test creating/editing content
- [ ] Check all navigation works
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile browser
- [ ] Check browser console for errors

### 2. Configure Custom Domain (Optional)

**Example:** `admin.pickleballhero.app`

**For Vercel:**
1. [ ] Go to Vercel dashboard → Project → Settings → Domains
2. [ ] Click "Add Domain"
3. [ ] Enter your domain (e.g., `admin.pickleballhero.app`)
4. [ ] Update DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
5. [ ] Wait for DNS propagation (5-60 minutes)
6. [ ] SSL certificate auto-generated

**For Netlify:**
1. [ ] Go to Netlify dashboard → Site settings → Domain management
2. [ ] Click "Add custom domain"
3. [ ] Follow DNS configuration instructions
4. [ ] Wait for DNS propagation
5. [ ] SSL certificate auto-generated

### 3. Set Up Continuous Deployment (Optional)

**If using GitHub:**

**For Vercel:**
1. [ ] Go to Vercel dashboard
2. [ ] Click "Import Project"
3. [ ] Connect GitHub account
4. [ ] Select repository
5. [ ] Vercel auto-detects settings from `vercel.json`
6. [ ] Every push to main branch auto-deploys

**For Netlify:**
1. [ ] Go to Netlify dashboard
2. [ ] Click "New site from Git"
3. [ ] Connect GitHub account
4. [ ] Select repository
5. [ ] Netlify auto-detects settings from `netlify.toml`
6. [ ] Every push to main branch auto-deploys

**Using GitHub Actions:**
- [ ] Already configured in `.github/workflows/deploy-web.yml`
- [ ] Add secrets to GitHub repository:
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Push to main branch triggers auto-deploy

### 4. Security Checklist

**Supabase:**
- [ ] Row-level security (RLS) policies enabled
- [ ] Admin access requires `is_admin = true`
- [ ] API keys are anon keys (not service keys)
- [ ] CORS configured for your domain

**Hosting:**
- [ ] HTTPS enabled (should be automatic)
- [ ] Environment variables set
- [ ] No secrets in code/git
- [ ] `.env` files in `.gitignore`

**Authentication:**
- [ ] Login flow works
- [ ] Admin check works (`AdminRoute.js`)
- [ ] Non-admins cannot access admin features
- [ ] Session persistence works

### 5. Performance Optimization (Optional)

- [ ] Run Lighthouse audit (Chrome DevTools)
- [ ] Check load time
- [ ] Optimize images if needed
- [ ] Enable gzip compression (automatic on Vercel/Netlify)
- [ ] Check mobile performance

### 6. Monitoring & Analytics (Optional)

**Add Google Analytics:**
1. [ ] Create Google Analytics property
2. [ ] Add tracking code to `app.json` or create `public/index.html`
3. [ ] Verify tracking works

**Vercel Analytics:**
1. [ ] Enable in Vercel dashboard
2. [ ] View analytics in Vercel

**Error Tracking:**
1. [ ] Set up Sentry (optional)
2. [ ] Configure error reporting
3. [ ] Monitor for issues

---

## Testing Checklist

### Functionality
- [ ] User can visit the URL
- [ ] Auth screen shows for non-logged-in users
- [ ] Users can log in via Supabase
- [ ] Admin users see admin dashboard
- [ ] Non-admin users see appropriate screen
- [ ] All admin features work:
  - [ ] View programs
  - [ ] Create/edit programs
  - [ ] View exercises
  - [ ] Create/edit exercises
  - [ ] View routines
  - [ ] Create/edit routines
  - [ ] Manage coaches
  - [ ] Manage users
  - [ ] View feedback
  - [ ] Upload images/videos

### Browsers
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Edge (desktop)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)

### Performance
- [ ] Page loads in < 3 seconds
- [ ] No console errors
- [ ] Images load properly
- [ ] Videos play correctly
- [ ] No broken links

---

## Troubleshooting

### Issue: Build fails
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build:web
```

### Issue: "Module not found"
- Check if all dependencies are installed
- Look for missing imports
- Verify file paths are correct

### Issue: Authentication doesn't work
1. Check Supabase URL in code
2. Verify anon key is correct
3. Check browser console for errors
4. Verify CORS settings in Supabase dashboard

### Issue: Admin dashboard not showing
1. Check `is_admin = true` in Supabase users table
2. Verify `checkAdminAccess()` function
3. Check browser console for auth errors
4. Test with correct admin user

### Issue: Routing breaks on page refresh
- Verify `vercel.json` or `netlify.toml` has correct rewrites
- Should redirect all routes to `/index.html`

### Issue: Images not loading
- Check asset paths
- Verify Supabase storage bucket is public
- Check CORS on Supabase storage

---

## Quick Reference

### URLs After Deployment

**Development:**
- Local web: `http://localhost:19006` (dev server)
- Local build: `http://localhost:3000` (production test)

**Production:**
- Vercel: `https://your-project.vercel.app`
- Netlify: `https://your-project.netlify.app`
- GitHub Pages: `https://username.github.io/repo-name`
- Custom: `https://admin.pickleballhero.app`

### Common Commands

```bash
# Development
npm run web              # Start dev server
npm run build:web        # Build for production
npm run serve:web        # Test production build locally

# Deployment
npm run deploy:vercel    # Deploy to Vercel
npm run deploy:netlify   # Deploy to Netlify
vercel --prod            # Direct Vercel deploy
netlify deploy --prod    # Direct Netlify deploy

# Testing
./test-web-build.sh      # Run build test script

# Troubleshooting
rm -rf node_modules      # Clear dependencies
npm install              # Reinstall
npm cache clean --force  # Clear npm cache
```

---

## Success Criteria

Your deployment is successful when:

✅ Site is accessible via URL  
✅ HTTPS is enabled (padlock in browser)  
✅ Login works  
✅ Admin dashboard loads  
✅ All features functional  
✅ No console errors  
✅ Works on mobile and desktop  
✅ Images/videos load properly  

---

## Next Steps After Deployment

1. **Share the URL** with your admin team
2. **Set up admin users** in Supabase
3. **Test all features** with real data
4. **Monitor performance** and errors
5. **Gather feedback** from users
6. **Iterate and improve**

---

## Documentation Reference

- [Quick Start Guide](./QUICK_START.md) - Fast deployment
- [Complete Deployment Guide](./ADMIN_WEB_DEPLOYMENT_GUIDE.md) - Detailed instructions
- [Web vs Mobile](./WEB_VS_MOBILE.md) - Platform comparison
- [Deployment Overview](./README_WEB_DEPLOYMENT.md) - Complete overview

---

## Support

**Having issues?**
1. Check the guides above
2. Review browser console for errors
3. Verify Supabase configuration
4. Test locally first
5. Check hosting platform logs

**Ready to deploy?** Start with [QUICK_START.md](./QUICK_START.md)! 🚀

