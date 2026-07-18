import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Frontend dev server. `/api` requests are proxied to the Express backend
// (started with `npm run server`) so the UI and API share an origin in dev.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "dist",
    },
});
