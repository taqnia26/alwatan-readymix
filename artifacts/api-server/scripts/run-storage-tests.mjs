import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";

const output = ".test-build/storage.test.mjs";
await mkdir(".test-build", { recursive: true });
try {
  await build({
    entryPoints: ["../alwatan-ready-mix/tests/video-player-browser.tsx"],
    outfile: ".test-build/video-player.js", bundle: true, platform: "browser", format: "iife",
    jsx: "automatic",
    alias: { "@/lib/i18n": new URL("../tests/browser-language.ts", import.meta.url).pathname },
    define: { "process.env.NODE_ENV": '"production"' },
    tsconfig: "../alwatan-ready-mix/tsconfig.json",
  });
  await build({ entryPoints: ["tests/storage.test.mjs"], outfile: output, bundle: true, platform: "node", format: "esm", packages: "external" });
  // Allowlist only process/runtime settings: no workspace credentials, DB or sidecar.
  const env = Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "XDG_CACHE_HOME", "LD_LIBRARY_PATH", "PLAYWRIGHT_BROWSERS_PATH", "PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"]
      .filter(name => process.env[name] !== undefined).map(name => [name, process.env[name]])
  );
  // NixOS supplies a wrapped Chromium; downloaded Linux binaries may lack libraries.
  if (!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    const systemBrowser = spawnSync("which", ["chromium"], { encoding: "utf8" });
    if (systemBrowser.status === 0) env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = systemBrowser.stdout.trim();
  }
  const child = spawn(process.execPath, ["--test", output], { env, stdio: "inherit" });
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", code => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally { await rm(".test-build", { recursive: true, force: true }); }
