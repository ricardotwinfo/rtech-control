import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { readdir } from 'node:fs/promises';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function collectTs(dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) await collectTs(full, out);
    else if (e.isFile() && e.name.endsWith('.ts')) out.push(relative(root, full));
  }
  return out;
}

const entryPoints = [
  ...(await collectTs(resolve(root, 'server'))),
  'src/lib/finance-service.ts',
  'src/lib/expense-templates.ts',
];

await build({
  entryPoints,
  outdir: '.',
  outbase: '.',
  format: 'esm',
  platform: 'node',
  target: 'node20',
  bundle: false,
  sourcemap: false,
  logLevel: 'info',
  absWorkingDir: root,
});

console.log(`Transpiled ${entryPoints.length} files.`);
