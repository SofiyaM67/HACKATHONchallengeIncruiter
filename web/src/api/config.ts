const RENDER_API_DEFAULT = "https://incruiter-integrity-api.onrender.com";

export function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".netlify.app") || host.endsWith(".netlify.live")) {
      return RENDER_API_DEFAULT;
    }
    return window.location.origin;
  }
  return "";
}

export function apiUrl(path: string): string {
  const base = apiOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
