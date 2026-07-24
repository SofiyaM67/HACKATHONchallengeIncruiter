export function resolveCorsOrigins(): string[] | true {
  const raw = process.env.FRONTEND_URL?.trim();
  if (!raw || raw === "*") return true;
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const NETLIFY_ORIGIN = /^https:\/\/([a-z0-9-]+--)?[a-z0-9-]+\.netlify\.app$/i;
const LOCAL_DEV = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export function isOriginAllowed(origin: string | undefined, configured: string[] | true): boolean {
  if (!origin) return true;
  if (configured === true) return true;
  if (configured.includes(origin)) return true;
  if (NETLIFY_ORIGIN.test(origin)) return true;
  if (LOCAL_DEV.test(origin)) return true;
  return false;
}

export function corsOriginDelegate(configured: string[] | true) {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    if (isOriginAllowed(origin, configured)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  };
}
