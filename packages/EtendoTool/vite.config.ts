import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      "@workspaceui/componentlibrary": path.resolve(__dirname, "../ComponentLibrary/src"),
      "@workspaceui/componentlibrary/theme": path.resolve(__dirname, "../ComponentLibrary/src/theme"),
    },
    dedupe: ["react", "react-dom", "@mui/material", "@mui/system", "@emotion/react", "@emotion/styled"],
  },
  optimizeDeps: {
    include: [
      "@mui/material",
      "@mui/material/styles",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
      "@mui/system",
    ],
  },
  define: {
    "process.env": {},
  },
  server: {
    host: "0.0.0.0",
    port: 4176,
    proxy: {
      "/api/erp": {
        target: "http://localhost:8080/etendo",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/erp/, "/sws"),
      },
      "/api": {
        target: "http://localhost:3851",
        changeOrigin: true,
      },
      "/sws": {
        target: "http://localhost:8080/etendo",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
