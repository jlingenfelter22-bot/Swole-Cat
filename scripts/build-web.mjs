import { cp, mkdir, rm, stat, readFile, writeFile } from 'node:fs/promises';

const OUT = new URL('../www/', import.meta.url);
const ROOT = new URL('../', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const version = String(pkg.version || '').trim();

if (!version) throw new Error('package.json is missing a version');

const JS_SOURCES = [
  'src/js/00-runtime.js',
  'src/data/exercises.js',
  'src/js/01-core-runtime.js',
  'src/data/anatomy.js',
  'src/data/coach-knowledge.js',
  'src/js/02-muscle-history-analytics.js',
  'src/js/03-programs.js',
  'src/js/04a-coach-input-intent.js',
  'src/js/04b-coach-programming.js',
  'src/js/04b2-coach-intelligence.js',
  'src/js/04b3-coach-adaptive-progression.js',
  'src/js/04c-coach-language-refinement.js',
  'src/js/04d-coach-program-builder.js',
  'src/js/04e-coach-ui.js',
  'src/js/04f-coach-routine-control.js',
  'src/js/04g-coach-history-insights.js',
  'src/js/05-exercises-routines.js',
  'src/js/06-workout-engine.js',
  'src/js/07-history-editor.js',
  'src/js/08-exercise-tools.js',
  'src/js/09-settings-ui-bootstrap.js'
];
const CSS_SOURCES = [
  'src/styles/00-base.css',
  'src/styles/01-design-system.css',
  'src/styles/02-views.css',
  'src/styles/03-polish.css'
];
const STATIC_ASSETS = [
  'manifest.webmanifest',
  'icon-192.svg',
  'icon-512.svg',
  'sw.js',
  'assets'
];

async function requirePath(relativePath) {
  const url = new URL(relativePath, ROOT);
  try {
    await stat(url);
  } catch (error) {
    throw new Error(`Missing web source: ${relativePath}`, { cause: error });
  }
  return url;
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const file of STATIC_ASSETS) {
  const src = await requirePath(file);
  await cp(src, new URL(file, OUT), { recursive: true });
}

let index = await readFile(await requirePath('index.html'), 'utf8');
const sourceStyleBlock = /<!-- SWOLE_CAT_SOURCE_STYLES -->[\s\S]*?<!-- \/SWOLE_CAT_SOURCE_STYLES -->/;
const sourceScriptBlock = /<!-- SWOLE_CAT_SOURCE_SCRIPTS -->[\s\S]*?<!-- \/SWOLE_CAT_SOURCE_SCRIPTS -->/;
if (!sourceStyleBlock.test(index) || !sourceScriptBlock.test(index)) {
  throw new Error('index.html is missing modular source markers');
}
index = index.replace(sourceStyleBlock, '<link rel="stylesheet" href="./app.css">');
index = index.replace(sourceScriptBlock, '<script src="./app.js"></script>');
await writeFile(new URL('index.html', OUT), index);

const jsParts = [];
for (const file of JS_SOURCES) {
  const source = await readFile(await requirePath(file), 'utf8');
  jsParts.push(`/* ===== ${file} ===== */\n${source.trim()}\n`);
}
let appJs = jsParts.join('\n');
if (!appJs.includes('__SWOLE_CAT_VERSION__')) {
  throw new Error('Modular JavaScript is missing the app version token');
}
appJs = appJs.replaceAll('__SWOLE_CAT_VERSION__', version);
await writeFile(new URL('app.js', OUT), appJs);

const cssParts = [];
for (const file of CSS_SOURCES) {
  const source = await readFile(await requirePath(file), 'utf8');
  cssParts.push(`/* ===== ${file} ===== */\n${source.trim()}\n`);
}
await writeFile(new URL('app.css', OUT), cssParts.join('\n'));

const swUrl = new URL('sw.js', OUT);
let sw = await readFile(swUrl, 'utf8');
if (!sw.includes('__SWOLE_CAT_VERSION__')) {
  throw new Error('Missing version token in sw.js');
}
sw = sw.replaceAll('__SWOLE_CAT_VERSION__', version);
await writeFile(swUrl, sw);

console.log(
  `Swole Cat v${version} built from ${JS_SOURCES.length} JavaScript modules and ${CSS_SOURCES.length} stylesheet source into www/`
);
