# Vercel Deployment Guide for OK Motor PWA

### 1. **Vercel Dashboard Deployment**

1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set build settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build:prod`
   - **Output Directory:** `build`

## 🔧 Environment Variables

Add these environment variables in Vercel dashboard:

```
REACT_APP_ENV=production
REACT_APP_API_URL=https://ok-motor.onrender.com
```
