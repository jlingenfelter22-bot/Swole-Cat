import { cp, mkdir, rm, stat, readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../www/', import.meta.url);
const ROOT = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const version = String(pkg.version || '').trim();

if (!version) throw new Error('package.json is missing a version');

const files = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.svg',
  'icon-512.svg',
  'sw.js',
  'assets'
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

for (const file of ['index.html', 'sw.js']) {
  const target = new URL(file, OUT);
  let contents = await readFile(target, 'utf8');
  if (!contents.includes('__SWOLE_CAT_VERSION__')) {
    throw new Error(`Missing version token in ${file}`);
  }
  contents = contents.replaceAll('__SWOLE_CAT_VERSION__', version);
  await writeFile(target, contents);
}

console.log(`Swole Cat v${version} web assets copied to www/`);
