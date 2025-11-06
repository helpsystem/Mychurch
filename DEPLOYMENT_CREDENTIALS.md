# 🔐 Deployment Credentials - Ready for Render

## ✅ Supabase Configuration

### Project Details
```
Project ID: wxzhzsqicgwfxffxayhy
Project URL: https://wxzhzsqicgwfxffxayhy.supabase.co
```

### API Keys
```
Anon/Public Key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjA3MjksImV4cCI6MjA3NTMzNjcyOX0.fUKJahkSpjqaBaSCP3jukAXkbPcLSUkkcDEtYzF0ShI

Service Role (Secret) Key:
sb_secret_ECs_BVeX7EPfFghJCpBnAQ_Br23Mrxk

Legacy JWT Secret:
BwqER2muuY8kAJ0uMTXonrGUiPGFRQT2Ae3JYq+tIUWkgAKyTis206mxcMoj/HRue6Xb6hBdAJYbGhgCkoUC7Q==
```

---

## 🚀 Render Environment Variables

Copy these **EXACT VALUES** to Render:

### Backend Service Environment Variables

```bash
# Node Environment
NODE_ENV=production
PORT=10000

# Supabase Configuration
SUPABASE_URL=https://wxzhzsqicgwfxffxayhy.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4emh6c3FpY2d3ZnhmZnhheWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjA3MjksImV4cCI6MjA3NTMzNjcyOX0.fUKJahkSpjqaBaSCP3jukAXkbPcLSUkkcDEtYzF0ShI

# JWT Secret (for authentication tokens)
JWT_SECRET=BwqER2muuY8kAJ0uMTXonrGUiPGFRQT2Ae3JYq+tIUWkgAKyTis206mxcMoj/HRue6Xb6hBdAJYbGhgCkoUC7Q==

# CORS Configuration (will update after Frontend deployment)
FRONTEND_ORIGIN=https://mychurch.vercel.app

# Optional: Gemini AI (if you have it)
# GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📋 Step-by-Step Deployment Guide

### Phase 1: Deploy Backend to Render

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect Repository: `helpsystem/Mychurch`
   - Click "Connect"

3. **Configure Service**
   ```
   Name: mychurch-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: node backend/server.js
   Instance Type: Free
   ```

4. **Add Environment Variables**
   - Click "Environment" tab
   - Click "Add Environment Variable"
   - Copy each variable from above section (one by one):
     - `NODE_ENV` = `production`
     - `PORT` = `10000`
     - `SUPABASE_URL` = `https://wxzhzsqicgwfxffxayhy.supabase.co`
     - `SUPABASE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key)
     - `JWT_SECRET` = `BwqER2muuY8kAJ0uMTXonrGUiPGFRQT2Ae3JYq+tIU...` (full key)
     - `FRONTEND_ORIGIN` = `https://mychurch.vercel.app` (temporary, will update)

5. **Deploy**
   - Click "Create Web Service"
   - Wait 2-3 minutes for build
   - Copy the URL (e.g., `https://mychurch-backend.onrender.com`)

---

### Phase 2: Deploy Frontend to Vercel

1. **Go to Vercel**
   - URL: https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select `helpsystem/Mychurch` repository
   - Click "Import"

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: ./ (default)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variable**
   - Click "Environment Variables"
   - Add one variable:
     - Key: `VITE_API_URL`
     - Value: `https://mychurch-backend.onrender.com` (your Render URL)

5. **Deploy**
   - Click "Deploy"
   - Wait 2 minutes
   - Copy the URL (e.g., `https://mychurch.vercel.app`)

---

### Phase 3: Update CORS (CRITICAL!)

1. **Go back to Render Dashboard**
2. **Select your Backend service**
3. **Environment tab**
4. **Edit `FRONTEND_ORIGIN` variable**
   - Change value to your Vercel URL: `https://mychurch.vercel.app`
5. **Click "Save Changes"**
6. **Wait for automatic redeploy (~30 seconds)**

---

## ✅ Testing After Deployment

### Test Backend
```bash
# Health check
curl https://mychurch-backend.onrender.com/api/health

# Expected response:
{"status":"ok","timestamp":1730000000000}
```

### Test Frontend
1. Open: `https://mychurch.vercel.app`
2. Should load homepage
3. Navigate to Bible Reader
4. Test audio playback
5. Check all features work

---

## 🔧 Troubleshooting

### Backend Build Fails
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Ensure Node version is 20 (set in Render settings)

### Frontend Can't Connect to Backend
- Check browser console for CORS errors
- Verify `FRONTEND_ORIGIN` matches Vercel URL exactly
- Verify `VITE_API_URL` in Vercel matches Render URL

### Database Connection Error
- Test Supabase connection manually:
  ```bash
  curl https://wxzhzsqicgwfxffxayhy.supabase.co/rest/v1/
  ```
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct

### Cold Start (Free Tier)
- Render free tier spins down after 15 minutes idle
- First request may take 30-60 seconds
- Consider keeping app active with uptime monitoring

---

## 📝 Notes

- **GitHub Auto-Deploy**: Any push to `main` branch will trigger automatic redeployment on both Render and Vercel
- **Free Tier Limits**:
  - Render: 750 hours/month, 512 MB RAM, cold start after 15 min idle
  - Vercel: Unlimited deployments, 100 GB bandwidth/month
- **Supabase**: 500 MB database, 2 GB storage free tier
- **Domain**: You can add custom domain later in Vercel settings

---

## 🎉 Success Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel  
- [ ] CORS configured correctly
- [ ] Backend health check returns OK
- [ ] Frontend loads successfully
- [ ] Bible Reader works
- [ ] Audio player works
- [ ] Authentication works
- [ ] Database queries work

---

**Created:** 2025-11-05  
**Status:** Ready for Deployment  
**Repository:** helpsystem/Mychurch  
**Latest Commit:** b2952bf
