# Deployment Guide

This repo contains a Vite React frontend and a Node/Express backend. Below are two recommended deployment targets:

- Frontend: GitHub Pages (static hosting)
- Backend: Render (Node Web Service)

## 1) Frontend → GitHub Pages

We ship a GitHub Actions workflow at `.github/workflows/deploy-frontend.yml` that builds and publishes `dist/` to Pages.

Steps:
- Push to `main` (or trigger the workflow manually).
- The workflow uses Node 20, runs `npm install`, `npm run build -- --base=./`, then uploads `dist` and deploys.
- SPA fallback is added by copying `dist/index.html` to `dist/404.html`.

After first run:
- In the GitHub repo settings → Pages, ensure the source is set to "GitHub Actions" (it will be if you use this workflow).
- Your site will be available at `https://<owner>.github.io/<repo>/`.

Custom Domain (optional):
- We added `public/CNAME` with `samanabyar.online`.
- In your DNS provider, create these records:
	- A @ → 185.199.108.153
	- A @ → 185.199.109.153
	- A @ → 185.199.110.153
	- A @ → 185.199.111.153
	- CNAME www → <owner>.github.io
- Then go to GitHub → Settings → Pages, set Custom domain to `samanabyar.online` and enforce HTTPS.

Frontend environment:
- API base is controlled by `localStorage` key `iccdc-api-base-url` (see `lib/api.ts`).
- For GitHub Pages, set it at runtime using the Environment page or dev tools to your backend URL, e.g. `https://mychurch-backend.onrender.com/api`.

## 2) Backend → Render

We provide `render.yaml` to define a web service:

Key points:
- Build: `npm install --prefix backend`
- Start: `node backend/server.js`
- Node: 20
- PORT env is set to `10000` (Render will map its internal port to external automatically). The server already reads `process.env.PORT`.

Required environment variables (set in Render Dashboard → your service → Environment):

Essential:
- DATABASE_URL: Supabase/Postgres connection string (with ?sslmode=require if needed)
- FRONTEND_ORIGIN: https://samanabyar.online
- JWT_SECRET: a long random string (use 32+ hex chars)

Optional but recommended:
- GEMINI_API_KEY: for AI endpoints under /api/ai/*

Optional integrations:
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER: to enable SMS/WhatsApp via Twilio
- FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT, FTP_SECURE: required only if you want to upload images to shared hosting over FTP
- DOMAIN: your public assets domain used to build image URLs (e.g., samanabyar.online)
- FRONTEND_ORIGIN_2, FRONTEND_ORIGIN_3: additional allowed origins if you add more domains/subdomains

After deploy, note the public URL, e.g.: `https://mychurch-backend.onrender.com`.

## 3) Wire frontend ↔ backend

Option A (recommended): In the deployed frontend, set API base URL in browser localStorage:
- Open your site → DevTools Console → run:
	`localStorage.setItem('iccdc-api-base-url', 'https://mychurch-backend.onrender.com/api')`
- Refresh, the app will call that backend.

Option B: Build-time base via Vite env:
- Set `VITE_API_BASE` in the build environment and reference it in `lib/api.ts` (already supported). For GitHub Actions, you can add `VITE_API_BASE` as an Actions secret and pass it to the build step.

## 4) Local checks before pushing

- `npm run build` → verifies frontend builds
- `cd backend && npm start` → verifies backend starts (PORT=3001 by default)

## 5) Troubleshooting

- If SPA routes 404 on Pages, ensure `dist/404.html` exists (workflow handles this).
- If backend shows 502 on Render, check logs; confirm `PORT` env is respected and Postgres URL is correct.
- CORS: server enables permissive CORS in non-production. In production, adjust `allowedOrigins` in `backend/server.js`.

