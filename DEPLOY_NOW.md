# 🚀 DEPLOY NOW - Quick Reference Card

Print this or keep it open while deploying!

---

## ⚡ Ultra-Fast Deploy (Copy & Paste These Commands)

Open your terminal in the project folder and run these commands one by one:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Go to project directory
cd /Users/guillaumepanot/Documents/CODE/Pickleball_Hero

# 3. Install dependencies (if needed)
npm install

# 4. Build for web
npm run build:web

# 5. Login to Vercel
vercel login

# 6. Deploy!
vercel
```

**Answer the prompts:**
- Set up and deploy? → **Press Enter** (Yes)
- Which scope? → **Select your account** (use arrows, press Enter)
- Link to existing project? → **n** (No)
- Project name? → **Press Enter** (accept default)
- Code location? → **Press Enter** (accept default)
- Override settings? → **n** (No)

**Wait 2 minutes... Done!** 🎉

Your URL will appear: `https://picklepro-mobile-xxxx.vercel.app`

---

## ✅ Checklist (Check off as you go)

### Before Deployment
- [ ] Vercel account created (you have this!)
- [ ] Node.js installed (`node --version`)
- [ ] Terminal open

### Deploy Steps
- [ ] Step 1: Install Vercel CLI
- [ ] Step 2: Navigate to project
- [ ] Step 3: Install dependencies
- [ ] Step 4: Build web app (`npm run build:web`)
- [ ] Step 5: Test locally (optional: `npm run serve:web`)
- [ ] Step 6: Login to Vercel (`vercel login`)
- [ ] Step 7: Deploy (`vercel`)
- [ ] Step 8: Wait for deployment (2 min)
- [ ] Step 9: Visit your URL!

### After Deployment
- [ ] Test login
- [ ] Set admin user in Supabase (if needed)
- [ ] Test admin features
- [ ] Share URL with team

### Optional (Later)
- [ ] Set up custom domain
- [ ] Connect GitHub for auto-deploy
- [ ] Configure environment variables

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| `vercel: command not found` | Run: `npm install -g vercel` |
| Build fails | Run: `rm -rf node_modules && npm install` |
| Login doesn't work | Check Supabase URL in code |
| "Access Denied" | Set `is_admin = true` in Supabase |
| 404 error | Redeploy: `vercel --prod` |

---

## 📞 Need Help?

**Detailed Guide:** [VERCEL_DEPLOYMENT_STEP_BY_STEP.md](./VERCEL_DEPLOYMENT_STEP_BY_STEP.md)

**Quick Start:** [QUICK_START.md](./QUICK_START.md)

**Full Guide:** [ADMIN_WEB_DEPLOYMENT_GUIDE.md](./ADMIN_WEB_DEPLOYMENT_GUIDE.md)

---

## 🎯 Your First Deployment

**Time needed:** 10 minutes  
**Difficulty:** Easy  
**Cost:** FREE  

**What you'll get:**
- ✅ Live URL (https://your-app.vercel.app)
- ✅ HTTPS/SSL automatic
- ✅ Global CDN
- ✅ No installation needed for users

**Let's go!** 🚀

---

## 📱 After Successful Deployment

Your URL: `_______________________________` (write it here!)

**Test this URL on:**
- [ ] Desktop Chrome
- [ ] Desktop Safari/Firefox
- [ ] Mobile phone
- [ ] Share with a colleague

**Set admin in Supabase:**
```sql
UPDATE users 
SET is_admin = true 
WHERE email = 'YOUR-EMAIL@example.com';
```

---

## 🔄 To Update Your Site Later

```bash
# Make your code changes, then:
npm run build:web
vercel --prod
```

**Or set up GitHub auto-deploy** (recommended!) - see Step 14 in detailed guide.

---

**Ready? Open your terminal and start with Step 1!** 💪

