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

const signingEnabled = process.env.SWOLE_CAT_ENABLE_SIGNING === '1';

if (signingEnabled) {
  const required = [
    'SWOLE_CAT_SIGNING_STORE_FILE',
    'SWOLE_CAT_SIGNING_STORE_PASSWORD',
    'SWOLE_CAT_SIGNING_KEY_ALIAS',
    'SWOLE_CAT_SIGNING_KEY_PASSWORD'
  ];
  const missing = required.filter(name => !String(process.env[name] || '').trim());
  if (missing.length) {
    throw new Error(`Signing enabled but required environment variables are missing: ${missing.join(', ')}`);
  }

  if (!gradle.includes('signingConfigs {')) {
    const signingBlock = `
    signingConfigs {
        release {
            storeFile file(System.getenv("SWOLE_CAT_SIGNING_STORE_FILE"))
            storePassword System.getenv("SWOLE_CAT_SIGNING_STORE_PASSWORD")
            keyAlias System.getenv("SWOLE_CAT_SIGNING_KEY_ALIAS")
            keyPassword System.getenv("SWOLE_CAT_SIGNING_KEY_PASSWORD")
        }
    }
`;

    if (!/\n\s*buildTypes\s*\{/.test(gradle)) {
      throw new Error('Could not find buildTypes block in android/app/build.gradle');
    }
    gradle = gradle.replace(/\n(\s*)buildTypes\s*\{/, `\n${signingBlock}\n$1buildTypes {`);
  }

  if (!/release\s*\{/.test(gradle)) {
    throw new Error('Could not find release build type in android/app/build.gradle');
  }
  if (!gradle.includes('signingConfig signingConfigs.release')) {
    gradle = gradle.replace(
      /release\s*\{/,
      'release {\n            signingConfig signingConfigs.release'
    );
  }
}

await writeFile(gradleUrl, gradle);

console.log(
  `Configured Android versionName=${versionName}, versionCode=${versionCode}` +
  (signingEnabled ? ', release signing enabled' : '')
);
