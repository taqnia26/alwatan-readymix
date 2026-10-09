import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";

const output = ".test-build/storage.test.mjs";
await mkdir(".test-build", { recursive: true });
try {
  await build({ entryPoints: ["tests/storage.test.mjs"], outfile: output, bundle: true, platform: "node", format: "esm", packages: "external" });
  const env = { ...process.env };
  // This pass intentionally cannot use workspace credentials, a database, or the sidecar.
  for (const name of ["DATABASE_URL", "PRIVATE_OBJECT_DIR", "DEFAULT_OBJECT_STORAGE_BUCKET_ID", "PUBLIC_OBJECT_SEARCH_PATHS", "MEDIA_STORAGE_DRIVER", "MEDIA_STORAGE_DIR"]) delete env[name];
  const child = spawn(process.execPath, ["--test", output], { env, stdio: "inherit" });
  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", code => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally { await rm(".test-build", { recursive: true, force: true }); }
