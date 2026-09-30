import { chmod } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const variant = (process.argv[2] || 'debug').toLowerCase();
if (!['debug', 'release'].includes(variant)) {
  throw new Error('Build variant must be debug or release.');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['scripts/prepare-android.mjs']);

const androidDir = new URL('../android/', import.meta.url);
let wrapper;
if (process.platform === 'win32') {
  wrapper = 'gradlew.bat';
} else {
  await chmod(new URL('../android/gradlew', import.meta.url), 0o755);
  wrapper = './gradlew';
}

if (variant === 'debug') {
  run(wrapper, ['assembleDebug', '--stacktrace'], { cwd: androidDir });
  console.log('Debug APK created at android/app/build/outputs/apk/debug/app-debug.apk');
} else {
  run(wrapper, ['assembleRelease', 'bundleRelease', '--stacktrace'], { cwd: androidDir });
  console.log('Release APK/AAB build complete.');
}
