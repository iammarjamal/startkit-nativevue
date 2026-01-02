import { createApp } from "nativescript-vue";
import { Application } from "@nativescript/core";
import { onHmrUpdate } from "@nativescript/vite/hmr/shared/runtime/hooks";
import Home from "./components/Home.vue";
import Index from "./components/index.vue";

/**
 * Tailwind CSS HMR Handler
 *
 * Uses the official NativeScript/Vite hook.
 * Monitors app.css changes and applies them immediately.
 */

// Constant ID to avoid duplicate listeners
const HMR_HANDLER_ID = "tailwind-css-hmr";

// Register HMR handler
onHmrUpdate((payload) => {
  const { type, version, changedIds } = payload;

  console.log(`🔄 [HMR] Update received (type: ${type}, version: ${version})`);
  Application.setCssFileName("app.css");
}, HMR_HANDLER_ID);

console.log("🔌 [HMR] Tailwind CSS handler registered");

Application.setCssFileName("app.css");
createApp(Home).start();
