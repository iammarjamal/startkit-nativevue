#!/usr/bin/env node

import { spawn } from "child_process";

const args = process.argv.slice(2);
const isIos = args.includes("--ios");
const isAndroid = args.includes("--android");

if (!isIos && !isAndroid) {
  console.error("❌ Please specify --ios or --android");
  process.exit(1);
}

const platformEnv = isIos ? "--env.ios" : "--env.android";

// Vite now handles everything: CSS processing + HMR + serving
const child = spawn(
  "vite",
  ["serve", "--host", "0.0.0.0", "--", platformEnv, "--env.hmr"],
  { stdio: "inherit", shell: true }
);

child.on("close", (code) => process.exit(code));
