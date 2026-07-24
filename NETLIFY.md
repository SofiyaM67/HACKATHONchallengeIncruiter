# Netlify deploy (5 minutes)

## Option A — One-click (recommended)

1. Open:  
   **https://app.netlify.com/start/deploy?repository=https://github.com/SofiyaM67/HACKATHONchallengeIncruiter**
2. Log in with **GitHub** and authorize Netlify.
3. Confirm build settings (Netlify reads `netlify.toml`):
   - Build: `npm ci && npm run build -w web`
   - Publish: `web/dist`
4. **Before or right after first deploy**, add an environment variable:
   - **Site configuration → Environment variables**
   - `VITE_API_URL` = your Render API URL (see below)
5. **Trigger deploy** again so Vite picks up `VITE_API_URL`.

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
