export function resolveCorsOrigins(): string[] | true {
  const raw = process.env.FRONTEND_URL?.trim();
  if (!raw || raw === "*") return true;
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}
