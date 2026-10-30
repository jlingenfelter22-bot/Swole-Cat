import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const provider=fs.readFileSync('src/js/10c-supabase-auth-provider.js','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');
const capacitor=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));

assert.match(pkg.version,/^\d+\.\d+\.\d+$/,'package version should be a semantic x.y.z app version');
assert(Number.isInteger(pkg.swoleCat.androidVersionCode)&&pkg.swoleCat.androidVersionCode>=1,'Android versionCode should be a positive integer');
assert.equal(pkg.dependencies['@capacitor/browser'],'8.0.5','Android OAuth should use the pinned official Browser plugin');
assert.equal(capacitor.appId,'com.jlingenfelter.swolecat','Beta package must remain independent from Testing');
assert.equal(capacitor.appName,'Swole Cat','Beta must retain its own app name');

assert.match(provider,/SWOLE_CAT_ANDROID_AUTH_SCHEME='__SWOLE_CAT_ANDROID_AUTH_SCHEME__'/);
assert.match(provider,/SWOLE_CAT_ANDROID_AUTH_REDIRECT=SWOLE_CAT_ANDROID_AUTH_SCHEME\+'[:][/][/]auth[/]callback'/);
assert.match(provider,/skipBrowserRedirect:true/);
assert.match(provider,/exchangeCodeForSession\(code\)/);
assert.match(provider,/addListener\?\.\('appUrlOpen'/);
assert.match(provider,/getLaunchUrl\?\.\(\)/);
assert.match(provider,/capacitorPlugin\('Browser'\)/);
assert.match(provider,/scope:'local'/,'sign-out must remain device-local');
assert.match(provider,/detectSessionInUrl:!isNativeApp\(\)/);

assert.match(configure,/ANDROID_AUTH_SCHEME=String\(capacitorConfig\.appId\|\|''\)\.trim\(\)/);
const build=fs.readFileSync('scripts/build-web.mjs','utf8');
assert.match(build,/__SWOLE_CAT_ANDROID_AUTH_SCHEME__/);
assert.match(configure,/ANDROID_AUTH_HOST='auth'/);
assert.match(configure,/ANDROID_AUTH_PATH='\/callback'/);
assert.match(configure,/android\.intent\.action\.VIEW/);
assert.match(configure,/android\.intent\.category\.BROWSABLE/);
assert.match(configure,/android:pathPrefix=/);

console.log('Swole Cat v0.69.4 Android OAuth deep-link contract PASS');
