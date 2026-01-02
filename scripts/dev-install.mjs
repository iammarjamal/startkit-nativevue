#!/usr/bin/env node

import { spawn } from "child_process";

const args = process.argv.slice(2);
const isIos = args.includes("--ios");
const isAndroid = args.includes("--android");

if (!isIos && !isAndroid) {
  console.error("❌ Please specify --ios or --android");
  process.exit(1);
}

const platform = isIos ? "ios" : "android";
const otherArgs = args.filter((a) => a !== "--ios" && a !== "--android");

const cmd = `ns debug ${platform} ${otherArgs.join(" ")}`;
console.log(`🚀 Running: ${cmd}`);

const child = spawn(cmd, { stdio: "inherit", shell: true });
child.on("close", (code) => process.exit(code));
