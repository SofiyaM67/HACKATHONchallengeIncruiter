# Netlify deploy (5 minutes)

## Option A — One-click (recommended)

1. Open:  
   **https://app.netlify.com/start/deploy?repository=https://github.com/SofiyaM67/HACKATHONchallengeIncruiter**
2. Log in with **GitHub** and authorize Netlify.
3. Confirm build settings (Netlify reads `netlify.toml`):
   - Build: `npm ci && npm run build -w web`
   - Publish: `web/dist`
4. **Before or right after first deploy**, choose one:

   **Option A (simplest):** Do **not** set `VITE_API_URL`. Netlify proxies `/api` and `/socket.io` to Render (see `netlify.toml`). Redeploy after each `netlify.toml` change.

   **Option B:** Set `VITE_API_URL` = `https://incruiter-integrity-api.onrender.com` and redeploy. Render must allow your Netlify URL (latest API allows `*.netlify.app` automatically).

## API backend (required)

The Netlify site is **frontend only**. Deploy the API on Render:

1. https://dashboard.render.com/ → **New** → **Blueprint** → connect the same GitHub repo (`render.yaml`).
2. Copy the service URL, e.g. `https://incruiter-integrity-api.onrender.com`.
3. Set Netlify `VITE_API_URL` to that URL (no trailing slash).
4. In Render, set `FRONTEND_URL` to your Netlify URL, e.g. `https://YOUR-SITE.netlify.app`.

## Option B — CLI

```bash
npm ci
npm run build -w web
npx netlify login
npx netlify init
npx netlify env:set VITE_API_URL "https://YOUR-RENDER-URL.onrender.com"
npx netlify deploy --prod --dir=web/dist
```

## Verify

Open the Netlify URL → create session → candidate link → paste answer → reviewer shows **Suspicious**.
