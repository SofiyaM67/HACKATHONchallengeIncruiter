import net from "node:net";

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, "127.0.0.1");
  });
}

export async function findAvailablePort(preferredPort: number, maxAttempts = 25): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const port = preferredPort + offset;
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No free port in range ${preferredPort}-${preferredPort + maxAttempts - 1}`);
}
