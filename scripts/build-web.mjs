import { cp, mkdir, rm, stat } from 'node:fs/promises';

const OUT = new URL('../www/', import.meta.url);
const ROOT = new URL('../', import.meta.url);
const files = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.svg',
  'icon-512.svg',
  'sw.js'
];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const file of files) {
  const src = new URL(file, ROOT);
  try {
    await stat(src);
    await cp(src, new URL(file, OUT), { recursive: true });
  } catch (error) {
    throw new Error(`Missing web asset: ${file}`, { cause: error });
  }
}

console.log('Swole Cat web assets copied to www/');
