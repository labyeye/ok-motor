# Vercel Deployment Guide for OK Motor PWA

## 📋 Prerequisites

1. **Backend Deployed**: Ensure your backend is deployed on Render/Railway/Heroku first
2. **GitHub Repository**: Your code should be pushed to a GitHub repository
3. **Vercel Account**: Create account at [vercel.com](https://vercel.com)
4. **Environment Files**: Check that you have `.env.example` in your frontend directory

## 🔧 Environment Setup

### Local Development
1. Copy `.env.example` to `.env`:
   ```bash
   cd frontend
   cp .env.example .env
   ```
2. Update `.env` with your local backend URL (usually `https://ok-motor.onrender.com`)

### Production Environment
The `.env.production` file contains production defaults, but Vercel environment variables will override these.

## 🚀 Step-by-Step Deployment

### 1. **Vercel Dashboard Deployment**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository (`ok-motor`)
4. Configure the project settings:

**Framework Preset:** Create React App
**Root Directory:** `frontend`
**Build Command:** `npm run build:prod`
**Output Directory:** `build`

### 2. **Environment Variables**

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_ENV=production
```

**Important**: Replace `your-backend-url.onrender.com` with your actual backend URL.

### 3. **Build Settings Verification**

Ensure these settings in Vercel:
- **Build Command**: `npm run build:prod`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x or latest

## 🔧 Common Issues & Solutions

### Issue 1: Build Fails
**Solution**: Check if all dependencies are in `package.json`
```bash
# In frontend directory
npm install
npm run build:prod
```

### Issue 2: API Calls Fail
**Solution**: Verify environment variables
- Check `REACT_APP_API_URL` is set correctly
- Ensure backend URL includes protocol (https://)
- Backend must have CORS configured for your Vercel domain

### Issue 3: Service Worker Issues
**Solution**: Check `vercel.json` configuration
- Service worker headers should be properly set
- Cache-control headers configured

### Issue 4: 404 on Refresh
**Solution**: Already handled in `vercel.json` with catch-all route:
```json
{
  "src": "/(.*)",
  "dest": "/index.html"
}
```

## 🌐 Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings > Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Update CORS settings in backend for new domain

## 📱 PWA Configuration

The app is already configured as PWA with:
- Service Worker (`sw.js`)
- Web App Manifest (`manifest.json`)
- Offline support
- Caching strategies

## 🔍 Testing Deployment

After deployment:
1. Check if site loads: `https://your-app.vercel.app`
2. Test API calls (check Network tab in DevTools)
3. Test offline functionality
4. Verify PWA install prompt works

## 🛠️ Backend CORS Configuration

Ensure your backend (server.js) has CORS configured for Vercel:

```javascript
const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "https://your-app.vercel.app",
    // Add your custom domain here if you have one
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
```

## 🚨 Troubleshooting

### Check Build Logs
In Vercel dashboard, go to **Deployments** and click on failed deployment to see logs.

### Common Environment Issues
```bash
# Check if environment variables are loaded
console.log('API URL:', process.env.REACT_APP_API_URL);
```

### Test Local Production Build
```bash
cd frontend
npm run build:prod
npx serve -s build
```

## 📝 Deployment Checklist

- [ ] Backend is deployed and accessible
- [ ] Frontend builds successfully locally
- [ ] Environment variables are set in Vercel
- [ ] CORS is configured for Vercel domain
- [ ] Service worker loads without errors
- [ ] API calls work in production
- [ ] PWA features work correctly
