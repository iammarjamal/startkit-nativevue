import { defineConfig, mergeConfig, UserConfig } from "vite";
import { vueConfig } from "@nativescript/vite";
import os from "os";
import { nativescriptTailwindcss } from "./postcss-plugins/nativescript-tailwindcss-vite.mjs";

// ============================================
// Network Host Detection
// ============================================

function getHost() {
  if (process.env.HMR_HOST) return process.env.HMR_HOST;
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return entry.address;
      }
    }
  }
  return "127.0.0.1";
}

const host = getHost();
const port = 5173;

// ============================================
// Vite Configuration
// ============================================

export default defineConfig(({ mode }): UserConfig => {
  return mergeConfig(vueConfig({ mode }), {
    plugins: [
      nativescriptTailwindcss({
        source: "src/styles/tailwind.css",
        output: "src/app.css",
      }),
    ],

    server: {
      host: "0.0.0.0",
      port,
      hmr: {
        host,
        port,
        protocol: "ws",
      },
    },
  });
});
