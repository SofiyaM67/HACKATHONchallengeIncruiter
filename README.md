# InCruiter Integrity Monitor

Zero-install browser prototype for the **Catch the Invisible AI Cheater** hackathon. A mock interview runs entirely in the web session; client-side detectors emit weighted integrity signals, aggregate into a **clean / suspicious / high** risk score, and surface evidence on a reviewer dashboard. Signals are **advisory only** never an automatic rejection.
Application Link:  [Link](serene-croissant-6d2c12.netlify.app) 
## One-command run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000), create a session, copy the candidate link, and run a live demo.

## Development

```bash
npm install
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173) (proxied API/WebSocket)
- API: [http://localhost:3000](http://localhost:3000)

## Live demo script

1. Create a session from the home page (opens reviewer view).
2. Copy the candidate URL and open it in another window.
3. Grant consent on the candidate page.
4. Push a question from the reviewer dashboard.
5. On the candidate page, click **Simulate overlay assist (demo)** or paste a long answer after a pause.
6. Watch the reviewer timeline and risk score update in real time.

## Stack

- **Server:** Node.js, Express, Socket.IO, TypeScript
- **Web:** React, Vite, TypeScript

## Open source

- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)

See [WRITEUP.md](./WRITEUP.md) for detection approach, coverage, and limits.

## Deploy (Vercel / Netlify)

Frontend on **Netlify**, API on **Render** (Socket.IO).
