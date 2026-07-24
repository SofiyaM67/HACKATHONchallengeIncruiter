export function apiOrigin(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function apiUrl(path: string): string {
  const base = apiOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
