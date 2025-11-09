# 🚀 Vercel Deployment - Step by Step Guide

## Prerequisites ✅
- [x] Vercel account (you have this!)
- [ ] Node.js installed
- [ ] Project dependencies installed

---

## Step 1: Install Vercel CLI

Open your terminal and run:

```bash
npm install -g vercel
```

**What this does:** Installs Vercel's command-line tool globally on your computer.

**Expected output:**
```
added 1 package in 2s
```

**Verify installation:**
```bash
vercel --version
```

You should see something like: `Vercel CLI 33.0.0`

---

## Step 2: Navigate to Your Project

```bash
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero
```

**What this does:** Makes sure you're in the correct project directory.

**Verify you're in the right place:**
```bash
ls package.json
```

You should see: `package.json`

---

## Step 3: Install Project Dependencies (if not already done)

```bash
npm install
```

**What this does:** Installs all required packages for your project.

**This may take 2-3 minutes.** You'll see a progress bar.

**Expected output:**
```
added 1234 packages in 2m
```

---

## Step 4: Build Your Web App

```bash
npm run build:web
```

**What this does:** Converts your React Native app into web files (HTML, CSS, JavaScript).

**This may take 3-5 minutes.** You'll see output like:

```
Starting Metro Bundler
Building JavaScript bundle
Optimizing assets
Export complete!
```

**What you should see:**
- A new `dist` folder created in your project
- Inside `dist`: `index.html`, JavaScript files, assets

**If you get an error here:** See Troubleshooting section at the bottom.

---

## Step 5: Test Your Build Locally (Optional but Recommended)

```bash
npm run serve:web
```

**What this does:** Runs a local web server to test your production build.

**Open your browser and go to:** `http://localhost:3000`

**What to test:**
- ✅ Page loads
- ✅ You see the login/auth screen OR the app (if already logged in)
- ✅ No console errors (press F12 → Console tab)

**When done testing:** Press `Ctrl+C` in terminal to stop the server.

---

## Step 6: Login to Vercel

```bash
vercel login
```

**What this does:** Connects your terminal to your Vercel account.

**You'll see:**
```
Vercel CLI 33.0.0
> Log in to Vercel
```

**Choose your login method:**
- **Option 1:** Email (easiest)
  - Enter your email
  - Check your inbox
  - Click the verification link
  - Return to terminal

- **Option 2:** GitHub
  - Opens browser
  - Authorize Vercel
  - Return to terminal

**Success message:**
```
> Success! GitHub authentication complete
```

---

## Step 7: Deploy to Vercel

Now for the magic moment! Run:

```bash
vercel
```

**What happens next:** Vercel will ask you several questions.

### Question 1: Set up and deploy?
```
? Set up and deploy "~/Documents/CODE/Pickleball_Hero"? [Y/n]
```
**Answer:** Press `Enter` (Yes)

### Question 2: Which scope?
```
? Which scope do you want to deploy to?
```
**Answer:** Select your username/organization (use arrow keys, press Enter)

### Question 3: Link to existing project?
```
? Link to existing project? [y/N]
```
**Answer:** Press `n` then `Enter` (No, this is a new project)

### Question 4: Project name?
```
? What's your project's name? (picklepro-mobile)
```
**Answer:** Press `Enter` to accept default OR type a custom name like `picklepro-admin`

### Question 5: Code location?
```
? In which directory is your code located? ./
```
**Answer:** Press `Enter` (accept default)

### Question 6: Override settings?
```
? Want to override the settings? [y/N]
```
**Answer:** Press `n` then `Enter` (No, use vercel.json settings)

---

## Step 8: Wait for Deployment

You'll see:

```
🔍  Inspect: https://vercel.com/your-username/picklepro-mobile/xxx
✅  Production: https://picklepro-mobile.vercel.app
```

**This takes 1-2 minutes.**

**What's happening:**
- ✅ Uploading your files
- ✅ Building on Vercel's servers
- ✅ Deploying to global CDN
- ✅ Provisioning SSL certificate

**Success! You'll see:**
```
✅  Production: https://picklepro-mobile-xxxx.vercel.app [2m]
```

---

## Step 9: Visit Your Live Site! 🎉

Copy the URL from the terminal (the one after "Production:") and open it in your browser.

**Example:** `https://picklepro-mobile.vercel.app`

**What you should see:**
- Your app loads
- Login/auth screen (if not logged in)
- HTTPS lock icon in browser

**Congratulations! Your admin dashboard is now live!** 🎉

---

## Step 10: Test Your Live Deployment

### Test 1: Authentication
1. Visit your deployed URL
2. Log in with your Supabase credentials
3. Verify login works

