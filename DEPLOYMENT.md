# YourLocalPhysio - Deployment Guide

This guide covers deploying the frontend on Vercel and the backend on Railway for optimal performance.

## Architecture Overview

- **Frontend**: Vercel (Next.js) - `https://yourlocalphysio.vercel.app`
- **Backend API**: Railway (Express.js) - `https://yourlocalphysio-api.railway.app`

---

## Backend Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- PostgreSQL database (Railway or external)

### Step 1: Prepare the Backend
The backend has been updated to:
- Remove Next.js dependencies (now API-only)
- Use Express server without frontend serving
- Include `railway.json` configuration and `Procfile`

### Step 2: Set Up PostgreSQL Database on Railway
1. Create a new PostgreSQL plugin in Railway
2. Note the connection URL (looks like: `postgresql://user:password@host:port/dbname`)

### Step 3: Deploy Backend to Railway
1. Push your code to GitHub
2. Go to https://railway.app and sign in
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `YourLocalPhysio` repository
5. Select the `backend` folder as the root directory
6. Railway will auto-detect from `Procfile` and `railway.json`

### Step 4: Configure Environment Variables on Railway
In the Railway dashboard, add these environment variables:
```
DATABASE_URL=<Your PostgreSQL connection string>
CORS_ORIGIN=https://yourlocalphysio.vercel.app
ADMIN_PASSWORD=<Set a secure password>
NODE_ENV=production
PORT=3000
```

### Step 5: Get Your Backend URL
- Once deployed, Railway will provide a URL like: `https://yourlocalphysio-api.railway.app`
- Note this for the frontend configuration

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with your code

### Step 1: Deploy Frontend to Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New..." → "Project"
3. Select your GitHub repository `YourLocalPhysio`
4. Under "Root Directory", select `./frontend`
5. Click "Deploy"

### Step 2: Configure Environment Variables on Vercel
After deployment, go to your project settings:
1. Navigate to Settings → Environment Variables
2. Add this variable:
   ```
   NEXT_PUBLIC_API_URL=https://yourlocalphysio-api.railway.app
   ```
   (Replace with your actual Railway backend URL)

3. Re-deploy to apply variables:
   - Push a new commit to trigger auto-deploy, OR
   - Click "Redeploy" in Vercel dashboard

### Step 3: Configure Custom Domain (Optional)
1. In Vercel project settings → Domains
2. Add your custom domain (e.g., `yourlocalphysio.com`)
3. Update DNS records as instructed

---

## Update Frontend to Use Backend API

Your API client code should reference the environment variable:

```typescript
// In your frontend code (e.g., lib/api.ts)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiCall = async (endpoint: string, options = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return response.json();
};
```

---

## CORS Configuration

The backend accepts API requests from Vercel frontend because:
1. Backend `app.ts` has CORS middleware configured
2. `CORS_ORIGIN` environment variable is set to your Vercel domain
3. Makes requests work from your actual domain in production

---

## SSL/TLS Certificates

Both Vercel and Railway provide free SSL certificates:
- **Vercel**: Automatic via Let's Encrypt
- **Railway**: Automatic via Let's Encrypt

All communication is encrypted by default.

---

## Monitoring & Logs

### Railway Backend Logs
- Dashboard → Your Project → Logs tab
- View real-time server logs and errors

### Vercel Frontend Logs
- Dashboard → Your Project → Deployments
- Click deployment → Logs tab
- Monitor build logs and runtime errors

---

## Performance Benefits

### Why This is Fast:
1. **Vercel Frontend (Edge CDN)**:
   - Distributed globally
   - Edge caching for static assets
   - Automatic image optimization
   - Instant cold starts (no sleep)

2. **Railway Backend**:
   - Much faster than Render free tier
   - No automatic spin-downs
   - Better resource allocation
   - Regional deployment options

### Expected Wake-up Time:
- **Before**: 30-60 seconds (Render free tier spin-up)
- **After**: < 100ms (already running)

---

## Troubleshooting

### Frontend not connecting to backend?
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify it matches your Railway backend URL
- Check CORS settings in backend

### Database connection failing?
- Verify `DATABASE_URL` is correct in Railway
- Ensure database is running
- Check firewall/network settings

### Build failing?
- Run `npm install` locally to check dependencies
- Check logs in Vercel/Railway dashboard
- Ensure all environment variables are set

---

## Local Development

For local testing before deployment:
1. Backend: `npm run dev` (in `/backend`)
2. Frontend: `npm run dev` (in `/frontend`)
3. Frontend will use `http://localhost:5000` as default API URL

---

## Redeploy Instructions

### To redeploy after code changes:

**Backend (Railway)**:
- Push to GitHub → Railway auto-deploys

**Frontend (Vercel)**:
- Push to GitHub → Vercel auto-deploys (if connected)
- Or manually redeploy from Vercel dashboard

