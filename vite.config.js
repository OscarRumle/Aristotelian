import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY || "";
  const anthropicVersion = env.ANTHROPIC_VERSION || "2023-06-01";
  const hfKeyId = env.HIGGSFIELD_KEY_ID || "";
  const hfKeySecret = env.HIGGSFIELD_KEY_SECRET || "";
  const hfAuth = hfKeyId && hfKeySecret ? `Key ${hfKeyId}:${hfKeySecret}` : "";

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          landing: resolve(__dirname, "landing.html"),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (apiKey) proxyReq.setHeader("x-api-key", apiKey);
              proxyReq.setHeader("anthropic-version", anthropicVersion);
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
          },
        },
        "/api/higgsfield": {
          target: "https://platform.higgsfield.ai",
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/higgsfield/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (hfAuth) proxyReq.setHeader("Authorization", hfAuth);
              proxyReq.setHeader("User-Agent", "aristotelian-dev/1.0");
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
          },
        },
      },
    },
  };
});
