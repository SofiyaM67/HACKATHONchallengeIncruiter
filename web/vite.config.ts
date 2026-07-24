import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiPort = Number(process.env.PORT ?? 3000);
const apiOrigin = `http://localhost:${apiPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": apiOrigin,
      "/socket.io": {
        target: apiOrigin,
        ws: true,
      },
    },
  },
});
