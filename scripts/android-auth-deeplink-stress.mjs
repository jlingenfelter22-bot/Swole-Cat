import fs from 'node:fs';
import assert from 'node:assert/strict';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const provider=fs.readFileSync('src/js/10c-supabase-auth-provider.js','utf8');
const configure=fs.readFileSync('scripts/configure-android.mjs','utf8');
const capacitor=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));

assert.equal(pkg.version,'0.73.1');
assert.equal(pkg.swoleCat.androidVersionCode,104);
assert.equal(pkg.dependencies['@capacitor/browser'],'8.0.5','Android OAuth should use the pinned official Browser plugin');
assert(['com.jlingenfelter.swolecat.testing','com.jlingenfelter.swolecat'].includes(capacitor.appId));
assert(['Swole Cat Testing','Swole Cat'].includes(capacitor.appName));

assert.match(provider,/__SWOLE_CAT_ANDROID_AUTH_SCHEME__/);
assert.match(provider,/SWOLE_CAT_ANDROID_AUTH_SCHEME\+'[:][/]\/[']auth\/callback/);
assert.match(provider,/skipBrowserRedirect:true/);
assert.match(provider,/exchangeCodeForSession\(code\)/);
assert.match(provider,/addListener\?\.\('appUrlOpen'/);
assert.match(provider,/getLaunchUrl\?\.\(\)/);
assert.match(provider,/capacitorPlugin\('Browser'\)/);
assert.match(provider,/scope:'local'/,'sign-out must remain device-local');
assert.match(provider,/detectSessionInUrl:!isNativeApp\(\)/);

assert.match(configure,/ANDROID_AUTH_SCHEME=String\(capacitorConfig\.appId/);
assert.match(configure,/ANDROID_AUTH_HOST='auth'/);
assert.match(configure,/ANDROID_AUTH_PATH='\/callback'/);
assert.match(configure,/android\.intent\.action\.VIEW/);
assert.match(configure,/android\.intent\.category\.BROWSABLE/);
assert.match(configure,/android:pathPrefix=/);

console.log('Swole Cat Android OAuth deep-link contract PASS: auth scheme follows Testing/Beta package identity');
