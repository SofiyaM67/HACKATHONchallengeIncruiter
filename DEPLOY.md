# Deploy to Vercel / Netlify (+ API on Render)

Real-time updates use **Socket.IO**, which needs a always-on Node server. **Vercel and Netlify host the React app only.** Deploy the API to **Render** (free tier), then point the frontend at it.

## 1. Push code to GitHub

Create a repo and push this project.

## 2. Deploy the API (Render)

1. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint** (or **Web Service**).
2. Connect the repo. If using Blueprint, Render reads [`render.yaml`](./render.yaml).
3. Manual web service settings:
   - **Build command:** `npm install && npm run build -w server`
   - **Start command:** `npm run start -w server`
   - **Environment variables:**
     - `SERVE_WEB` = `false`
     - `RENDER` = `true`
     - `FRONTEND_URL` = your Vercel or Netlify URL (comma-separated if both), e.g.  
       `https://incruiter.vercel.app,https://incruiter.netlify.app`
4. After deploy, copy the API URL, e.g. `https://incruiter-integrity-api.onrender.com`.

Render free tier may sleep after inactivity; first request can take ~30s.

## 3A. Deploy frontend on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
2. **Environment variable** (Production + Preview):
   - `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com` (no trailing slash)
3. Vercel picks up [`vercel.json`](./vercel.json): build `web`, publish `web/dist`.
4. Deploy, then add the Vercel URL to Render `FRONTEND_URL` if you had not already.

CLI:

```bash
npm i -g vercel
cd D:\Incruiter
vercel
vercel env add VITE_API_URL production
vercel --prod
```

## 3B. Deploy frontend on Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. Build settings come from [`netlify.toml`](./netlify.toml).
3. **Site configuration → Environment variables:**
   - `VITE_API_URL` = `https://YOUR-RENDER-URL.onrender.com`
4. **Deploy site**, then add the Netlify URL to Render `FRONTEND_URL`.

## 4. Verify

1. Open the Vercel/Netlify URL → create a session.
2. Open the candidate link in another tab.
3. Ask a question and paste an answer → reviewer should show **Suspicious** and saved answers.

If API calls fail, check browser DevTools → Network (CORS / wrong `VITE_API_URL`). If live updates lag, confirm WebSocket to the Render host (not blocked by corporate firewall).

## All-in-one local / single host

`npm start` still serves API + built web on one port (no `VITE_API_URL` needed).

## Optional: Railway instead of Render

- **Build:** `npm install && npm run build -w server`
- **Start:** `npm run start -w server`
- **Env:** `SERVE_WEB=false`, `FRONTEND_URL=<your frontend URLs>`

Railway sets `RAILWAY_ENVIRONMENT`; the server binds to `PORT` without scanning other ports.
