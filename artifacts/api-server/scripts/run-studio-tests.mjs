import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const directory = await mkdtemp(path.join(tmpdir(), "alwatan-studio-tests-"));
try {
  const outputs = [];
  for (const realAuthorization of [false, true]) {
    const testFile = realAuthorization ? "studio-authorization.test.mjs" : "studio.test.mjs";
    const output = path.join(directory, testFile);
    outputs.push(output);
    await build({
      entryPoints: [`tests/${testFile}`], outfile: output,
      bundle: true, platform: "node", format: "esm",
      plugins: [{
        name: "isolated-studio-boundaries",
        setup(build) {
          build.onResolve({ filter: /^@workspace\/db$/ }, () => ({
            path: path.resolve(`tests/fixtures/${realAuthorization ? "studio-authorization-db.mjs" : "studio-db.mjs"}`),
          }));
          build.onResolve({ filter: /^@workspace\/api-zod$/ }, () => ({
            path: path.resolve("../../lib/api-zod/src/index.ts"),
          }));
          build.onResolve({ filter: /\/lib\/auth$/ }, () => ({
            path: path.resolve(realAuthorization ? "src/lib/auth.ts" : "tests/fixtures/studio-auth.mjs"),
          }));
          build.onResolve({ filter: /^\.\/admin-session$/ }, () => ({
            path: path.resolve("tests/fixtures/admin-session.mjs"),
          }));
          // Keep external node packages resolvable even though output is in /tmp.
          build.onResolve({ filter: /^(express|cookie-parser|drizzle-orm)(\/.*)?$/ }, args => ({
            path: import.meta.resolve(args.path).replace(/^file:\/\//, ""), external: true,
          }));
        },
      }],
    });
  }
  // Allowlist only: no DB URL, bootstrap credentials, Clerk, or storage secrets.
  const child = spawn(process.execPath, ["--test", ...outputs], {
    env: { PATH: process.env.PATH, NODE_ENV: "test" }, stdio: "inherit",
  });
  process.exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", code => resolve(code ?? 1));
  });
} finally { await rm(directory, { recursive: true, force: true }); }
