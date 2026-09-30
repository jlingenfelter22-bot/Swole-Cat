import { readFile, writeFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const versionName = String(pkg.version || '').trim();
const versionCode = Number(pkg.swoleCat?.androidVersionCode);
const gradleUrl = new URL('../android/app/build.gradle', import.meta.url);

if (!versionName) throw new Error('package.json is missing version');
if (!Number.isInteger(versionCode) || versionCode < 1) {
  throw new Error('package.json swoleCat.androidVersionCode must be a positive integer');
}

let gradle = await readFile(gradleUrl, 'utf8');

if (!/\bversionCode\s+\d+/.test(gradle)) {
  throw new Error('Could not find versionCode in android/app/build.gradle');
}
if (!/\bversionName\s+["'][^"']+["']/.test(gradle)) {
  throw new Error('Could not find versionName in android/app/build.gradle');
}

gradle = gradle.replace(/\bversionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/\bversionName\s+["'][^"']+["']/, `versionName "${versionName}"`);

await writeFile(gradleUrl, gradle);

console.log(`Configured Android versionName=${versionName}, versionCode=${versionCode}`);