### Test 2: Admin Access
1. After logging in, you should see:
   - Admin dashboard (if you're an admin)
   - OR appropriate screen for your user type

### Test 3: Admin Features (if you have admin access)
1. Navigate through different sections
2. Try viewing programs, exercises, etc.
3. Check browser console for errors (F12)

**If you see "Access Denied":** Your user needs admin privileges in Supabase.

---

## Step 11: Set Admin User in Supabase (if needed)

If you get "Access Denied," you need to set yourself as admin:

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com
   - Open your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run this SQL:**
   ```sql
   UPDATE users 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```
   
   **Replace `your-email@example.com` with your actual email!**

4. **Click "Run"**

5. **Refresh your deployed site** and try logging in again

---

## Step 12: Configure Environment Variables (if needed)

If your app uses environment variables:

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Go to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables"

3. **Add Variables:**
   - Click "Add New"
   - Name: `EXPO_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase URL
   - Check: Production, Preview, Development
   - Click "Save"

4. **Repeat for other variables:**
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Any other env vars your app needs

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## Step 13: Set Up Custom Domain (Optional)

Want to use `admin.pickleballhero.app` instead of `picklepro-mobile.vercel.app`?

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Go to Domains:**
   - Click "Settings" tab
   - Click "Domains"

3. **Add Domain:**
   - Click "Add"
   - Enter: `admin.pickleballhero.app`
   - Click "Add"

4. **Configure DNS:**
   Vercel will show you DNS records to add. Go to your domain registrar and add:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

5. **Wait for DNS propagation** (5-60 minutes)

6. **Verify:**
   - Visit `https://admin.pickleballhero.app`
   - Should work with automatic HTTPS!

---

## Step 14: Enable Continuous Deployment (Optional)

Want automatic deployments when you push to GitHub?

1. **Push your code to GitHub** (if not already)

2. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click on your project

3. **Connect Git:**
   - Click "Settings" tab
   - Click "Git"
   - Click "Connect Git Repository"

4. **Authorize GitHub:**
   - Select your repository
   - Authorize Vercel

5. **Configure:**
   - Production Branch: `main` (or `master`)
   - Click "Save"

**Now, every time you push to GitHub:**
- Vercel automatically builds
- Vercel automatically deploys
- Your site updates automatically!

---

## 🎉 You're Done!

Your admin dashboard is now:
- ✅ Live on the internet
- ✅ Accessible via URL
- ✅ Protected with HTTPS
- ✅ Backed by Supabase
- ✅ No Expo needed!

**Your URL:** Check your terminal or Vercel dashboard

---

## Quick Commands Reference

```bash
# Deploy (first time or updates)
vercel

# Deploy to production specifically
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Remove a deployment
vercel remove [deployment-url]
```

---

## Updating Your Deployment

When you make changes to your code:

```bash
# Option 1: Rebuild and deploy
npm run build:web
vercel --prod

# Option 2: If using GitHub integration
git add .
git commit -m "Your changes"
git push
# Vercel automatically deploys!
```

---

## Troubleshooting

### Problem: `vercel: command not found`

**Solution:**
```bash
npm install -g vercel
# If that fails, try:
sudo npm install -g vercel
```

### Problem: Build fails (`npm run build:web`)

**Solution 1:** Clear cache and rebuild
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build:web
```

**Solution 2:** Check for errors in console output
- Look for "ERROR" messages
- Common issue: missing dependencies
- Fix: `npm install [missing-package]`

### Problem: "Module not found" error during build

**Solution:**
```bash
npm install
npm run build:web
```

### Problem: Login doesn't work on deployed site

**Check these:**
1. Is Supabase URL correct in your code?
2. Is CORS enabled in Supabase for your domain?
3. Are environment variables set in Vercel?
4. Check browser console for errors (F12)

**Fix CORS in Supabase:**
1. Go to Supabase Dashboard
2. Settings → API
3. Add your Vercel URL to allowed origins

### Problem: "Access Denied" after login

**Solution:** Set admin flag in Supabase
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### Problem: Page shows but looks broken

**Check:**
1. Browser console for errors (F12)
2. Network tab - are all files loading?
3. Try clearing browser cache (Ctrl+Shift+R)

### Problem: Deployment succeeds but site shows 404

**Solution:** Verify `vercel.json` exists with correct rewrites
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Then redeploy:
```bash
vercel --prod
```

---

## Getting Help

### Check Deployment Logs

```bash
# View logs
vercel logs

# Or in Vercel Dashboard:
# Your Project → Deployments → Click deployment → View Logs
```

### Vercel Support

- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord
- Support: https://vercel.com/support

### Your Project Docs

- [Quick Start](./QUICK_START.md)
- [Complete Guide](./ADMIN_WEB_DEPLOYMENT_GUIDE.md)
- [Troubleshooting](./ADMIN_WEB_DEPLOYMENT_GUIDE.md#troubleshooting)

---

## Next Steps

Now that you're deployed:

1. **Share the URL** with your team
2. **Set up admin users** in Supabase
3. **Test all features** thoroughly
4. **Set up custom domain** (optional)
5. **Enable GitHub auto-deploy** (optional)
6. **Monitor usage** in Vercel dashboard

---

## Summary

**What you did:**
1. ✅ Installed Vercel CLI
2. ✅ Built your app for web
3. ✅ Logged into Vercel
4. ✅ Deployed to production
5. ✅ Got a live URL

**What you have now:**
- 🌐 Live admin dashboard
- 🔒 HTTPS enabled
- ⚡ Global CDN
- 🔄 Easy updates
- 💰 Free hosting

**Time taken:** ~10-15 minutes

**Awesome work!** 🎉

---

## Pro Tips

1. **Bookmark your URL** for easy access
2. **Save your Vercel project URL** from dashboard
3. **Set up alerts** in Vercel for deployment failures
4. **Use preview deployments** for testing (automatic with GitHub)
5. **Check analytics** in Vercel dashboard

---

**Questions?** Check the other guides or the troubleshooting section above!

**Ready for your first deployment?** Start with Step 1! 🚀

