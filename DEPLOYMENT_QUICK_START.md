# Quick Start: Deploy to Vercel + Railway

## Summary of Changes
✅ Backend now API-only (no Next.js serving)
✅ Configuration files created for both platforms
✅ Environment variables templates provided

## Quick Checklist:

### 1. Backend (Railway) - 5 minutes
- [ ] Create Railway account & PostgreSQL instance
- [ ] Push code to GitHub
- [ ] Create new Railway project, link GitHub repo
- [ ] Set root directory to `backend/`
- [ ] Add environment variables:
  - `DATABASE_URL` (from PostgreSQL)
  - `CORS_ORIGIN=https://yourlocalphysio.vercel.app`
  - `ADMIN_PASSWORD` (secure password)
  - `NODE_ENV=production`
- [ ] Deploy and note the URL (e.g., `https://xxx.railway.app`)

### 2. Frontend (Vercel) - 3 minutes
- [ ] Create Vercel account (link GitHub)
- [ ] Import project, select `frontend/` as root
- [ ] Deploy
- [ ] Add environment variable:
  - `NEXT_PUBLIC_API_URL=<your Railway URL>`
- [ ] Redeploy

### 3. Test
- [ ] Visit Vercel frontend URL
- [ ] Make an API call (booking, check admin login)
- [ ] Verify instant load times (no 30s+ wait!)

## Files Created:
- `backend/Procfile` - For Railway deployment
- `backend/railway.json` - Railway configuration
- `backend/.env.example` - Updated with new vars
- `frontend/vercel.json` - Vercel configuration
- `frontend/.env.example` - API URL configuration
- `DEPLOYMENT.md` - Full deployment guide

## Performance Gains:
- ⚡ **Eliminate 30-60s wake-up delays** from Render free tier
- ⚡ **Global edge caching** with Vercel CDN
- ⚡ **Always-on backend** with Railway
- ⚡ **Instant page loads** after deployment

---

Get started now! Follow the detailed steps in `DEPLOYMENT.md`
