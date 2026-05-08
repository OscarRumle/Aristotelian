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
            proxy.on("proxyReq", (proxyReq, req) => {
              const userKey = req.headers["x-user-anthropic-key"];
              const userVer = req.headers["x-user-anthropic-version"];
              const effectiveKey = (typeof userKey === "string" && userKey) || apiKey;
              const effectiveVer = (typeof userVer === "string" && userVer) || anthropicVersion;
              if (effectiveKey) proxyReq.setHeader("x-api-key", effectiveKey);
              proxyReq.setHeader("anthropic-version", effectiveVer);
              proxyReq.removeHeader("x-user-anthropic-key");
              proxyReq.removeHeader("x-user-anthropic-version");
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
            proxy.on("proxyReq", (proxyReq, req) => {
              const userId = req.headers["x-user-higgsfield-id"];
              const userSecret = req.headers["x-user-higgsfield-secret"];
              const haveUserPair = typeof userId === "string" && userId && typeof userSecret === "string" && userSecret;
              const effectiveAuth = haveUserPair ? `Key ${userId}:${userSecret}` : hfAuth;
              if (effectiveAuth) proxyReq.setHeader("Authorization", effectiveAuth);
              proxyReq.setHeader("User-Agent", "aristotelian-dev/1.0");
              proxyReq.removeHeader("x-user-higgsfield-id");
              proxyReq.removeHeader("x-user-higgsfield-secret");
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
          },
        },
      },
    },
  };
});
