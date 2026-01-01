import { defineConfig, mergeConfig, UserConfig } from "vite";
import { vueConfig } from "@nativescript/vite";
import os from "os";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

// دالة جلب عنوان الشبكة (كما هي في كودك)
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

/**
 * Plugin مخصص لغرضين:
 * 1. بناء CSS تلقائياً عند تغير الملفات (بدلاً من عملية منفصلة).
 * 2. تقديم ملف app.css كنص خام (Raw) ومنع Vite من تحويله إلى JS.
 * 3. إرسال إشارة مخصصة للتطبيق عند تغير الملف لإعادة تحميل الستايل.
 */
function tailwindNativePlugin(): import("vite").Plugin {
  let isBuilding = false;

  const buildCss = () => {
    if (isBuilding) return;
    isBuilding = true;

    // استخدام أمر البناء الموجود في package.json
    exec("bun run css:build", (error, stdout, stderr) => {
      isBuilding = false;
      if (error) {
        console.error(`[Tailwind] Build error: ${error.message}`);
        return;
      }
      if (stderr && !stderr.includes("Finished")) {
        // تجاهل رسائل النجاح العادية
        console.error(`[Tailwind] ${stderr}`);
      }
      // console.log(`[Tailwind] Rebuilt successfully`);
    });
  };

  return {
    name: "tailwind-native-plugin",

    configureServer(server) {
      // بناء أولي عند التشغيل
      console.log("[Tailwind] Starting initial build...");
      buildCss();

      // إضافة ملف app.css للمراقبة
      const appCssPath = path.resolve(process.cwd(), "src/app.css");
      server.watcher.add(appCssPath);

      // مراقبة التغييرات
      server.watcher.on("change", (file) => {
        // إذا تغير ملف المصدر (Vue/TS/CSS) -> أعد بناء CSS
        if (
          file.match(/\.(vue|ts|js)$/) ||
          (file.endsWith(".css") && !file.includes("app.css"))
        ) {
          // console.log(`[Tailwind] File changed: ${path.basename(file)}, rebuilding CSS...`);
          buildCss();
        }

        // إذا تغير ملف app.css الناتج -> أرسل إشارة للتطبيق
        if (file.includes("src/app.css")) {
          console.log("⚡ CSS updated, sending HMR event...");
          server.ws.send({
            type: "custom",
            event: "ns:style-update",
            data: { timestamp: Date.now() },
          });
        }
      });

      // Middleware لتقديم ملف CSS الخام
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url?.endsWith("/src/app.css")) {
          if (fs.existsSync(appCssPath)) {
            const css = fs.readFileSync(appCssPath, "utf-8");
            res.setHeader("Content-Type", "text/css");
            res.setHeader("Cache-Control", "no-cache");
            res.end(css);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }): UserConfig => {
  return mergeConfig(vueConfig({ mode }), {
    plugins: [tailwindNativePlugin()],
    assetsInclude: ["src/app.css"],

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
