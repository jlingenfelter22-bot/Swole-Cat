import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

function executable(name) {
  if (process.platform !== 'win32') return name;
  if (name === 'npm') return 'npm.cmd';
  if (name === 'npx') return 'npx.cmd';
  return name;
}

function run(name, args, options = {}) {
  const result = spawnSync(executable(name), args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('npm', ['run', 'build:web']);

let androidExists = true;
try {
  await access(new URL('../android/', import.meta.url));
} catch {
  androidExists = false;
}

if (!androidExists) {
  run('npx', ['cap', 'add', 'android']);
}

run('npx', ['cap', 'sync', 'android']);
run('npx', [
  'capacitor-assets',
  'generate',
  '--android',
  '--assetPath',
  'resources',
  '--iconBackgroundColor',
  '#0b0d12',
  '--iconBackgroundColorDark',
  '#0b0d12',
  '--splashBackgroundColor',
  '#0b0d12',
  '--splashBackgroundColorDark',
  '#0b0d12'
]);
run(process.execPath, ['scripts/configure-android.mjs']);

console.log('Android project prepared and synchronized.');
