import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
// Never pass workspace auth, storage or database credentials into component tests.
const env = Object.fromEntries(
  ['PATH', 'HOME', 'TMPDIR', 'XDG_CACHE_HOME', 'LD_LIBRARY_PATH', 'CI']
    .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]])
);
const cli = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
const child = spawn(process.execPath, [
  cli, 'run', '--config', 'vitest.config.ts',
  'tests/use-media-upload.test.tsx', 'tests/media-components.test.tsx', 'tests/admin-certificates.test.tsx',
], { env, stdio: 'inherit' });
child.on('error', () => { console.error('Unable to start media tests'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
