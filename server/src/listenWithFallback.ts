import type { Server } from "http";

export async function listenWithFallback(
  server: Server,
  preferredPort: number,
  maxAttempts = 25
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const port = preferredPort + offset;
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: NodeJS.ErrnoException) => {
          server.removeListener("error", onError);
          reject(err);
        };
        server.once("error", onError);
        server.listen(port, () => {
          server.removeListener("error", onError);
          resolve();
        });
      });
      return port;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EADDRINUSE" && code !== "EACCES") throw err;
    }
  }
  throw new Error(`No free port in range ${preferredPort}-${preferredPort + maxAttempts - 1}`);
}
