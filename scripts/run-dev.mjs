import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findAvailablePort } from "./findPort.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const preferred = Number(process.env.PORT ?? 3000);
const port = await findAvailablePort(preferred);

const env = { ...process.env, PORT: String(port) };
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

console.log(`Using API port ${port} (preferred ${preferred})`);

const child = spawn(
  npmCmd,
  ["exec", "concurrently", "-n", "server,web", "-c", "blue,green", "npm run dev -w server", "npm run dev -w web"],
  { cwd: root, env, stdio: "inherit", shell: process.platform === "win32" }
);

child.on("exit", (code) => process.exit(code ?? 0));
