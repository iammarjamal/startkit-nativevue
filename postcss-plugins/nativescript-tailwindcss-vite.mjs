/**
 * @nativescript/tailwindcss-vite
 *
 * Vite Plugin for NativeScript + Tailwind CSS Integration
 *
 * Features:
 * - Processes Tailwind CSS through PostCSS pipeline
 * - Writes output to disk (required for NativeScript runtime)
 * - Sends HMR updates to the app with configurable delay
 * - Serves CSS with cache-busting headers
 *
 * @module @nativescript/tailwindcss-vite
 * @version 1.0.0
 */

import fs from "fs";
import path from "path";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import cleanNative from "./clean-native.mjs";
import expandAnimations from "./expand-animations.mjs";

/**
 * @typedef {Object} PluginOptions
 * @property {string} [source="src/styles/tailwind.css"] - Source CSS file path
 * @property {string} [output="src/app.css"] - Output CSS file path
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {number} [hmrDelay=300] - Delay in ms before sending HMR update
 */

/**
 * Creates the NativeScript Tailwind CSS Vite Plugin
 * @param {PluginOptions} options
 * @returns {import("vite").Plugin}
 */
export function nativescriptTailwindcss(options = {}) {
  const {
    source = "src/styles/tailwind.css",
    output = "src/app.css",
    debug = process.env.POSTCSS_DEBUG === "true",
    hmrDelay = 300,
  } = options;

  // PostCSS Processor (Singleton)
  const processor = postcss([
    tailwindcss,
    cleanNative({ debug }),
    expandAnimations({ debug }),
  ]);

  let appCssPath = "";
  let sourceCssPath = "";
  let isBuilding = false;

  /**
   * Process CSS with PostCSS and write to disk
   */
  async function processCss() {
    const sourceContent = fs.readFileSync(sourceCssPath, "utf-8");

    const result = await processor.process(sourceContent, {
      from: sourceCssPath,
      to: appCssPath,
    });

    // Write to disk synchronously (NativeScript requirement)
    fs.writeFileSync(appCssPath, result.css, "utf-8");

    return result.css;
  }

  /**
   * Debounced delay helper
   */
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return {
    name: "@nativescript/tailwindcss-vite",
    enforce: "pre",

    configResolved(config) {
      // Resolve paths based on root
      appCssPath = path.resolve(config.root, output);
      sourceCssPath = path.resolve(config.root, source);
    },

    // Build initial CSS on server start
    async buildStart() {
      console.log("🎨 [@ns/tailwind] Building initial app.css...");
      const start = Date.now();
      await processCss();
      console.log(
        `✅ [@ns/tailwind] Initial build complete in ${Date.now() - start}ms`
      );
    },

    configureServer(server) {
      // Middleware to serve CSS with no-cache headers
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url?.endsWith("/src/app.css") || url?.endsWith("/app.css")) {
          if (fs.existsSync(appCssPath)) {
            const css = fs.readFileSync(appCssPath, "utf-8");
            res.setHeader("Content-Type", "text/css");
            res.setHeader(
              "Cache-Control",
              "no-cache, no-store, must-revalidate"
            );
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
            res.end(css);
            return;
          }
        }
        next();
      });
    },

    async handleHotUpdate({ file, server }) {
      // Avoid infinite loops and concurrent builds
      if (file === appCssPath || isBuilding) {
        return;
      }

      // Only rebuild for files that might affect CSS
      const shouldRebuild = /\.(vue|ts|js|css)$/.test(file);

      if (shouldRebuild) {
        isBuilding = true;

        try {
          const start = Date.now();
          const fileName = path.basename(file);

          console.log(
            `⏳ [hmr-ws] Processing .${path.extname(file).slice(1)} file update... waiting ${hmrDelay}ms`
          );

          // Process CSS first
          await processCss();

          // Wait for the configured delay to ensure CSS is fully written
          await delay(hmrDelay);

          const duration = Date.now() - start;
          console.log(
            `✅ [@ns/tailwind] Rebuild complete in ${duration}ms (${fileName})`
          );

          // Invalidate module graph
          const appCssModule = server.moduleGraph.getModuleById(appCssPath);
          if (appCssModule) {
            server.moduleGraph.invalidateModule(appCssModule);
          }

          // Send HMR update to client
          server.ws.send({
            type: "update",
            updates: [
              {
                type: "css-update",
                path: "/src/app.css",
                timestamp: Date.now(),
                acceptedPath: "/src/app.css",
              },
            ],
          });
        } catch (error) {
          console.error("❌ [@ns/tailwind] Build failed:", error);
        } finally {
          isBuilding = false;
        }
      }

      // Don't block other HMR updates
      return;
    },
  };
}

export default nativescriptTailwindcss;
